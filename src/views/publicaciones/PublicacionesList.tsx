import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  RestoreFromTrash as RestoreIcon,
} from '@mui/icons-material';
import publicacionesService, { Publicacion } from '../../services/publicaciones.service';

// MOCK DE CATEGORÍAS (Solo Frontend) - reutilizado para mostrar nombre desde key
const mockCategorias = [
  { id: 'tec', nombre: 'Tecnología' },
  { id: 'rop', nombre: 'Ropa y Accesorios' },
  { id: 'hog', nombre: 'Hogar y Muebles' },
  { id: 'lib', nombre: 'Libros y Apuntes' },
  { id: 'otr', nombre: 'Otros' },
];

const getCategoriaNombre = (id: string) => {
  const cat = mockCategorias.find((c) => c.id === id);
  return cat ? cat.nombre : 'Sin categoría';
};

// Normalizamos las claves para soportar 'en_revision', 'EN REVISION', 'EN_REVISION', etc.
const ESTADO_COLORS: Record<string, string> = {
  ENREVISION: '#FFA726',
  BORRADOR: '#757575',
  ACTIVO: '#66BB6A',
  PAUSADO: '#FFA726',
  VENDIDO: '#42A5F5',
  RECHAZADO: '#EF5350',
  ELIMINADO: '#9E9E9E',
};

const normalizeEstadoKey = (estado?: string) => (estado ?? 'EN_REVISION').toString().toUpperCase().replace(/[_\s]/g, '');
const formatEstadoLabel = (estado?: string) => {
  const text = (estado ?? 'EN_REVISION').toString().replace(/_/g, ' ');
  return text
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

export default function PublicacionesList() {
  const navigate = useNavigate();
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'TODAS' | 'ACTIVAS' | 'REVISION' | 'ELIMINADAS'>('TODAS');
  const [deleteDialog, setDeleteDialog] = useState<any>({ open: false, id: null, restore: false });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    loadPublicaciones();
    const onUpdate = () => loadPublicaciones();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'publicaciones-update') loadPublicaciones();
    };
    window.addEventListener('publicaciones:update', onUpdate);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('publicaciones:update', onUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // leer mapa local de extras (precio y categoria) una vez al render
  const extrasRaw = typeof window !== 'undefined' ? localStorage.getItem('publicacion_extras') : null;
  const extrasMap: Record<string, any> = extrasRaw ? JSON.parse(extrasRaw) : {};

  const loadPublicaciones = async () => {
    try {
      setLoading(true);
      const data = await publicacionesService.getAll({ includeEliminadas: true });
      setPublicaciones(data);
    } catch (error) {
      console.error('Error al cargar publicaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const matchesStatus = (pub: Publicacion) => {
    const estado = (pub.estado || '').toUpperCase().replace(/[\s_]/g, '');
    if (filter === 'TODAS') return true;
    if (filter === 'ACTIVAS') return estado === 'ACTIVO';
    if (filter === 'REVISION') return estado.includes('REVISION');
    if (filter === 'ELIMINADAS') return estado.includes('ELIMIN') || estado === 'BAJA';
    return true;
  };

  const filteredPublicaciones = publicaciones.filter((pub) => {
    const titulo = pub.titulo?.toLowerCase() || '';
    const descripcion = pub.descripcion?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return matchesStatus(pub) && (titulo.includes(search) || descripcion.includes(search));
  });

  const handleDelete = (id: string) => {
    setDeleteDialog({ open: true, id, restore: false });
  };

  const handleRestore = (id: string) => {
    setDeleteDialog({ open: true, id, restore: true });
  };

  const confirmChangeState = async () => {
    const { id, restore } = deleteDialog;
    if (!id) return;
    try {
      if (restore) {
        // Restaurar publicación: cambiar estado a 'activo' en el backend
        await publicacionesService.cambiarEstado(id, 'activo');
      } else {
        // Eliminar publicación: cambiar estado a 'eliminado' en el backend
        await publicacionesService.delete(id);
      }
      setSnackbar({ open: true, message: restore ? 'Publicación restaurada' : 'Publicación eliminada exitosamente', severity: 'success' });
      await loadPublicaciones();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      const msg = (error as any)?.response?.data?.message || 'Error al cambiar el estado de la publicación';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setDeleteDialog({ open: false, id: null, restore: false });
    }
  };

  const handleCreateNew = () => navigate('/publicaciones/crear');

  

  return (
    <Box sx={{ p: 3, backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
          Mis Publicaciones
        </Typography>
      </Box>

      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['TODAS', 'ACTIVAS', 'REVISION', 'ELIMINADAS'].map((estado) => (
          <Button
            key={estado}
            variant={filter === estado ? 'contained' : 'outlined'}
            onClick={() => setFilter(estado as any)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {estado === 'TODAS'
              ? 'Todas'
              : estado === 'ACTIVAS'
              ? 'Activas'
              : estado === 'REVISION'
              ? 'En revisión'
              : 'Eliminadas'}
          </Button>
        ))}
      </Box>

      {/* Buscador + Crear */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, alignItems: 'center' }}>
        <TextField
          placeholder="Buscar publicaciones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: 2,
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#E0E0E0' },
              '&:hover fieldset': { borderColor: 'primary.main' },
              '&.Mui-focused fieldset': { borderColor: 'primary.main' },
            },
          }}
        />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
          sx={{
            backgroundColor: 'primary.main',
            borderRadius: '25px',
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 'bold',
            padding: '10px 18px',
            '&:hover': { backgroundColor: 'primary.dark' },
          }}
        >
          Crear Publicación
        </Button>
      </Box>

      {/* Publicaciones */}
      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={`skeleton-${i}`}>
              <Card sx={{ height: 550, borderRadius: 3 }}>
                <Skeleton variant="rectangular" height={260} />
                <CardContent>
                  <Skeleton width="60%" height={30} />
                  <Skeleton width="90%" height={16} sx={{ my: 1 }} />
                  <Skeleton width="40%" height={24} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredPublicaciones.map((pub) => {
              const isEliminada = (pub.estado || '').toUpperCase().includes('ELIMIN');
              return (
                <Grid item xs={12} sm={6} md={4} key={pub.id}>
                  <Card
                    onClick={() => navigate(`/publicaciones/${pub.id}`)}
                    sx={{
                      height: 550, // 🔹 más alargada
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      boxShadow: 3,
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                    }}
                  >
                    {/* Imagen */}
                    <Box sx={{ width: '100%', height: 260, overflow: 'hidden' }}>
                      <CardMedia
                        component="img"
                          image={pub.multimedia?.find((m) => !m.eliminado)?.url || '/placeholder.jpg'}
                        alt={pub.titulo}
                        loading="lazy"
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center',
                          filter: isEliminada ? 'grayscale(100%)' : 'none',
                        }}
                      />
                    </Box>

                    {/* Contenido */}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                        {pub.titulo}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {pub.descripcion}
                      </Typography>

                      {/* 🔹 Precio visible */}
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#1B5E20',
                          fontWeight: 'bold',
                          mb: 2,
                        }}
                      >
                        {
                          (() => {
                            const local = extrasMap[String(pub.id)];
                            const rawPrice = local?.precio ?? pub.precio;
                            if (rawPrice !== null && rawPrice !== undefined && rawPrice !== '') {
                              const num = Number(rawPrice);
                              if (!Number.isNaN(num)) {
                                return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(num);
                              }
                            }
                            return 'Sin precio';
                          })()
                        }
                      </Typography>


                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          label={
                            (() => {
                              const local = extrasMap[String(pub.id)];
                              if (local && local.categoriaMock) return getCategoriaNombre(local.categoriaMock);
                              return pub.categoria?.nombre || 'Sin categoría';
                            })()
                          }
                          size="small"
                          sx={{ bgcolor: '#E8F5E9', color: 'primary.main', fontWeight: 600 }}
                        />
                        <Chip
                          label={formatEstadoLabel(pub.estado)}
                          size="small"
                          sx={{
                            bgcolor: ESTADO_COLORS[normalizeEstadoKey(pub.estado)] || '#BDBDBD',
                            color: 'white',
                            fontWeight: 600,
                          }}
                        />
                      </Box>

                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        {!isEliminada ? (
                          <IconButton
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(pub.id!);
                            }}
                            sx={{
                              backgroundColor: '#FEECEC',
                              '&:hover': { backgroundColor: '#FFCDD2' },
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        ) : (
                          <IconButton
                            color="success"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestore(pub.id!);
                            }}
                            sx={{
                              backgroundColor: '#E8F5E9',
                              '&:hover': { backgroundColor: '#C8E6C9' },
                            }}
                          >
                            <RestoreIcon />
                          </IconButton>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Dialog de confirmación para eliminar/restaurar */}
          <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null, restore: false })}>
            <DialogTitle>{deleteDialog.restore ? 'Restaurar publicación' : 'Eliminar publicación'}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {deleteDialog.restore
                  ? '¿Estás seguro que deseas restaurar esta publicación?'
                  : '¿Estás seguro que deseas mover esta publicación a Eliminadas?'}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialog({ open: false, id: null, restore: false })} sx={{ color: '#757575' }}>
                Cancelar
              </Button>
              <Button onClick={confirmChangeState} sx={{ color: deleteDialog.restore ? 'primary.main' : '#EF5350', fontWeight: 'bold' }}>
                Confirmar
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </>
      )}
    </Box>
  );
}
