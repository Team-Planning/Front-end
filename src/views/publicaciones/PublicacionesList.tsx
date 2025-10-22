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
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  
} from '@mui/icons-material';
import publicacionesService, { Publicacion } from '../../services/publicaciones.service';

const ESTADO_COLORS: Record<string, string> = {
  'EN REVISION': '#FFA726',
  'BORRADOR': '#757575',
  'ACTIVO': '#66BB6A',
  'PAUSADO': '#FFA726',
  'VENDIDO': '#42A5F5',
  'RECHAZADO': '#EF5350',
};

const PublicacionesList = () => {
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
      const data = await publicacionesService.getAll();
      setPublicaciones(data);
    } catch (error) {
      console.error('Error al cargar publicaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const matchesStatus = (pub: Publicacion) => {
    const estado = (pub.estado || '').toUpperCase();
    if (filter === 'TODAS') return true;
    if (filter === 'ACTIVAS') return estado === 'ACTIVO';
    if (filter === 'REVISION') return estado === 'EN REVISION' || estado === 'EN_REVISION' || estado.includes('REVISION');
    if (filter === 'ELIMINADAS') return estado.includes('ELIMIN') || estado === 'ELIMINADO' || estado === 'ELIMINADA';
    return true;
  };

  const filteredPublicaciones = publicaciones.filter((pub) =>
    matchesStatus(pub) && (
      pub.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pub.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleViewDetails = (id: string) => {
    navigate(`/publicaciones/${id}`);
  };

  const handleCreateNew = () => {
    navigate('/publicaciones/crear');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
          Mis Publicaciones
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            size="small"
            variant={filter === 'TODAS' ? 'contained' : 'outlined'}
            onClick={() => setFilter('TODAS')}
            sx={{ textTransform: 'none' }}
          >
            Todas
          </Button>
          <Button
            size="small"
            variant={filter === 'ACTIVAS' ? 'contained' : 'outlined'}
            onClick={() => setFilter('ACTIVAS')}
            sx={{ textTransform: 'none' }}
          >
            Activas
          </Button>
          <Button
            size="small"
            variant={filter === 'REVISION' ? 'contained' : 'outlined'}
            onClick={() => setFilter('REVISION')}
            sx={{ textTransform: 'none' }}
          >
            En revisión
          </Button>
          <Button
            size="small"
            variant={filter === 'ELIMINADAS' ? 'contained' : 'outlined'}
            onClick={() => setFilter('ELIMINADAS')}
            sx={{ textTransform: 'none' }}
          >
            Eliminadas
          </Button>
        </Box>

        <TextField
        fullWidth
        placeholder="Buscar publicaciones..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      </Box>

      {/* Grid de Publicaciones */}
      {loading ? (
        <Typography>Cargando...</Typography>
      ) : (
        <Grid container spacing={3}>
          {filteredPublicaciones.map((publicacion) => (
            <Grid item xs={12} sm={6} md={4} key={publicacion.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                  borderRadius: 2,
                }}
                onClick={() => handleViewDetails(publicacion.id!)}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={publicacion.multimedia?.[0]?.url || 'https://via.placeholder.com/300x200?text=Sin+Imagen'}
                  alt={publicacion.titulo}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                      {publicacion.titulo}
                    </Typography>
                    <Chip
                      label={publicacion.estado}
                      size="small"
                      sx={{
                        backgroundColor: ESTADO_COLORS[publicacion.estado || 'EN REVISION'],
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  </Box>
                  
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {publicacion.descripcion}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label={publicacion.categoria?.nombre}
                      size="small"
                      variant="outlined"
                      sx={{ color: '#4CAF50', borderColor: '#4CAF50' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {publicacion.multimedia?.length || 0} fotos
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {filteredPublicaciones.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No se encontraron publicaciones
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
            sx={{
              mt: 2,
              backgroundColor: '#4CAF50',
              borderRadius: '25px',
              textTransform: 'none',
              fontSize: '18px',
              fontWeight: 'bold',
              padding: '12px 32px',
              boxShadow: '0 4px 10px rgba(76, 175, 80, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': { 
                backgroundColor: '#45A049',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 12px rgba(76, 175, 80, 0.4)'
              }
            }}
          >
            Crear Publicación
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default PublicacionesList;
