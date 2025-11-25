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
  Share as ShareIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  PersonAdd as PersonAddIcon,
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

  const handleShare = () => {
    setSnackbar({
      open: true,
      message: "Enlace copiado al portapapeles",
      severity: "success",
    });
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
    extrasMap[String(publicacion?.id_producto)] || null;

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

  return (
    <Box sx={{ backgroundColor: "#fff", minHeight: "100vh", pb: 3 }}>
      {/* HEADER */}
      <Box
        sx={{
          backgroundColor: "primary.main",
          color: "white",
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "calc(100% + 48px)",
          marginLeft: "-24px",
          marginRight: "-24px",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton
            onClick={() => navigate("/publicaciones")}
            sx={{ color: "white", mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Detalle de publicación
          </Typography>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 600, mx: "auto", p: 2 }}>
        {/* GALERÍA */}
        <Card sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
          <Box sx={{ position: "relative", height: 350 }}>
            {multimedia.length ? (
              <img
                src={multimedia[currentImageIndex].url}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
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

            <IconButton
              onClick={handleShare}
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                backgroundColor: "rgba(255,255,255,0.8)",
              }}
            >
              <ShareIcon />
            </IconButton>

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

          {/* INDICADORES */}
          {multimedia.length > 0 && (
            <Box sx={{ textAlign: "center", py: 1 }}>
              {multimedia.map((_, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    mx: 0.3,
                    borderRadius: "50%",
                    backgroundColor:
                      idx === currentImageIndex
                        ? "primary.main"
                        : "#ccc",
                  }}
                />
              ))}
              <Typography variant="caption" sx={{ display: "block" }}>
                {currentImageIndex + 1}/{multimedia.length}
              </Typography>
            </Box>
          )}
        </Card>

        {/* INFORMACIÓN */}
        <Card sx={{ p: 2, borderRadius: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PersonAddIcon sx={{ color: "primary.main" }} />
            <Typography variant="caption">1 interesado</Typography>
          </Box>

          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", color: "primary.main", mt: 1 }}
          >
            {publicacion.titulo}
          </Typography>

          <Typography variant="caption" sx={{ color: "#666" }}>
            VENDIDO POR {publicacion.id_vendedor}
          </Typography>

          <Typography sx={{ mt: 2, fontWeight: "bold" }}>
            DESCRIPCIÓN:
          </Typography>
          <Typography color="text.secondary">
            {publicacion.descripcion}
          </Typography>

          {/* CATEGORÍA */}
          <Typography sx={{ mt: 2, fontWeight: "bold" }}>
            CATEGORÍA:
          </Typography>
          <Typography color="text.secondary">
            {localExtra?.categoriaMock
              ? getCategoriaNombre(localExtra.categoriaMock)
              : "No especificado"}
          </Typography>

          {/* STOCK */}
          <Typography sx={{ mt: 2, fontWeight: "bold" }}>
            STOCK:
          </Typography>
          <Typography color="text.secondary">
            {localExtra?.stock ?? "No especificado"}
          </Typography>

          {/* ENTREGA */}
          <Typography sx={{ mt: 2, fontWeight: "bold" }}>
            TIPO DE ENTREGA:
          </Typography>
          <Typography color="text.secondary">
            {localExtra?.tipoEntrega?.join(", ") ||
              "No especificado"}
          </Typography>

          {/* PRECIO */}
          <Typography
            variant="h6"
            sx={{
              mt: 3,
              fontWeight: "bold",
              color: "primary.main",
            }}
          >
            {localExtra?.precio
              ? `PRECIO: ${new Intl.NumberFormat("es-CL", {
                  style: "currency",
                  currency: "CLP",
                }).format(localExtra.precio)}`
              : "PRECIO: No disponible"}
          </Typography>

          {/* ESTADO */}
          <Chip
            label={formatEstadoLabel(publicacion.estado)}
            sx={{
              mt: 2,
              backgroundColor:
                ESTADO_COLORS[
                  normalizeEstadoKey(publicacion.estado)
                ] || "#999",
              color: "white",
              fontWeight: "bold",
            }}
          />
        </Card>

        {/* BOTÓN EDITAR */}
        <Button
          fullWidth
          variant="outlined"
          startIcon={<EditIcon />}
          sx={{ mt: 3, fontWeight: "bold", borderRadius: "20px" }}
          onClick={handleEdit}
        >
          Editar Publicación
        </Button>
      </Box>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() =>
          setSnackbar({ ...snackbar, open: false })
        }
      >
        <Alert
          severity={snackbar.severity}
          onClose={() =>
            setSnackbar({ ...snackbar, open: false })
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PublicacionDetail;
