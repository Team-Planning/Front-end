import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Alert,
  Snackbar,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  AddPhotoAlternate as AddPhotoIcon,
  CheckCircle as CheckIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import publicacionesService, { CreatePublicacionDto, Multimedia } from '../../services/publicaciones.service';
import categoriasService, { Categoria } from '../../services/categorias.service';
import uploadService, { CloudinaryUploadResult } from '../../services/upload.service';

interface ImagePreview {
  file: File;
  preview: string;
  cloudinaryData?: CloudinaryUploadResult;
}

const CreatePublicacion = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoriaId: '',
    precio: '',
  });

  const [errors, setErrors] = useState({
    titulo: '',
    descripcion: '',
    categoriaId: '',
    precio: '',
  });

  useEffect(() => {
    loadCategorias();
    // Cleanup: liberar URLs de objetos al desmontar
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [images]);

  const loadCategorias = async () => {
    try {
      const data = await categoriasService.getActive();
      setCategorias(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Limpiar error del campo
    setErrors({ ...errors, [field]: '' });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Validar cantidad total (máximo 10 imágenes)
    if (images.length + fileArray.length > 10) {
      setSnackbar({ 
        open: true, 
        message: 'No puedes subir más de 10 imágenes en total', 
        severity: 'error' 
      });
      return;
    }

    // Validar cada archivo
    const validation = uploadService.validateMultipleImages(fileArray, 10 - images.length);
    if (!validation.valid) {
      setSnackbar({ open: true, message: validation.error || 'Error en validación', severity: 'error' });
      return;
    }

    // Crear previsualizaciones
    const newImages: ImagePreview[] = fileArray.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages([...images, ...newImages]);
    
    // Resetear input para permitir seleccionar los mismos archivos de nuevo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (index: number) => {
    const imageToRemove = images[index];
    URL.revokeObjectURL(imageToRemove.preview);
    
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    
    if (currentImageIndex >= newImages.length && newImages.length > 0) {
      setCurrentImageIndex(newImages.length - 1);
    } else if (newImages.length === 0) {
      setCurrentImageIndex(0);
    }
  };

  const validateForm = (): boolean => {
    const newErrors = {
      titulo: '',
      descripcion: '',
      categoriaId: '',
      precio: '',
    };

    let isValid = true;

    if (!formData.titulo || formData.titulo.length < 5) {
      newErrors.titulo = 'El título debe tener al menos 5 caracteres';
      isValid = false;
    }

    if (!formData.descripcion || formData.descripcion.length < 10) {
      newErrors.descripcion = 'La descripción debe tener al menos 10 caracteres';
      isValid = false;
    }

    if (!formData.categoriaId) {
      newErrors.categoriaId = 'Debes seleccionar una categoría';
      isValid = false;
    }

    if (!formData.precio) {
      newErrors.precio = 'El precio es obligatorio';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setSnackbar({ open: true, message: 'Por favor completa todos los campos requeridos', severity: 'error' });
      return;
    }

    if (images.length === 0) {
      setSnackbar({ open: true, message: 'Debes agregar al menos una imagen', severity: 'error' });
      return;
    }

    try {
      setLoading(true);
      setUploadingImages(true);

      // 1. Subir todas las imágenes a Cloudinary
      const filesToUpload = images.map(img => img.file);
      const uploadedImages = await uploadService.uploadMultipleImages(filesToUpload);

      setUploadingImages(false);

      // 2. Crear el array de multimedia con las URLs de Cloudinary
      const multimedia: Multimedia[] = uploadedImages.map((img, index) => ({
        url: img.url,
        cloudinaryPublicId: img.publicId,
        orden: index + 1,
        tipo: 'imagen',
      }));

      // 3. Crear la publicación con las imágenes subidas
      const dto: CreatePublicacionDto = {
        id_vendedor: 'vendedor_demo_001',
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        categoriaId: formData.categoriaId,
        multimedia,
      };

      const publicacion = await publicacionesService.create(dto);
      
      setSnackbar({ open: true, message: 'Publicación creada exitosamente', severity: 'success' });
      
      // Redirigir después de 1.5 segundos
      setTimeout(() => {
        navigate(`/publicaciones/${publicacion.id}`);
      }, 1500);
    } catch (error: unknown) {
      console.error('Error al crear publicación:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error al crear la publicación';
      setSnackbar({ 
        open: true, 
        message: errorMessage, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  return (
    <Box sx={{ backgroundColor: '#F5F5F5', minHeight: '100vh', pb: 3 }}>
      {/* Header con fondo verde */}
      <Box sx={{ backgroundColor: '#4CAF50', color: 'white', p: 2, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => navigate('/publicaciones')} sx={{ color: 'white', mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Añadir Publicación
        </Typography>
      </Box>

      {loading && <LinearProgress />}

      <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
        {/* Input oculto para seleccionar archivos */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {/* Galería de Imágenes */}
        <Card sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ position: 'relative', backgroundColor: '#E0E0E0', height: 300 }}>
            {images.length > 0 ? (
              <>
                <img
                  src={images[currentImageIndex].preview}
                  alt={`Imagen ${currentImageIndex + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                  }}
                  onClick={() => handleRemoveImage(currentImageIndex)}
                  disabled={loading}
                >
                  <CloseIcon />
                </IconButton>
                {/* Indicador de tamaño de archivo */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="caption">
                    {(images[currentImageIndex].file.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              </>
            ) : (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  cursor: 'pointer',
                }}
                onClick={handleAddImageClick}
              >
                <CloudUploadIcon sx={{ fontSize: 64, color: '#9E9E9E', mb: 2 }} />
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  Click para agregar imágenes
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Máximo 10 imágenes, 5MB cada una
                </Typography>
              </Box>
            )}
          </Box>

          {/* Thumbnails */}
          <Box sx={{ p: 2, display: 'flex', gap: 1, overflowX: 'auto' }}>
            {images.map((img, index) => (
              <Box
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                sx={{
                  width: 70,
                  height: 70,
                  flexShrink: 0,
                  border: currentImageIndex === index ? '3px solid #4CAF50' : '2px solid #E0E0E0',
                  borderRadius: 1,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <img
                  src={img.preview}
                  alt={`Thumbnail ${index + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            ))}
            
            {/* Botón agregar imagen */}
            {images.length < 10 && (
              <Box
                onClick={handleAddImageClick}
                sx={{
                  width: 70,
                  height: 70,
                  flexShrink: 0,
                  border: '2px dashed #4CAF50',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#F5F5F5',
                  '&:hover': { backgroundColor: '#E8F5E9' },
                }}
              >
                <AddPhotoIcon sx={{ color: '#4CAF50' }} />
              </Box>
            )}
          </Box>

          {/* Indicador de páginas y progreso de upload */}
          <Box sx={{ textAlign: 'center', pb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {images.length > 0 ? `${currentImageIndex + 1}/${images.length}` : '0/10 imágenes'}
            </Typography>
            {uploadingImages && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="primary">
                  Subiendo imágenes a Cloudinary...
                </Typography>
              </Box>
            )}
          </Box>
        </Card>

        {/* Formulario */}
        <Card sx={{ p: 2, borderRadius: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'bold' }}>
              TÍTULO
            </Typography>
            <TextField
              fullWidth
              placeholder="ej: AirPods Max de Apple"
              value={formData.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              error={!!errors.titulo}
              helperText={errors.titulo || `${formData.titulo.length}/100 caracteres`}
              inputProps={{ maxLength: 100 }}
              InputProps={{
                endAdornment: formData.titulo.length >= 5 && <CheckIcon sx={{ color: '#4CAF50' }} />,
              }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'bold' }}>
              DESCRIPCIÓN
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Describe tu producto..."
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              error={!!errors.descripcion}
              helperText={errors.descripcion || `${formData.descripcion.length}/1000 caracteres`}
              inputProps={{ maxLength: 1000 }}
              InputProps={{
                endAdornment: formData.descripcion.length >= 10 && <CheckIcon sx={{ color: '#4CAF50' }} />,
              }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'bold' }}>
              SELECCIONAR CATEGORÍA
            </Typography>
            <FormControl fullWidth error={!!errors.categoriaId}>
              <Select
                value={formData.categoriaId}
                onChange={(e) => handleInputChange('categoriaId', e.target.value)}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  Selecciona una categoría
                </MenuItem>
                {categorias.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </MenuItem>
                ))}
              </Select>
              {errors.categoriaId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {errors.categoriaId}
                </Typography>
              )}
            </FormControl>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'bold' }}>
              PRECIO
            </Typography>
            <TextField
              fullWidth
              placeholder="(Campo Obligatorio)"
              value={formData.precio}
              onChange={(e) => handleInputChange('precio', e.target.value)}
              error={!!errors.precio}
              helperText={errors.precio}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                endAdornment: formData.precio && <CheckIcon sx={{ color: '#4CAF50' }} />,
              }}
            />
          </Box>

          {/* Botón Subir */}
          <Button
            fullWidth
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || images.length === 0}
            sx={{
              backgroundColor: '#4CAF50',
              '&:hover': { backgroundColor: '#45A049' },
              '&:disabled': { backgroundColor: '#BDBDBD' },
              borderRadius: '25px',
              py: 1.5,
              fontSize: '16px',
              fontWeight: 'bold',
              textTransform: 'none',
            }}
          >
            {uploadingImages ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                Subiendo imágenes...
              </>
            ) : loading ? (
              'Creando publicación...'
            ) : (
              'Subir Publicación'
            )}
          </Button>
          
          {images.length === 0 && (
            <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
              Debes agregar al menos una imagen para crear la publicación
            </Typography>
          )}
        </Card>
      </Box>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreatePublicacion;
