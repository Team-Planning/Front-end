import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  Box,
  Card,
  Typography,
  Button,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Skeleton,
} from "@mui/material";

import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Person as PersonIcon,
  Storefront as StorefrontIcon,
} from "@mui/icons-material";

import publicacionesService, {
  Publicacion,
} from "../../services/publicaciones.service";

// ==========================
// CATEGORÍAS MOCK
// ==========================
const mockCategorias = [
  { id: "tec", nombre: "Tecnología" },
  { id: "rop", nombre: "Ropa y Accesorios" },
  { id: "hog", nombre: "Hogar y Muebles" },
  { id: "lib", nombre: "Libros y Apuntes" },
  { id: "otr", nombre: "Otros" },
];
// AGREGAR ESTO DEBAJO DE mockCategorias
const mockProductos: Record<string, { id: string; nombre: string }[]> = {
  tec: [
    { id: "p1", nombre: "Monitor 24”" },
    { id: "p2", nombre: "Teclado Mecánico" },
    { id: "p3", nombre: "Mouse Gamer RGB" },
  ],
  rop: [
    { id: "p4", nombre: "Polerón Oversize" },
    { id: "p5", nombre: "Pantalones Cargo" },
    { id: "p6", nombre: "Chaqueta Denim" },
  ],
  hog: [
    { id: "p7", nombre: "Silla de Oficina" },
    { id: "p8", nombre: "Vaso térmico" },
  ],
  lib: [
    { id: "p9", nombre: "Libro Cálculo UV" },
    { id: "p10", nombre: "Apuntes Física I" },
  ],
  otr: [{ id: "p11", nombre: "Producto Genérico" }],
};

const getProductoNombre = (idProducto?: string) => {
  if (!idProducto) return "No especificado";
  // Buscar en todas las categorías
  for (const catKey in mockProductos) {
    const producto = mockProductos[catKey].find((p) => p.id === idProducto);
    if (producto) return producto.nombre;
  }
  return idProducto; // Si no encuentra el nombre, muestra el ID o el texto original
};

const getCategoriaNombre = (id: string) => {
  const categoria = mockCategorias.find((cat) => cat.id === id);
  return categoria ? categoria.nombre : "Categoría (Mock)";
};

// ==========================
// ESTADOS
// ==========================
const ESTADO_COLORS: Record<string, string> = {
  ENREVISION: "#FFA726",
  BORRADOR: "#757575",
  ACTIVO: "#66BB6A",
  PAUSADO: "#FFA726",
  VENDIDO: "#42A5F5",
  RECHAZADO: "#EF5350",
  ELIMINADO: "#EF9A9A",
};

const normalizeEstadoKey = (estado?: string) =>
  (estado ?? "EN_REVISION")
    .toUpperCase()
    .replace(/[_\s]/g, "");

const formatEstadoLabel = (estado?: string) => {
  const text = (estado ?? "EN_REVISION").toString().replace(/_/g, " ");
  return text
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

// ==========================
// COMPONENTE
// ==========================
const PublicacionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [publicacion, setPublicacion] = useState<Publicacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [motivoRechazo, setMotivoRechazo] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  useEffect(() => {
    if (id) loadPublicacion();
  }, [id]);

  const loadPublicacion = async () => {
    try {
      setLoading(true);
      const data = await publicacionesService.getById(id!);
      setPublicacion(data);

      // Si está rechazada, obtener el motivo
      if (data.estado === 'rechazado') {
        try {
          const moderacion = await publicacionesService.getModeracion(id!);
          if (moderacion && moderacion.length > 0) {
            setMotivoRechazo(moderacion[0].motivo);
          }
        } catch (error) {
          console.error("Error al obtener motivo de rechazo:", error);
        }
      } else {
        // Limpiar el motivo si no está rechazada
        setMotivoRechazo(null);
      }

      if (
        data.multimedia &&
        currentImageIndex >= data.multimedia.length
      ) {
        setCurrentImageIndex(0);
      }
    } catch (error) {
      console.error("Error al cargar:", error);
      setSnackbar({
        open: true,
        message: "Error al cargar la publicación",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

 const handleEdit = () => {
    navigate(`/publicaciones/editar/${id}`);
  };

  // =====================================================
// NAVEGACIÓN DE IMÁGENES (CORREGIDO)
// =====================================================
const totalImages = publicacion?.multimedia?.length ?? 0;

const handleNextImage = () => {
  if (totalImages > 0) {
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  }
};

const handlePrevImage = () => {
  if (totalImages > 0) {
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  }
};

// =====================================================
// LEER EXTRAS LOCALES (CORREGIDO)
// =====================================================
const extrasRaw = localStorage.getItem("publicacion_extras");
const extrasMap = extrasRaw ? JSON.parse(extrasRaw) : {};

  const localExtra =
    extrasMap[String(publicacion?.id)] || null;

  if (loading) {
    return (
      <Box sx={{ px: 3, py: 4 }}>
        <Skeleton variant="rectangular" height={350} />
        <Skeleton height={30} sx={{ mt: 2, width: "60%" }} />
        <Skeleton height={20} sx={{ mt: 1, width: "80%" }} />
        <Skeleton height={120} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (!publicacion) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography>Publicación no encontrada</Typography>
      </Box>
    );
  }

  const multimedia = publicacion.multimedia || [];
  const hasMultipleImages = multimedia.length > 1;

  const styles = {
    header: {
      backgroundColor: "primary.main",
      color: "white",
      padding: "16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      zIndex: 1000,
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    content: {
      marginTop: "80px", // Adjust for the fixed header height
      padding: "16px",
      marginLeft: "auto",
      marginRight: "auto",
      maxWidth: "800px", // Limit the maximum width
      '@media (max-width: 600px)': {
        padding: "8px",
        maxWidth: "100%", // Use full width on small screens
      },
    },
    card: {
      padding: "16px",
      borderRadius: "12px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      marginBottom: "24px",
      backgroundColor: "#fff",
      maxWidth: "100%", // Ensure cards fit within the content width
      '@media (max-width: 600px)': {
        padding: "12px",
        marginBottom: "16px",
      },
    },
    imageContainer: {
      position: "relative",
      height: "350px",
      borderRadius: "12px",
      overflow: "hidden",
      marginBottom: "24px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      '@media (max-width: 600px)': {
        height: "250px",
      },
    },
    image: {
      width: "100%",
      height: "100%",
      objectFit: "contain" as "contain", // Explicitly cast to the expected type
    },
    chip: {
      marginTop: "16px",
      backgroundColor: "#999",
      color: "white",
      fontWeight: "bold",
      '@media (max-width: 600px)': {
        marginTop: "12px",
      },
    },
    sectionTitle: {
      marginTop: "16px",
      fontWeight: "bold",
      color: "#333",
      '@media (max-width: 600px)': {
        marginTop: "12px",
        fontSize: "14px",
      },
    },
    sectionContent: {
      color: "#555",
      '@media (max-width: 600px)': {
        fontSize: "14px",
      },
    },
  };

  return (
    <Box sx={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
      {/* HEADER */}
      <Box sx={styles.header}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton
            onClick={() => navigate("/publicaciones")}
            sx={{ color: "white", marginRight: "16px" }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Detalle de publicación
          </Typography>
        </Box>
      </Box>

      <Box sx={styles.content}>
        {/* GALERÍA */}
        <Card sx={styles.card}>
          <Box sx={styles.imageContainer}>
            {multimedia.length ? (
              <img
                src={multimedia[currentImageIndex].url}
                alt="Publicación"
                style={styles.image}
              />
            ) : (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography>No hay imágenes</Typography>
              </Box>
            )}

            {hasMultipleImages && (
              <>
                <IconButton
                  sx={{
                    position: "absolute",
                    left: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    color: "white",
                  }}
                  onClick={handlePrevImage}
                >
                  <ChevronLeftIcon />
                </IconButton>

                <IconButton
                  sx={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    color: "white",
                  }}
                  onClick={handleNextImage}
                >
                  <ChevronRightIcon />
                </IconButton>
              </>
            )}
          </Box>
        </Card>

        {/* INFORMACIÓN DE VENDEDOR Y TIENDA */}
        <Card sx={{ 
          mb: 3, 
          p: 2.5,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fff9 100%)',
          border: '1px solid rgba(0, 213, 99, 0.2)',
          boxShadow: '0 2px 8px rgba(0, 213, 99, 0.08)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: '50%', 
                bgcolor: 'rgba(0, 213, 99, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(0, 213, 99, 0.25)',
              }}>
                <PersonIcon sx={{ color: '#00A84F', fontSize: '1.3rem' }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Vendedor
                </Typography>
                <Typography variant="body2" sx={{ color: '#00A84F', fontWeight: 600, fontSize: '0.95rem' }}>
                  {publicacion.id_vendedor || "Vendedor 1"}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ 
              width: '1px', 
              height: '40px', 
              bgcolor: 'rgba(0, 213, 99, 0.2)',
              display: { xs: 'none', sm: 'block' }
            }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: '50%', 
                bgcolor: 'rgba(0, 213, 99, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(0, 213, 99, 0.25)',
              }}>
                <StorefrontIcon sx={{ color: '#00A84F', fontSize: '1.3rem' }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Tienda
                </Typography>
                <Typography variant="body2" sx={{ color: '#00A84F', fontWeight: 600, fontSize: '0.95rem' }}>
                  Tienda Demo 1
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>

        {/* INFORMACIÓN */}
        <Card sx={styles.card}>
          {/* MOTIVO DE RECHAZO */}
          {publicacion.estado === 'rechazado' && motivoRechazo && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Motivo del rechazo:
              </Typography>
              <Typography variant="body2">
                {motivoRechazo}
              </Typography>
            </Alert>
          )}

          <Typography variant="h5" sx={{ fontWeight: "bold", color: "primary.main", mb: 2 }}>
            {publicacion.titulo}
          </Typography>

          <Typography sx={styles.sectionTitle}>Descripción:</Typography>
          <Typography sx={styles.sectionContent}>{publicacion.descripcion}</Typography>

          <Typography sx={styles.sectionTitle}>Producto:</Typography>
          <Typography sx={styles.sectionContent}>
            {getProductoNombre(localExtra?.producto || publicacion.id_producto)}
          </Typography>

          <Typography sx={styles.sectionTitle}>Categoría:</Typography>
          <Typography sx={styles.sectionContent}>
            {localExtra?.categoriaMock
              ? getCategoriaNombre(localExtra.categoriaMock)
              : "No especificado"}
          </Typography>

          <Typography sx={styles.sectionTitle}>Tipo de entrega:</Typography>
          <Typography sx={styles.sectionContent}>
            {localExtra?.tipoEntregaMock?.join(", ") || "No especificado"}
          </Typography>

          <Typography
            variant="h6"
            sx={{
              marginTop: "24px",
              fontWeight: "bold",
              color: "primary.main",
            }}
          >
            {publicacion.precio
              ? `Precio: ${new Intl.NumberFormat("es-CL", {
                  style: "currency",
                  currency: "CLP",
                }).format(publicacion.precio)}`
              : "Precio: No disponible"}
          </Typography>

          <Chip
            label={formatEstadoLabel(publicacion.estado)}
            sx={{
              ...styles.chip,
              backgroundColor:
                ESTADO_COLORS[normalizeEstadoKey(publicacion.estado)] || "#999",
            }}
          />
        </Card>

        {/* BOTÓN EDITAR */}
        <Button
          fullWidth
          variant="outlined"
          startIcon={<EditIcon />}
          sx={{ marginTop: "24px", fontWeight: "bold", borderRadius: "20px" }}
          onClick={handleEdit}
        >
          Editar Publicación
        </Button>
      </Box>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PublicacionDetail;
