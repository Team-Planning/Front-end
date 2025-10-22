import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  AddPhotoAlternate as AddPhotoIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import publicacionesService, { Publicacion, UpdatePublicacionDto, Multimedia } from '../../services/publicaciones.service';
import categoriasService, { Categoria } from '../../services/categorias.service';

const EditPublicacion = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [publicacion, setPublicacion] = useState<Publicacion | null>(null);
  const [multimedia, setMultimedia] = useState<Multimedia[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
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
    if (id) {
      loadPublicacion();
    }
  }, [id]);

  const loadCategorias = async () => {
    try {
      const data = await categoriasService.getActive();
      setCategorias(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const loadPublicacion = async () => {
    try {
      setLoading(true);
      const data = await publicacionesService.getById(id!);
      setPublicacion(data);
      setFormData({
        titulo: data.titulo,
        descripcion: data.descripcion,
        categoriaId: data.categoriaId,
        precio: '70000', // Temporal
      });
      setMultimedia(data.multimedia || []);
    } catch (error) {
      console.error('Error al cargar publicación:', error);
      setSnackbar({ open: true, message: 'Error al cargar la publicación', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  const handleAddImage = () => {
    const url = prompt('Ingresa la URL de la imagen:');
    if (url && publicacion) {
      const newMultimedia: Multimedia = { url, orden: multimedia.length, tipo: 'imagen' };
      
      // Agregar al backend
      publicacionesService.addMultimedia(publicacion.id!, newMultimedia)
        .then(() => {
          setMultimedia([...multimedia, newMultimedia]);
          setSnackbar({ open: true, message: 'Imagen agregada correctamente', severity: 'success' });
          loadPublicacion(); // Recargar para obtener el ID de la multimedia
        })
        .catch((error) => {
          console.error('Error al agregar multimedia:', error);
          setSnackbar({ open: true, message: 'Error al agregar la imagen', severity: 'error' });
        });
    }
  };

  const handleRemoveImage = (index: number) => {
    const multimediaToDelete = multimedia[index];
    
    if (multimediaToDelete.id) {
      // Eliminar del backend
      publicacionesService.deleteMultimedia(multimediaToDelete.id)
        .then(() => {
          const newMultimedia = multimedia.filter((_, i) => i !== index);
          const reordered = newMultimedia.map((m, i) => ({ ...m, orden: i }));
          setMultimedia(reordered);
          
          if (currentImageIndex >= reordered.length && reordered.length > 0) {
            setCurrentImageIndex(reordered.length - 1);
          }
          
          setSnackbar({ open: true, message: 'Imagen eliminada correctamente', severity: 'success' });
        })
        .catch((error) => {
          console.error('Error al eliminar multimedia:', error);
          setSnackbar({ open: true, message: 'Error al eliminar la imagen', severity: 'error' });
        });
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

  const handleSaveConfirm = () => {
    if (!validateForm()) {
      setSnackbar({ open: true, message: 'Por favor completa todos los campos requeridos', severity: 'error' });
      return;
    }
    setSaveDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveDialogOpen(false);

      const dto: UpdatePublicacionDto = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        categoriaId: formData.categoriaId,
      };

      await publicacionesService.update(id!, dto);
      
      setSnackbar({ open: true, message: 'Publicación actualizada exitosamente', severity: 'success' });
      
      setTimeout(() => {
        navigate(`/publicaciones/${id}`);
      }, 1500);
    } catch (error) {
      console.error('Error al actualizar publicación:', error);
      setSnackbar({ open: true, message: 'Error al actualizar la publicación', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Cargando...</Typography>
      </Box>
    );
  }

  if (!publicacion) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Publicación no encontrada</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#F3FAF3', minHeight: '100vh', pb: 3 }}>
      {/* Header con fondo verde */}
      <Box sx={{ backgroundColor: '#4CAF50', color: 'white', p: 2, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => navigate(`/publicaciones/${id}`)} sx={{ color: 'white', mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Editar Publicación ✏️
        </Typography>
      </Box>

      {saving && <LinearProgress />}

      <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
        {/* Botones de acción superior */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            sx={{
              borderColor: '#EF5350',
              color: '#EF5350',
              borderRadius: '20px',
              textTransform: 'none',
              '&:hover': { borderColor: '#E53935', backgroundColor: '#FFEBEE' },
            }}
          >
            Eliminar foto
          </Button>
          <Button
            variant="outlined"
            size="small"
            sx={{
              borderColor: '#4CAF50',
              color: '#4CAF50',
              borderRadius: '20px',
              textTransform: 'none',
              '&:hover': { borderColor: '#45A049', backgroundColor: '#F1F8E9' },
            }}
          >
            Definir como portada
          </Button>
          <Button
            variant="outlined"
            size="small"
            sx={{
              borderColor: '#4CAF50',
              color: '#4CAF50',
              borderRadius: '20px',
              textTransform: 'none',
              '&:hover': { borderColor: '#45A049', backgroundColor: '#F1F8E9' },
            }}
          >
            Reordenar ↕
          </Button>
        </Box>

        {/* Galería de Imágenes */}
        <Card sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ position: 'relative', backgroundColor: '#E0E0E0', height: 300 }}>
            {multimedia.length > 0 ? (
              <>
                <img
                  src={multimedia[currentImageIndex].url}
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
                >
                  <CloseIcon />
                </IconButton>
              </>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <AddPhotoIcon sx={{ fontSize: 64, color: '#9E9E9E', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Sin imágenes
                </Typography>
              </Box>
            )}
          </Box>

          {/* Thumbnails */}
          <Box sx={{ p: 2, display: 'flex', gap: 1, overflowX: 'auto' }}>
            {multimedia.map((img, index) => (
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
                }}
              >
                <img
                  src={img.url}
                  alt={`Thumbnail ${index + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            ))}
            
            {/* Botón agregar imagen */}
            <Box
              onClick={handleAddImage}
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
          </Box>

          {/* Indicador */}
          <Box sx={{ textAlign: 'center', pb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {multimedia.length > 0 ? `${currentImageIndex + 1}/${multimedia.length}` : '0/6'}
            </Typography>
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
              value={formData.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              error={!!errors.titulo}
              helperText={errors.titulo || `${formData.titulo.length}/80 caracteres`}
              inputProps={{ maxLength: 80 }}
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
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              error={!!errors.descripcion}
              helperText={errors.descripcion || `${formData.descripcion.length}/500 caracteres`}
              inputProps={{ maxLength: 500 }}
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
              >
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

          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
            AGREGAR NUEVAS IMÁGENES
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleAddImage}
              sx={{
                borderColor: '#4CAF50',
                color: '#4CAF50',
                borderRadius: '20px',
                textTransform: 'none',
              }}
            >
              📷 (Máximo 6 fotos)
            </Button>
            <Button
              variant="outlined"
              size="small"
              sx={{
                borderColor: '#4CAF50',
                color: '#4CAF50',
                borderRadius: '20px',
                textTransform: 'none',
              }}
            >
              📹
            </Button>
          </Box>

          {/* Botón Guardar */}
          <Button
            fullWidth
            variant="contained"
            onClick={handleSaveConfirm}
            disabled={saving}
            sx={{
              backgroundColor: '#4CAF50',
              '&:hover': { backgroundColor: '#45A049' },
              borderRadius: '25px',
              py: 1.5,
              fontSize: '16px',
              fontWeight: 'bold',
              textTransform: 'none',
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </Card>
      </Box>

      {/* Dialog de confirmación */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>⚠️ ¿Estás seguro que deseas guardar los cambios realizados?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Los cambios se guardarán permanentemente.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)} sx={{ color: '#757575' }}>
            Cancelar
          </Button>
          <Button onClick={handleSave} sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

export default EditPublicacion;
