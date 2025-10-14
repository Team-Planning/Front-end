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
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
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

  const filteredPublicaciones = publicaciones.filter((pub) =>
    pub.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pub.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
          Mis Publicaciones
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
          sx={{
            backgroundColor: '#4CAF50',
            '&:hover': { backgroundColor: '#45A049' },
            borderRadius: '25px',
            textTransform: 'none',
            fontSize: '16px',
            px: 3,
          }}
        >
          Nueva Publicación
        </Button>
      </Box>

      {/* Search Bar */}
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
              '&:hover': { backgroundColor: '#45A049' },
              borderRadius: '25px',
              textTransform: 'none',
            }}
          >
            Crear primera publicación
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default PublicacionesList;
