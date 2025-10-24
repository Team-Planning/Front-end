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
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  RestoreFromTrash as RestoreIcon,
} from '@mui/icons-material';
import publicacionesService, { Publicacion } from '../../services/publicaciones.service';

const ESTADO_COLORS: Record<string, string> = {
  'EN REVISION': '#FFA726',
  'BORRADOR': '#757575',
  'ACTIVO': '#66BB6A',
  'PAUSADO': '#FFA726',
  'VENDIDO': '#42A5F5',
  'RECHAZADO': '#EF5350',
  'ELIMINADO': '#9E9E9E',
  'ELIMINADA': '#9E9E9E',
};

export default function PublicacionesList() {
  const navigate = useNavigate();
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'TODAS' | 'ACTIVAS' | 'REVISION' | 'ELIMINADAS'>('TODAS');

  useEffect(() => {
    loadPublicaciones();
  }, []);

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

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta publicación?')) return;
    try {
      await publicacionesService.cambiarEstado(id, 'ELIMINADA');
      await loadPublicaciones();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar la publicación');
    }
  };

  const handleRestore = async (id: string) => {
    if (!window.confirm('¿Restaurar esta publicación?')) return;
    try {
      await publicacionesService.cambiarEstado(id, 'ACTIVO');
      await loadPublicaciones();
    } catch (error) {
      console.error('Error al restaurar:', error);
      alert('Error al restaurar la publicación');
    }
  };

  const handleCreateNew = () => navigate('/publicaciones/crear');

  const formatPrice = (price?: number) =>
    price
      ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price)
      : '—';

  return (
    <Box sx={{ p: 3, backgroundColor: '#F3FAF3', minHeight: '100vh' }}>
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

      {/* Buscador */}
      <TextField
        fullWidth
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
          mb: 4,
          backgroundColor: 'white',
          borderRadius: 2,
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: '#E0E0E0' },
            '&:hover fieldset': { borderColor: '#4CAF50' },
            '&.Mui-focused fieldset': { borderColor: '#4CAF50' },
          },
        }}
      />

      {/* Publicaciones */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress color="success" />
        </Box>
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
                        image={pub.multimedia?.[0]?.url || '/placeholder.jpg'}
                        alt={pub.titulo}
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
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2E7D32', mb: 1 }}>
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
                        {pub.precio
                          ? new Intl.NumberFormat('es-CL', {
                              style: 'currency',
                              currency: 'CLP',
                            }).format(pub.precio)
                          : 'Sin precio'}
                      </Typography>


                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          label={pub.categoria?.nombre || 'Sin categoría'}
                          size="small"
                          sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600 }}
                        />
                        <Chip
                          label={(pub.estado ?? 'EN REVISION').replace(/_/g, ' ')}
                          size="small"
                          sx={{
                            bgcolor: ESTADO_COLORS[(pub.estado ?? 'EN REVISION').toUpperCase()],
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

          <Box sx={{ textAlign: 'center', mt: 5 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
              sx={{
                backgroundColor: '#4CAF50',
                borderRadius: '25px',
                textTransform: 'none',
                fontSize: '16px',
                fontWeight: 'bold',
                padding: '12px 36px',
                '&:hover': { backgroundColor: '#45A049' },
              }}
            >
              Crear Publicación
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
