import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress, // <-- AÑADIDO
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  MoreVert as MoreVertIcon,
  ChevronLeft as ChevronLeftIcon, // <-- AÑADIDO para galería
  ChevronRight as ChevronRightIcon, // <-- AÑADIDO para galería
} from '@mui/icons-material';
import publicacionesService, { Publicacion } from '../../services/publicaciones.service';

// ==================================================================
//  MOCK DE CATEGORÍAS (Solo Frontend) - Necesario para mostrar nombre
// ==================================================================
const mockCategorias = [
  { id: 'tec', nombre: 'Tecnología' },
  { id: 'rop', nombre: 'Ropa y Accesorios' },
  { id: 'hog', nombre: 'Hogar y Muebles' },
  { id: 'lib', nombre: 'Libros y Apuntes' },
  { id: 'otr', nombre: 'Otros' },
];

// Función para obtener el nombre de la categoría mock
const getCategoriaNombre = (id: string) => {
  const categoria = mockCategorias.find(cat => cat.id === id);
  return categoria ? categoria.nombre : 'Categoría (Mock)';
};
// ==================================================================


const ESTADO_COLORS: Record<string, string> = {
  'EN REVISION': '#FFA726',
  'BORRADOR': '#757575',
  'ACTIVO': '#66BB6A',
  'PAUSADO': '#FFA726',
  'VENDIDO': '#42A5F5',
  'RECHAZADO': '#EF5350',
};

const ESTADO_TEXT: Record<string, string> = {
  'EN REVISION': 'Publicación En Espera',
  'BORRADOR': 'Publicación Borrador',
  'ACTIVO': 'Publicación Activa',
  'PAUSADO': 'Publicación Pausada',
  'VENDIDO': 'Publicación Vendida',
  'RECHAZADO': 'Publicación Rechazada',
};

const PublicacionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [publicacion, setPublicacion] = useState<Publicacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

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
      // Asegurarse de que el índice no exceda el número de imágenes si hay cambios
      if (data.multimedia && currentImageIndex >= data.multimedia.length) {
        setCurrentImageIndex(0);
      }
    } catch (error) {
      console.error('Error al cargar publicación:', error);
      setSnackbar({ open: true, message: 'Error al cargar la publicación', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // ==================================================================
    // 🎨 ARREGLO:
    // La ruta es 'editar' (con 'r') según tu archivo Routes.tsx
    // ==================================================================
    navigate(`/publicaciones/editar/${id}`);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await publicacionesService.cambiarEstado(id!, 'ELIMINADA'); // ✅ misma lógica que las tarjetas
      setSnackbar({
        open: true,
        message: 'Publicación movida a Eliminadas correctamente',
        severity: 'success',
      });
      setTimeout(() => {
        navigate('/publicaciones');
      }, 1500);
    } catch (error: any) {
      console.error('Error al eliminar publicación:', error);
      const msg =
        error?.response?.data?.message ||
        'Error al mover la publicación a Eliminadas.';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };


  const handleShare = () => {
    // Simular compartir
    setSnackbar({ open: true, message: 'Enlace copiado al portapapeles', severity: 'success' });
  };

  // ==================================================================
  // 🎨 ARREGLO: Funciones para la galería de imágenes
  // ==================================================================
  const handleNextImage = () => {
    if (publicacion && publicacion.multimedia && publicacion.multimedia.length > 0) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % publicacion.multimedia!.length);
    }
  };

  const handlePrevImage = () => {
    if (publicacion && publicacion.multimedia && publicacion.multimedia.length > 0) {
      setCurrentImageIndex((prevIndex) => (prevIndex - 1 + publicacion.multimedia!.length) % publicacion.multimedia!.length);
    }
  };
  // ==================================================================


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column' }}>
        <LinearProgress sx={{ width: '100%' }} />
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

  const multimedia = publicacion.multimedia || [];
  const hasMultipleImages = multimedia.length > 1;

  return (
    <Box sx={{ backgroundColor: '#F3FAF3', minHeight: '100vh', pb: 3 }}>
      {/* Header con fondo verde */}
      <Box sx={{ backgroundColor: '#4CAF50', color: 'white', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/publicaciones')} sx={{ color: 'white', mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {ESTADO_TEXT[publicacion.estado || 'EN REVISION']}
          </Typography>
        </Box>
        <IconButton sx={{ color: 'white' }}>
          <MoreVertIcon />
        </IconButton>
      </Box>

      <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
        {/* Galería de Imágenes */}
        <Card sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
          <Box sx={{ position: 'relative', backgroundColor: '#E0E0E0', height: 350 }}>
            {multimedia.length > 0 ? (
              <img
                src={multimedia[currentImageIndex].url}
                alt={publicacion.titulo}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="h6" color="text.secondary">
                  Sin imágenes
                </Typography>
              </Box>
            )}

            {/* Botón compartir */}
            <IconButton
              onClick={handleShare}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                backgroundColor: 'rgba(255,255,255,0.9)',
                '&:hover': { backgroundColor: 'white' },
              }}
            >
              <ShareIcon />
            </IconButton>

            {/* ================================================================== */}
            {/* 🎨 ARREGLO: Botones de navegación de la galería                 */}
            {/* ================================================================== */}
            {hasMultipleImages && (
              <>
                <IconButton
                  sx={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                  }}
                  onClick={handlePrevImage}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                  }}
                  onClick={handleNextImage}
                >
                  <ChevronRightIcon />
                </IconButton>
              </>
            )}
            {/* ================================================================== */}
          </Box>

          {/* ================================================================== */}
          {/* 🎨 ARREGLO: Indicador de páginas (puntitos)                      */}
          {/* ================================================================== */}
          {multimedia.length > 0 && (
            <Box sx={{ textAlign: 'center', py: 1, backgroundColor: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                {multimedia.map((_, index) => (
                  <Box
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: currentImageIndex === index ? '#4CAF50' : '#E0E0E0',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {currentImageIndex + 1}/{multimedia.length}
              </Typography>
            </Box>
          )}
        </Card>

        {/* Información de la publicación */}
        <Card sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          {/* Acciones rápidas (Mocks) */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FavoriteIcon sx={{ color: '#EF5350', fontSize: 20 }} />
              <Typography variant="caption">"5 vistas"</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FavoriteIcon sx={{ color: '#EF5350', fontSize: 20 }} />
              <Typography variant="caption">"3 me gusta"</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption">"1 interesados"</Typography>
            </Box>
          </Box>

          {/* Título */}
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: '#2E7D32' }}>
            {publicacion.titulo}
          </Typography>

          {/* Vendedor */}
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            VENDIDO POR {publicacion.id_vendedor}
          </Typography>

          {/* Descripción */}
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            DESCRIPCIÓN
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
            {publicacion.descripcion}
          </Typography>

          {/* ================================================================== */}
          {/* 🎨 ARREGLO: Mostrar categoría (del mock)                         */}
          {/* ================================================================== */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              CATEGORÍA:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {/* Como el backend no guarda la categoría, mostramos una por defecto */}
              {getCategoriaNombre('rop')} 
            </Typography>
          </Box>

          {/* ================================================================== */}
          {/* 🎨 ARREGLO: Mostrar precio (manejando el 0)                      */}
          {/* ================================================================== */}
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4CAF50', mb: 2 }}>
            {publicacion.precio !== null && publicacion.precio !== undefined
              ? `PRECIO: ${new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: 'CLP',
                }).format(publicacion.precio)}`
              : 'PRECIO: No disponible'}
          </Typography>


          {/* Estado */}
          <Chip
            label={publicacion.estado}
            sx={{
              backgroundColor: ESTADO_COLORS[publicacion.estado || 'EN REVISION'],
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        </Card>

        {/* Botones de acción */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            sx={{
              borderColor: '#4CAF50',
              color: '#4CAF50',
              borderRadius: '25px',
              py: 1.5,
              fontWeight: 'bold',
              textTransform: 'none',
              '&:hover': {
                borderColor: '#45A049',
                backgroundColor: '#F1F8E9',
              },
            }}
          >
            Editar Publicación
          </Button>
          <Button
            fullWidth
            variant="contained"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
            sx={{
              backgroundColor: '#EF5350',
              borderRadius: '25px',
              py: 1.5,
              fontWeight: 'bold',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#E53935',
              },
            }}
          >
            Eliminar
          </Button>
        </Box>
      </Box>

      {/* Dialog de confirmación de eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>ELIMINAR PUBLICACIÓN</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {/* 🎨 ARREGLO: Cambiado a eliminación lógica */}
            ¿Estás seguro que deseas mover esta publicación a Eliminadas?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#757575' }}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} sx={{ color: '#EF5350', fontWeight: 'bold' }}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

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

export default PublicacionDetail;