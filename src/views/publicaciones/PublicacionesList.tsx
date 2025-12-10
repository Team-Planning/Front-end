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
import TiendaSelector from '../../components/TiendaSelector';

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

const normalizeEstadoKey = (estado?: string) => (estado ?? 'ACTIVO').toString().toUpperCase().replace(/[_\s]/g, '');
const formatEstadoLabel = (estado?: string) => {
  const text = (estado ?? 'activo').toString().replace(/_/g, ' ');
  return text
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

const tiendas = [
  { id: 1, nombre: 'Tienda Demo 1' },
  { id: 2, nombre: 'Tienda Demo 2' },
];

export default function PublicacionesList() {
  const navigate = useNavigate();
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'TODAS' | 'ACTIVAS' | 'REVISION' | 'ELIMINADAS'>('TODAS');
  const [deleteDialog, setDeleteDialog] = useState<any>({ open: false, id: null, restore: false });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Inicializar desde localStorage o usar tienda 1 por defecto
  const tiendaGuardada = localStorage.getItem('tienda_seleccionada');
  const tiendaInicial = tiendaGuardada ? parseInt(tiendaGuardada) : 1;
  const [idTienda, setIdTienda] = useState<number>(tiendaInicial);
  const [nombreTienda, setNombreTienda] = useState<string>(tiendaInicial === 2 ? 'Tienda Demo 2' : 'Tienda Demo 1');

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
      // Obtener lista básica de publicaciones
      const data = await publicacionesService.getAll({ includeEliminadas: true });
      
      // Cargar cada publicación con getById (IGUAL QUE DETAIL) para obtener el orden correcto
      const publicacionesConOrden = await Promise.all(
        data.map(async (pub: any) => {
          try {
            return await publicacionesService.getById(pub.id);
          } catch (error) {
            console.error(`Error cargando pub ${pub.id}:`, error);
            return pub; // Si falla, usar los datos básicos
          }
        })
      );
      
      setPublicaciones(publicacionesConOrden);
    } catch (error) {
      console.error('Error al cargar publicaciones:', error);
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
    
    // Filtrar por tienda seleccionada
    const matchesTienda = (pub as any).id_tienda === idTienda;
    
    return matchesTienda && matchesStatus(pub) && (titulo.includes(search) || descripcion.includes(search));
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

  const handleTiendaSeleccionada = (id: number) => {
    setIdTienda(id);
    const tienda = tiendas.find((t) => t.id === id);
    setNombreTienda(tienda ? tienda.nombre : '');
    // Guardar la tienda seleccionada en localStorage para que la use CreatePublicacion
    localStorage.setItem('tienda_seleccionada', id.toString());
  };

  return (
    <Box>
      {/* Contenido principal */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              letterSpacing: '-0.5px',
              mb: 1,
            }}
          >
            {nombreTienda ? `Publicaciones de ${nombreTienda}` : 'Mis Publicaciones'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona tus productos de forma simple y efectiva
          </Typography>
        </Box>

        {/* Filtros */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 4,
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              width: 'auto',
              minWidth: '150px',
              borderRadius: '20px',
              border: '2px solid',
              borderColor: 'primary.main',
              backgroundColor: 'white',
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
                '& fieldset': { borderColor: 'transparent' },
                '&:hover fieldset': { borderColor: 'primary.main' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: '2px' },
              },
            }}
          >
            <TiendaSelector onTiendaSeleccionada={handleTiendaSeleccionada} />
          </Box>
          {['TODAS', 'ACTIVAS', 'REVISION', 'ELIMINADAS'].map((estado) => (
            <Button
              key={estado}
              variant={filter === estado ? 'contained' : 'outlined'}
              onClick={() => setFilter(estado as any)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '20px',
                px: 3,
                py: 1,
                fontSize: '15px',
                border: filter === estado ? 'none' : '2px solid',
                borderColor: 'primary.main',
                color: filter === estado ? 'white' : 'primary.main',
                backgroundColor: filter === estado ? 'primary.main' : 'white',
                '&:hover': {
                  backgroundColor: filter === estado ? 'primary.dark' : 'rgba(76, 175, 80, 0.08)',
                  borderColor: 'primary.main',
                },
              }}
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
        <Box sx={{ display: 'flex', gap: 2, mb: 4, alignItems: 'center', maxWidth: '1200px', mx: 'auto' }}>
          <TextField
            placeholder="Buscar publicaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'primary.main' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              backgroundColor: 'white',
              borderRadius: '25px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '25px',
                '& fieldset': { borderColor: '#E0E0E0' },
                '&:hover fieldset': { borderColor: 'primary.main' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: '2px' },
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
              fontSize: '15px',
              fontWeight: 700,
              padding: '12px 24px',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
              '&:hover': {
                backgroundColor: 'primary.dark',
                boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Crear Publicación
          </Button>
        </Box>

        {/* Publicaciones */}
        <Box sx={{ p: 2, maxWidth: '1200px', mx: 'auto' }}>
          <Grid container spacing={3}>
            {filteredPublicaciones.map((pub) => (
              <Grid item xs={12} sm={6} md={4} key={pub.id}>
                <Card
                  onClick={() => navigate(`/publicaciones/${pub.id}`)}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 4,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  {/* Imagen */}
                  <Box sx={{ width: '100%', height: 0, paddingTop: '56.25%', position: 'relative' }}>
                    <CardMedia
                      component="img"
                      image={(() => {
                        // Usar exactamente la misma lógica que Detail: primera imagen del array (ya ordenado por getById)
                        const multimedia = pub.multimedia || [];
                        return multimedia.length > 0 ? multimedia[0].url : '/placeholder.jpg';
                      })()}
                      alt={pub.titulo}
                      loading="lazy"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        borderRadius: '4px 4px 0 0',
                      }}
                    />
                  </Box>

                  {/* Contenido */}
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
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

                    <Typography
                      variant="h6"
                      sx={{
                        color: '#1B5E20',
                        fontWeight: 'bold',
                        mb: 2,
                      }}
                    >
                      {pub.precio
                        ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(pub.precio)
                        : 'Sin precio'}
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
                  </CardContent>

                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1, p: 2 }}>
                    {pub.estado !== 'eliminado' ? (
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
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

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
      </Box>
    </Box>
  );
}
