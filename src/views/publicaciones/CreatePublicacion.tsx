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
  InputLabel,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  AddPhotoAlternate as AddPhotoIcon,
  CheckCircle as CheckIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import publicacionesService, { CreatePublicacionDto, Multimedia } from '../../services/publicaciones.service';
import uploadService, { CloudinaryUploadResult } from '../../services/upload.service';

interface ImagePreview {
  file: File;
  preview: string;
  cloudinaryData?: CloudinaryUploadResult;
}

// MOCK DE CATEGORÍAS (Solo Frontend)
const mockCategorias = [
  { id: 'tec', nombre: 'Tecnología' },
  { id: 'rop', nombre: 'Ropa y Accesorios' },
  { id: 'hog', nombre: 'Hogar y Muebles' },
  { id: 'lib', nombre: 'Libros y Apuntes' },
  { id: 'otr', nombre: 'Otros' },
];

const CreatePublicacion = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoriaMock: '',
    precio: '',
  });

  const [errors, setErrors] = useState({
    titulo: '',
    descripcion: '',
    categoriaMock: '',
    precio: '',
  });

  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [images]);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    if (images.length + fileArray.length > 6) {
      setSnackbar({ 
        open: true, 
        message: 'No puedes subir más de 6 imágenes en total', 
        severity: 'error' 
      });
      return;
    }

    const validation = uploadService.validateMultipleImages(fileArray, 6 - images.length);
    if (!validation.valid) {
      setSnackbar({ open: true, message: validation.error || 'Error en validación', severity: 'error' });
      return;
    }

    const newImages: ImagePreview[] = fileArray.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages([...images, ...newImages]);
    
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
      categoriaMock: '',
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

    if (!formData.categoriaMock) {
      newErrors.categoriaMock = 'Debes seleccionar una categoría';
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

      const filesToUpload = images.map(img => img.file);
      const uploadedImages = await uploadService.uploadMultipleImages(filesToUpload);

      setUploadingImages(false);

      const multimedia: Multimedia[] = uploadedImages.map((img, index) => ({
        url: img.url,
        // @ts-expect-error
        cloudinaryPublicId: img.publicId,
        orden: index + 1,
        tipo: 'imagen',
      }));

      const dto: CreatePublicacionDto = {
        id_vendedor: 'vendedor_demo_001', // TODO: Reemplazar con ID de usuario real
        id_producto: 'producto_demo_001', // DATO DE RELLENO (obligatorio en backend)
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        precio: Number(formData.precio),
        multimedia,
      };

      const publicacion = await publicacionesService.create(dto);
      
      setSnackbar({ 
        open: true, 
        message: '¡Tu publicación fue enviada a revisión!', 
        severity: 'warning' 
      });
      
      setTimeout(() => {
        navigate(`/publicaciones/${publicacion.id}`);
      }, 1500);
    } catch (error: any) {
      console.error('Error al crear publicación:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Ocurrió un error inesperado al crear la publicación.';

      if (Array.isArray(errorMessage)) {
        setSnackbar({
          open: true,
          message: `⚠️ ${errorMessage[0]}`,
          severity: 'error',
        });
      } else {
        setSnackbar({
          open: true,
          message: `⚠️ ${errorMessage}`,
          severity: 'error',
        });
      }

    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  return (
    <Box sx={{ backgroundColor: '#F3FAF3', minHeight: '100vh', pb: 3 }}>
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
          {/* ... (código de galería sin cambios) ... */}
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
                  Máximo 6 imágenes, 5MB cada una
                </Typography>
              </Box>
            )}
          </Box>
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
            {images.length < 6 && (
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
                  backgroundColor: '#F5F5FF',
                  '&:hover': { backgroundColor: '#E8F5E9' },
                }}
              >
                <AddPhotoIcon sx={{ color: '#4CAF50' }} />
              </Box>
            )}
          </Box>
          <Box sx={{ textAlign: 'center', pb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {images.length > 0 ? `${currentImageIndex + 1}/${images.length}` : '0/6 imágenes'}
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
          {/* ================================================================== */}
          {/* 🎨 ARREGLO VISUAL: TÍTULO                                        */}
          {/* Se elimina el 'placeholder' para dejar que el 'label' funcione    */}
          {/* ================================================================== */}
          <Box sx={{ mb: 2 }}>
            <TextField
              variant="outlined"
              fullWidth
              label="TÍTULO"
              // placeholder="ej: AirPods Max de Apple" // <-- 🎨 ELIMINADO
              value={formData.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              error={!!errors.titulo}
              helperText={errors.titulo || `${formData.titulo.length}/80 caracteres`}
              inputProps={{ maxLength: 80 }}
              InputProps={{
                endAdornment: formData.titulo.length >= 5 && !errors.titulo && <CheckIcon sx={{ color: '#4CAF50' }} />,
              }}
            />
          </Box>

          {/* ================================================================== */}
          {/* 🎨 ARREGLO VISUAL: DESCRIPCIÓN                                   */}
          {/* ================================================================== */}
          <Box sx={{ mb: 2 }}>
            <TextField
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              label="DESCRIPCIÓN"
              // placeholder="Describe tu producto..." // <-- 🎨 ELIMINADO
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              error={!!errors.descripcion}
              helperText={errors.descripcion || `${formData.descripcion.length}/500 caracteres`}
              inputProps={{ maxLength: 500 }}
              InputProps={{
                endAdornment: formData.descripcion.length >= 10 && !errors.descripcion && <CheckIcon sx={{ color: '#4CAF50' }} />,
              }}
            />
          </Box>

          {/* ================================================================== */}
          {/* ✨ MOCK DE CATEGORÍAS (Solo Frontend)                            */}
          {/* ================================================================== */}
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth variant="outlined" error={!!errors.categoriaMock}>
              <InputLabel id="categoria-mock-label">SELECCIONAR CATEGORÍA</InputLabel>
              <Select
                labelId="categoria-mock-label"
                label="SELECCIONAR CATEGORÍA"
                value={formData.categoriaMock}
                onChange={(e) => handleInputChange('categoriaMock', e.target.value)}
              >
                <MenuItem value="" disabled>
                  Selecciona una categoría
                </MenuItem>
                {mockCategorias.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </MenuItem>
                ))}
              </Select>
              {errors.categoriaMock && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                  {errors.categoriaMock}
                </Typography>
              )}
            </FormControl>
          </Box>

          {/* ================================================================== */}
          {/* 🎨 ARREGLO VISUAL: PRECIO                                        */}
          {/* ================================================================== */}
          <Box sx={{ mb: 3 }}>
            <TextField
              variant="outlined"
              fullWidth
              type="number"
              label="PRECIO"
              // placeholder="(Campo Obligatorio)" // <-- 🎨 ELIMINADO
              value={formData.precio}
              onChange={(e) => handleInputChange('precio', e.target.value.replace(/\D/g, ''))}
              error={!!errors.precio}
              helperText={errors.precio}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
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
              // ==================================================================
              // 🎨 ARREGLO VISUAL: BOTÓN LEGIBLE
              // ==================================================================
              backgroundColor: '#4CAF50', // Fondo verde
              color: 'white', // Texto blanco
              '&:hover': { backgroundColor: '#45A049' },
              '&:disabled': { 
                backgroundColor: '#BDBDBD',
                color: '#757575' 
              },
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

      {/* Snackbar (sin cambios) */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={8000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{
            '&.MuiAlert-standardWarning': {
              backgroundColor: '#FEF5D5',
              color: '#664D03',
              border: '1px solid rgba(102, 77, 3, 0.1)',
              borderRadius: '8px',
              '& .MuiAlert-icon': {
                color: '#664D03'
              }
            },
            fontSize: '1rem',
            alignItems: 'center',
            width: '100%',
            maxWidth: '400px',
            margin: '0 auto',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '& .MuiAlert-message': {
              padding: '10px 0',
              fontWeight: '500'
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreatePublicacion;