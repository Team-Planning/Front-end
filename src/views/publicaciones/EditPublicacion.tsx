import { useState, useEffect, useRef } from 'react'; // <-- AÑADIDO useRef
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
  InputLabel,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AddPhotoAlternate as AddPhotoIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import publicacionesService, { Publicacion, UpdatePublicacionDto, Multimedia } from '../../services/publicaciones.service';
import uploadService from '../../services/upload.service'; // <-- AÑADIDO

// ==================================================================
//  MOCK DE CATEGORÍAS (Solo Frontend)
// ==================================================================
const mockCategorias = [
  { id: 'tec', nombre: 'Tecnología' },
  { id: 'rop', nombre: 'Ropa y Accesorios' },
  { id: 'hog', nombre: 'Hogar y Muebles' },
  { id: 'lib', nombre: 'Libros y Apuntes' },
  { id: 'otr', nombre: 'Otros' },
];
// ==================================================================

const EditPublicacion = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null); // <-- AÑADIDO
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publicacion, setPublicacion] = useState<Publicacion | null>(null);
  const [multimedia, setMultimedia] = useState<Multimedia[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoriaMock: '', // <-- CAMBIADO
    precio: '',
  });

  const [errors, setErrors] = useState({
    titulo: '',
    descripcion: '',
    categoriaMock: '', // <-- CAMBIADO
    precio: '',
  });

  useEffect(() => {
    if (id) {
      loadPublicacion();
    }
  }, [id]);

  const loadPublicacion = async () => {
    try {
      setLoading(true);
      const data = await publicacionesService.getById(id!);
      setPublicacion(data);
      setFormData({
        titulo: data.titulo,
        descripcion: data.descripcion,
        categoriaMock: 'rop', // <-- CAMBIADO (ponemos un valor mock, ej: "Ropa y Accesorios")
        precio: data.precio !== undefined && data.precio !== null ? String(data.precio) : '',
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

  // ==================================================================
  // ✨ LÓGICA DE SUBIDA DE ARCHIVOS (COPIADA DE CREATE)
  // ==================================================================
  
  // 1. Abre el explorador de archivos
  const handleAddImageClick = () => {
    fileInputRef.current?.click();
  };

  // 2. Maneja los archivos seleccionados
  const handleNewFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !publicacion) return;

    // Tomamos solo el primer archivo para simplificar
    const file = files[0]; 
    const validation = uploadService.validateImage(file);

    if (!validation.valid) {
      setSnackbar({ open: true, message: validation.error || 'Error de validación', severity: 'error' });
      return;
    }

    if (multimedia.length >= 6) {
      setSnackbar({ open: true, message: 'No puedes subir más de 6 imágenes', severity: 'error' });
      return;
    }

    setSaving(true); // Muestra el spinner
    try {
      // 1. Subir a Cloudinary
      const uploadedImage = await uploadService.uploadImage(file);
      
      // 2. Añadir al backend
      await publicacionesService.addMultimedia(publicacion.id!, {
        url: uploadedImage.url,
        orden: multimedia.length,
        tipo: 'imagen',
      });

      setSnackbar({ open: true, message: 'Imagen agregada exitosamente', severity: 'success' });
      await loadPublicacion(); // Recarga la publicación para mostrar la nueva imagen

    } catch (error) {
      console.error("Error al subir imagen:", error);
      setSnackbar({ open: true, message: 'Error al agregar la imagen', severity: 'error' });
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Limpia el input
    }
  };
  // ==================================================================
  // Fin de la lógica de subida
  // ==================================================================


  const handleRemoveImage = (index: number) => {
    const multimediaToDelete = multimedia[index];
    
    if (multimediaToDelete.id) {
      setSaving(true); // Muestra spinner
      // Marca la multimedia como eliminada localmente y marca la publicación como eliminada localmente
      publicacionesService.deleteMultimedia(multimediaToDelete.id, publicacion?.id)
        .then(() => {
          // Recargar publicación para mantener consistencia con backend
          loadPublicacion();
          setSnackbar({ open: true, message: 'Imagen eliminada correctamente', severity: 'success' });
        })
        .catch((error) => {
          console.error('Error al eliminar multimedia:', error);
          setSnackbar({ open: true, message: 'Error al eliminar la imagen', severity: 'error' });
        })
        .finally(() => {
          setSaving(false); // Oculta spinner
        });
    }
  };

  const validateForm = (): boolean => {
    const newErrors = {
      titulo: '',
      descripcion: '',
      categoriaMock: '', // <-- CAMBIADO
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

    if (!formData.categoriaMock) { // <-- CAMBIADO
      newErrors.categoriaMock = 'Debes seleccionar una categoría';
      isValid = false;
    }

    // Precio opcional en edición: el usuario puede dejarlo vacío para eliminarlo
    if (formData.precio) {
      const num = Number(formData.precio);
      if (Number.isNaN(num) || num < 0) {
        newErrors.precio = 'El precio debe ser un número válido >= 0';
        isValid = false;
      }
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

      // Creamos el DTO solo con los campos que el backend espera
      const dto: UpdatePublicacionDto = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        // Precio opcional: si el campo queda vacío no lo enviamos al backend
        ...(formData.precio !== '' ? { precio: Number(formData.precio) } : {}),
        // No enviamos 'categoriaMock'
      };

      await publicacionesService.update(id!, dto);
      // Actualizar localStorage con mock de precio y categoría para que la lista y detalle reflejen cambios
      try {
        const key = 'publicacion_extras';
        const raw = localStorage.getItem(key);
        const map = raw ? JSON.parse(raw) : {};
        map[String(id)] = {
          precio: Number(formData.precio),
          categoriaMock: formData.categoriaMock,
        };
        localStorage.setItem(key, JSON.stringify(map));
      } catch (e) {
        console.warn('No se pudo guardar publicacion_extras en localStorage', e);
      }
      
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
    <Box sx={{ backgroundColor: '#ffffff', minHeight: '100vh', pb: 3 }}>
      {/* Header con fondo theme - full-bleed (compensa padding del layout) */}
      <Box sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText', p: 2, display: 'flex', alignItems: 'center', width: 'calc(100% + 48px)', marginLeft: '-24px', marginRight: '-24px', boxSizing: 'border-box' }}>
        <IconButton onClick={() => navigate(`/publicaciones/${id}`)} sx={{ color: 'primary.contrastText', mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Editar Publicación
        </Typography>
      </Box>

      {/* Input oculto para subir archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleNewFilesSelected}
      />

      {(saving || loading) && <LinearProgress />}

      <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
        {/* Botones de acción superior */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleRemoveImage(currentImageIndex)}
            disabled={saving || multimedia.length === 0}
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
            onClick={async () => {
              if (!publicacion || !multimedia[currentImageIndex]?.id) return;
              setSaving(true);
              try {
                await publicacionesService.setPortadaLocal(publicacion.id!, multimedia[currentImageIndex].id!);
                await loadPublicacion();
                setSnackbar({ open: true, message: 'Portada actualizada', severity: 'success' });
              } catch (e) {
                console.error(e);
                setSnackbar({ open: true, message: 'Error al definir portada', severity: 'error' });
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving || multimedia.length === 0 || currentImageIndex === 0}
            sx={{
              borderColor: 'primary.main',
              color: 'primary.main',
              borderRadius: '20px',
              textTransform: 'none',
            }}
          >
            Definir como portada
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
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
                {/* Eliminar la X aquí */}
                <Box sx={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', gap: 1, alignItems: 'center' }}>
                  {multimedia[currentImageIndex]?.eliminado && (
                    <>
                      <Typography variant="caption" sx={{ backgroundColor: 'rgba(255,255,255,0.9)', px: 1, py: 0.5, borderRadius: 1, color: '#D32F2F', fontWeight: 'bold' }}>
                        Eliminada
                      </Typography>
                      <Button size="small" variant="contained" color="success" onClick={async () => { setSaving(true); try { await publicacionesService.restoreMultimediaLocal(multimedia[currentImageIndex].id!); await loadPublicacion(); setSnackbar({ open: true, message: 'Imagen restaurada', severity: 'success' }); } catch (e:any) { console.error(e); const msg = e?.response?.data?.message || 'Error al restaurar imagen'; setSnackbar({ open: true, message: msg, severity: 'error' }); } finally { setSaving(false); } }}>
                        Restaurar
                      </Button>
                    </>
                  )}
                </Box>
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
                  border: currentImageIndex === index ? '3px solid' : '2px solid #E0E0E0',
                  borderColor: currentImageIndex === index ? 'primary.main' : 'transparent',
                  borderRadius: 1,
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
              >
                <img
                  src={img.url}
                  alt={`Thumbnail ${index + 1}`}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {img.eliminado && (
                  <Box sx={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'white', backgroundColor: 'rgba(211,47,47,0.85)', px: 0.8, py: 0.4, borderRadius: 1 }}>
                      Eliminada
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
            
            {/* Botón agregar imagen */}
            {multimedia.length < 6 && (
              <Box
                onClick={handleAddImageClick}
                sx={{
                  width: 70,
                  height: 70,
                  flexShrink: 0,
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#F5F5F5',
                  '&:hover': { backgroundColor: '#E8F5E9' },
                }}
              >
                {saving ? <CircularProgress size={24} /> : <AddPhotoIcon sx={{ color: 'primary.main' }} />}
              </Box>
            )}
          </Box>

          {/* Indicador */}
          <Box sx={{ textAlign: 'center', pb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {multimedia.length > 0
                ? `${currentImageIndex + 1}/${multimedia.length} fotos`
                : `0/6 fotos`}
            </Typography>
          </Box>
        </Card>

        {/* Formulario */}
        <Card sx={{ p: 2, borderRadius: 2 }}>
          {/* ================================================================== */}
          {/* 🎨 ARREGLO VISUAL: TÍTULO                                        */}
          {/* ================================================================== */}
          <Box sx={{ mb: 2 }}>
            <TextField
              variant="outlined"
              fullWidth
              label="TÍTULO"
              value={formData.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              error={!!errors.titulo}
              helperText={errors.titulo || `${formData.titulo.length}/80 caracteres`}
              inputProps={{ maxLength: 80 }}
              InputProps={{
                endAdornment: formData.titulo.length >= 5 && <CheckIcon sx={{ color: 'primary.main' }} />,
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
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              error={!!errors.descripcion}
              helperText={errors.descripcion || `${formData.descripcion.length}/500 caracteres`}
              inputProps={{ maxLength: 500 }}
              InputProps={{
                endAdornment: formData.descripcion.length >= 10 && <CheckIcon sx={{ color: 'primary.main' }} />,
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
              label="PRECIO"
              type="number"
              value={formData.precio}
              onChange={(e) => handleInputChange('precio', e.target.value.replace(/\D/g, ''))}
              error={!!errors.precio}
              helperText={errors.precio}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                endAdornment: formData.precio && <CheckIcon sx={{ color: 'primary.main' }} />,
              }}
            />
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
            AGREGAR NUEVAS IMÁGENES
          </Typography>

          {/* ================================================================== */}
          {/* 🎨 BOTÓN DE AÑADIR IMAGEN                                        */}
          {/* ================================================================== */}
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleAddImageClick} // <-- CAMBIADO
              disabled={saving || multimedia.length >= 6}
              sx={{
                borderColor: 'primary.main',
                color: 'primary.main',
                borderRadius: '20px',
                textTransform: 'none',
              }}
            >
              📷 (Máximo 6 fotos)
            </Button>
            {/* Removed video button as requested */}
          </Box>

          {/* Botón Guardar */}
          <Button
            fullWidth
            variant="contained"
            onClick={handleSaveConfirm}
            disabled={saving}
            sx={{
              // ==================================================================
              // 🎨 ARREGLO VISUAL: BOTÓN LEGIBLE
              // ==================================================================
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': { backgroundColor: 'primary.dark' },
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
          <Button onClick={handleSave} sx={{ color: 'primary.main', fontWeight: 'bold' }}>
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
