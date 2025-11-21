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
  Skeleton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  ChevronLeft as ChevronLeftIcon,  // <-- AÑADIDO
  ChevronRight as ChevronRightIcon,  // <-- AÑADIDO
  PersonAdd as PersonAddIcon,
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


// Normalizamos las claves quitando espacios/guiones bajos y usando mayúsculas
const ESTADO_COLORS: Record<string, string> = {
  ENREVISION: '#FFA726',
  BORRADOR: '#757575',
  ACTIVO: '#66BB6A',
  PAUSADO: '#FFA726',
  VENDIDO: '#42A5F5',
  RECHAZADO: '#EF5350',
  ELIMINADO: '#EF9A9A',
};

const normalizeEstadoKey = (estado?: string) => (estado ?? 'EN_REVISION').toString().toUpperCase().replace(/[_\s]/g, '');
const formatEstadoLabel = (estado?: string) => {
  const text = (estado ?? 'EN_REVISION').toString().replace(/_/g, ' ');
  return text
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
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
      console.log('Publicacion fetched:', data);
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
      await publicacionesService.cambiarEstado(id!, 'eliminado'); // enviar estado en minúscula esperado por backend
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
      <Box sx={{ px: 3, py: 4 }}>
        <Skeleton variant="rectangular" height={350} />
        <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
          <Skeleton width="40%" height={36} sx={{ mt: 2 }} />
          <Skeleton width="80%" height={16} sx={{ mt: 1 }} />
          <Skeleton width="100%" height={120} sx={{ mt: 2 }} />
        </Box>
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

  // Leer valores mock guardados localmente (precio, categoria) si existen
  const extrasRaw = typeof window !== 'undefined' ? localStorage.getItem('publicacion_extras') : null;
  const extrasMap = extrasRaw ? JSON.parse(extrasRaw) : {};
  const localExtra = extrasMap[String(publicacion.id)] || null;

  return (
    <Box sx={{ backgroundColor: '#ffffff', minHeight: '100vh', pb: 3 }}>
      {/* Header con fondo theme - full-bleed (compensa padding del layout) */}
      <Box sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 'calc(100% + 48px)', marginLeft: '-24px', marginRight: '-24px', boxSizing: 'border-box' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/publicaciones')} sx={{ color: 'white', mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Detalle de publicación
          </Typography>
        </Box>
        {/* Overflow menu removed per request */}
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
                      backgroundColor: currentImageIndex === index ? 'primary.main' : '#E0E0E0',
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
          {/* Acciones rápidas (solo interesado) */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PersonAddIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="caption">1 interesado</Typography>
            </Box>
          </Box>

          {/* Título */}
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
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
              {/* Si hay un mock local para categoría, usarlo; si no, mostrar por defecto */}
              {getCategoriaNombre(localExtra?.categoriaMock ?? 'rop')} 
            </Typography>
          </Box>

          {/* ================================================================== */}
          {/* 🎨 ARREGLO: Mostrar precio (manejando el 0)                      */}
          {/* ================================================================== */}
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
            {
              (() => {
                const rawPrice = (localExtra && localExtra.precio !== undefined) ? localExtra.precio : (publicacion as any).precio ?? (publicacion as any).price ?? (publicacion as any).valor ?? (publicacion as any).monto;
                if (rawPrice !== null && rawPrice !== undefined && rawPrice !== '') {
                  const num = Number(rawPrice);
                  if (!Number.isNaN(num)) {
                    return `PRECIO: ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(num)}`;
                  }
                }
                return 'PRECIO: No disponible';
              })()
            }
          </Typography>


          {/* Estado */}
          <Chip
            label={formatEstadoLabel(publicacion.estado)}
            sx={{
              backgroundColor: ESTADO_COLORS[normalizeEstadoKey(publicacion.estado)] || '#BDBDBD',
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
              borderColor: 'primary.main',
              color: 'primary.main',
              borderRadius: '25px',
              py: 1.5,
              fontWeight: 'bold',
              textTransform: 'none',
              '&:hover': {
                borderColor: 'primary.dark',
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
