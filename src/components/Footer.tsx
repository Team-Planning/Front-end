import { Box, Container, Grid, Typography, TextField, IconButton } from "@mui/material";
import { ArrowForward } from "@mui/icons-material";

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#00D563',
        color: 'white',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Exclusivo */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Exclusivo
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Suscribirse
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, fontSize: '0.875rem' }}>
              Obtén 10% de descuento en tu primer pedido
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <TextField
                placeholder="Ingresa tu email"
                variant="outlined"
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 1,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'white',
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    opacity: 1,
                  },
                }}
              />
              <IconButton
                sx={{
                  color: 'white',
                  ml: -5,
                }}
              >
                <ArrowForward />
              </IconButton>
            </Box>
          </Grid>

          {/* Soporte */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Soporte
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, fontSize: '0.875rem' }}>
              Calle Principal 123, Ciudad,
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, fontSize: '0.875rem' }}>
              CP 12345, España
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, fontSize: '0.875rem' }}>
              soporte@pulgashop.com
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
              +34-900-123-456
            </Typography>
          </Grid>

          {/* Cuenta */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Cuenta
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, fontSize: '0.875rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
              Mi Cuenta
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, fontSize: '0.875rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
              Iniciar Sesión / Registro
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, fontSize: '0.875rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
              Carrito
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, fontSize: '0.875rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
              Lista de Deseos
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.875rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
              Tienda
            </Typography>
          </Grid>

          {/* Enlaces Rápidos */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Enlaces Rápidos
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, fontSize: '0.875rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
              Política de Privacidad
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, fontSize: '0.875rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
              Términos de Uso
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, fontSize: '0.875rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
              Preguntas Frecuentes
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.875rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
              Contacto
            </Typography>
          </Grid>

          {/* Descargar App */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Descargar App
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, fontSize: '0.75rem', opacity: 0.9 }}>
              Ahora €3 solo para nuevos usuarios de la app
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box
                sx={{
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: 1,
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                }}
              >
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  Google Play
                </Typography>
              </Box>
              <Box
                sx={{
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: 1,
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                }}
              >
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  App Store
                </Typography>
              </Box>
            </Box>
            {/* Iconos de redes sociales */}
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
                }}
              >
                <Typography variant="body2" sx={{ fontSize: '1rem' }}>f</Typography>
              </Box>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
                }}
              >
                <Typography variant="body2" sx={{ fontSize: '1rem' }}>t</Typography>
              </Box>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
                }}
              >
                <Typography variant="body2" sx={{ fontSize: '1rem' }}>in</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Copyright */}
        <Box sx={{ textAlign: 'center', mt: 6, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
          <Typography variant="body2" sx={{ fontSize: '0.875rem', opacity: 0.8 }}>
            © Copyright PulgaShop 2024. Todos los derechos reservados
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default Footer;
