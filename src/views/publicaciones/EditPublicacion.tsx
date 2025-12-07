// ================================================================
// EditPublicacion.tsx — PULGASHOP
// Con todos los campos igual que CreatePublicacion
// ================================================================

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Alert,
  Snackbar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputLabel,
  CircularProgress,
  Stack,
  Chip,
} from "@mui/material";

import {
  ArrowBack as ArrowBackIcon,
  AddPhotoAlternate as AddPhotoIcon,
  CheckCircle as CheckIcon,
  Person as PersonIcon,
  Storefront as StorefrontIcon,
} from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";

import publicacionesService, {
  Publicacion,
  Multimedia,
  UpdatePublicacionDto,
} from "../../services/publicaciones.service";

import uploadService from "../../services/upload.service";

// ================================================================
// MOCK CATEGORÍAS / PRODUCTOS — Igual que CREATE
// ================================================================
const mockCategorias = [
  { id: "tec", nombre: "Tecnología" },
  { id: "rop", nombre: "Ropa y Accesorios" },
  { id: "hog", nombre: "Hogar y Muebles" },
  { id: "lib", nombre: "Libros y Apuntes" },
  { id: "otr", nombre: "Otros" },
];

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

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================
const EditPublicacion = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publicacion, setPublicacion] = useState<Publicacion | null>(null);
  const [multimedia, setMultimedia] = useState<Multimedia[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // FORM DATA — IGUAL A CREATE
  const [formData, setFormData] = useState({
    categoria: "",
    producto: "",
    titulo: "",
    descripcion: "",
    tipoEntrega: [] as string[],
    precio: "", // Inicialización del precio
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // Estado de errores eliminado por no uso durante build de producción

  // ================================================================
  // CARGAR PUBLICACIÓN + EXTRA LOCAL
  // ================================================================
  useEffect(() => {
    if (id) loadPublicacion();
  }, [id]);

  const loadPublicacion = async () => {
    try {
      setLoading(true);

      const data = await publicacionesService.getById(id!);
      setPublicacion(data);
      setMultimedia(data.multimedia || []);

      // Leer extras locales
      const raw = localStorage.getItem("publicacion_extras");
      const map = raw ? JSON.parse(raw) : {};
      const extra = map[String(data.id)] || {};

      const detectedCategory =
        Object.keys(mockProductos).find((k) =>
          mockProductos[k].some((p) => p.id === data.id_producto)
        ) || extra.categoria || "tec";

      setFormData({
        categoria: detectedCategory,
        producto: data.id_producto || extra.producto || "",
        titulo: data.titulo,
        descripcion: data.descripcion,
        tipoEntrega: extra.tipoEntrega ?? [],
        precio:
          extra.precio !== undefined && extra.precio !== null
            ? String(extra.precio)
            : data.precio
            ? String(data.precio)
            : "",
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Error al cargar la publicación",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // HANDLERS
  // ================================================================
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // removed errors state; skip clearing field error
  };

  // ================================================================
  // AGREGAR IMÁGENES
  // ================================================================
  const handleAddImageClick = () => fileInputRef.current?.click();

  const handleNewFilesSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || !publicacion) return;

    if (multimedia.length + files.length > 6) {
      setSnackbar({
        open: true,
        message: "Máximo 6 imágenes",
        severity: "error",
      });
      return;
    }

    setSaving(true);

    try {
      const uploads = Array.from(files).map((file) => {
        const v = uploadService.validateImage(file);
        if (!v.valid) throw new Error(v.error);
        return uploadService.uploadImage(file);
      });

      const uploaded = await Promise.all(uploads);

      const items = uploaded.map((img, index) => ({
        url: img.url,
        orden: multimedia.length + index,
        tipo: "imagen",
      }));

      await Promise.all(
        items.map((item) =>
          publicacionesService.addMultimedia(publicacion.id!, item)
        )
      );

      await loadPublicacion();
      setSnackbar({
        open: true,
        severity: "success",
        message: "Imágenes agregadas",
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Error al subir imágenes",
        severity: "error",
      });
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ================================================================
  // ELIMINAR IMAGEN
  // ================================================================
  const handleRemoveImage = async (index: number) => {
    const target = multimedia[index];
    if (!target?.id) return;

    // Usar la misma lógica simple que Create: filtrar el array localmente
    const arr = multimedia.filter((_, idx) => idx !== index);
    setMultimedia(arr);
    
    // Ajustar el índice actual si es necesario
    if (currentImageIndex >= arr.length && arr.length > 0) {
      setCurrentImageIndex(arr.length - 1);
    } else if (arr.length === 0) {
      setCurrentImageIndex(0);
    }

    // Marcar como eliminado en localStorage para que no reaparezca al recargar
    await publicacionesService.deleteMultimedia(target.id);
    
    setSnackbar({
      open: true,
      message: "Imagen eliminada",
      severity: "success",
    });
  };

  // ================================================================
  // DRAG & DROP ORDEN
  // ================================================================
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("index", String(index));
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (e: React.DragEvent, index: number) => {
    e.preventDefault();

    const from = Number(e.dataTransfer.getData("index"));
    if (isNaN(from) || from === index) return;

    const newOrder = [...multimedia];
    const [item] = newOrder.splice(from, 1);
    newOrder.splice(index, 0, item);

    setMultimedia(newOrder);
    setCurrentImageIndex(index);

    if (publicacion?.id) {
      const ids = newOrder.map((m) => m.id!).filter(Boolean);
      await publicacionesService.setMultimediaOrderLocal(publicacion.id, ids);
    }

    setSnackbar({
      open: true,
      message: "Orden actualizado",
      severity: "success",
    });
  };

  // ================================================================
  // VALIDACIÓN
  // ================================================================
  const validateForm = () => {
    const newErrors: any = {};
    let ok = true;

    if (!formData.categoria) {
      newErrors.categoria = "Debes seleccionar una categoría";
      ok = false;
    }

    if (!formData.producto) {
      newErrors.producto = "Debes seleccionar un producto";
      ok = false;
    }

    if (formData.titulo.length < 5) {
      newErrors.titulo = "Mínimo 5 caracteres";
      ok = false;
    }

    if (formData.descripcion.length < 10) {
      newErrors.descripcion = "Mínimo 10 caracteres";
      ok = false;
    }

    if (!formData.tipoEntrega.length) {
      newErrors.tipoEntrega = "Selecciona al menos una opción";
      ok = false;
    }

    if (formData.precio && Number(formData.precio) < 0) {
      newErrors.precio = "Precio inválido";
      ok = false;
    }

    // removed errors state; rely on snackbar messages
    return ok;
  };

  const handleSaveConfirm = () => {
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: "Completa los campos obligatorios",
        severity: "error",
      });
      return;
    }
    setSaveDialogOpen(true);
  };

  // ================================================================
  // GUARDAR CAMBIOS — BACKEND + LOCALSTORAGE
  // ================================================================
  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveDialogOpen(false);

      const dto: UpdatePublicacionDto = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        ...(formData.precio !== "" ? { precio: Number(formData.precio) } : {}), // Envío del precio al backend
      };

      await publicacionesService.update(id!, dto);

      // Guardar extras locales
      const key = "publicacion_extras";
      const raw = localStorage.getItem(key);
      const map = raw ? JSON.parse(raw) : {};

      map[id!] = {
        categoria: formData.categoria,
        producto: formData.producto,
        tipoEntrega: formData.tipoEntrega,
        precio: formData.precio ? Number(formData.precio) : null,
      };

      localStorage.setItem(key, JSON.stringify(map));

      setSnackbar({
        open: true,
        message: "Publicación actualizada correctamente",
        severity: "success",
      });

      setTimeout(() => navigate(`/publicaciones/${id}`), 900);
    } catch {
      setSnackbar({
        open: true,
        message: "Error al guardar cambios",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // ================================================================
  // UI
  // ================================================================
  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <Typography>Cargando…</Typography>
      </Box>
    );

  if (!publicacion)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <Typography>No encontrada</Typography>
      </Box>
    );

  return (
    <Box sx={{ backgroundColor: "#ffffff", minHeight: "100vh", pb: 3 }}>
      {/* HEADER */}
      <Box
        sx={{
          backgroundColor: "primary.main",
          color: "primary.contrastText",
          p: 2.5,
          display: "flex",
          alignItems: "center",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          boxShadow: "0 2px 8px rgba(0, 213, 99, 0.2)",
        }}
      >
        <IconButton
          sx={{ 
            color: "white", 
            mr: 2,
            '&:hover': {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
          onClick={() => navigate(`/publicaciones/${id}`)}
        >
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
          Editar Publicación
        </Typography>
      </Box>

      {/* INPUT OCULTO */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleNewFilesSelected}
      />

      {(saving || loading) && <LinearProgress sx={{ position: "fixed", top: 64, left: 0, right: 0, zIndex: 1099 }} />}

      <Box sx={{ maxWidth: 600, mx: "auto", p: 2, pt: 10 }}>
        {/* BOTÓN DE PORTADA */}
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <Button
            variant="outlined"
            size="medium"
            disabled={
              saving || multimedia.length === 0 || currentImageIndex === 0
            }
            sx={{
              borderColor: "primary.main",
              color: "primary.main",
              borderRadius: "12px",
              fontWeight: 600,
              textTransform: "none",
              px: 3,
              '&:hover': {
                borderColor: "primary.dark",
                backgroundColor: "rgba(0, 213, 99, 0.04)",
              },
            }}
            onClick={async () => {
              await publicacionesService.setPortadaLocal(
                publicacion.id!,
                multimedia[currentImageIndex].id!
              );
              await loadPublicacion();
            }}
          >
            Definir como portada
          </Button>
        </Box>

        {/* GALERÍA PRINCIPAL */}
        <Card sx={{ 
          mb: 3, 
          borderRadius: 3, 
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          border: "1px solid rgba(0, 0, 0, 0.06)",
        }}>
          <Box
            sx={{
              position: "relative",
              background: "linear-gradient(135deg, #f5f5f5 0%, #e8f5e9 100%)",
              height: 300,
            }}
          >
            {multimedia.length > 0 ? (
              <>
                <img
                  src={multimedia[currentImageIndex].url}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />

                <IconButton
                  onClick={() => handleRemoveImage(currentImageIndex)}
                  sx={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    backgroundColor: "rgba(211, 47, 47, 0.9)",
                    color: "white",
                    '&:hover': {
                      backgroundColor: "rgba(211, 47, 47, 1)",
                      transform: "scale(1.1)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  height: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <AddPhotoIcon sx={{ fontSize: 60, color: "#aaa" }} />
                <Typography>Sin imágenes</Typography>
              </Box>
            )}
          </Box>

          {/* MINIATURAS */}
          <Box sx={{ display: "flex", gap: 1, overflowX: "auto", p: 2 }}>
            {multimedia.map((img, index) => (
              <Box
                key={index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => setCurrentImageIndex(index)}
                sx={{
                  width: 70,
                  height: 70,
                  borderRadius: 2,
                  border:
                    currentImageIndex === index
                      ? "3px solid #00D563"
                      : "2px solid #e0e0e0",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: currentImageIndex === index ? "0 4px 8px rgba(0, 213, 99, 0.3)" : "none",
                  '&:hover': {
                    transform: "scale(1.05)",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  },
                }}
              >
                <img
                  src={img.url}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Box>
            ))}

            {multimedia.length < 6 && (
              <Box
                onClick={handleAddImageClick}
                sx={{
                  width: 70,
                  height: 70,
                  borderRadius: 2,
                  border: "2px dashed #00D563",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  backgroundColor: "rgba(0, 213, 99, 0.04)",
                  '&:hover': {
                    backgroundColor: "rgba(0, 213, 99, 0.08)",
                    transform: "scale(1.05)",
                  },
                }}
              >
                {saving ? (
                  <CircularProgress size={24} />
                ) : (
                  <AddPhotoIcon color="primary" />
                )}
              </Box>
            )}
          </Box>
        </Card>

          {/* INFORMACIÓN DE VENDEDOR Y TIENDA */}
          {/* TODO: Reemplazar "Vendedor 1" con user?.name y "Tienda Demo 1" con user?.tienda?.nombre cuando se implemente auth */}
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
                  Vendedor 1
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

          {/* FORMULARIO PRINCIPAL */}
        <Card sx={{ 
          p: 4, 
          borderRadius: 3,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          border: "1px solid rgba(0, 0, 0, 0.06)",
        }}>
          {/* Categoría */}
          <FormControl fullWidth sx={{ 
            mb: 2.5,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(0, 213, 99, 0.03)',
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(0, 213, 99, 0.06)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 213, 99, 0.5)',
                },
              },
              '&.Mui-focused': {
                backgroundColor: 'rgba(0, 213, 99, 0.08)',
                boxShadow: '0 0 0 3px rgba(0, 213, 99, 0.1)',
              },
            },
          }}>
            <InputLabel>Categoría</InputLabel>
            <Select
              value={formData.categoria}
              label="Categoría"
              onChange={(e) => handleInputChange("categoria", e.target.value)}
            >
              {mockCategorias.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Producto */}
          <FormControl fullWidth sx={{ 
            mb: 2.5,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(0, 213, 99, 0.03)',
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(0, 213, 99, 0.06)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 213, 99, 0.5)',
                },
              },
              '&.Mui-focused': {
                backgroundColor: 'rgba(0, 213, 99, 0.08)',
                boxShadow: '0 0 0 3px rgba(0, 213, 99, 0.1)',
              },
            },
          }}>
            <InputLabel>Producto asociado</InputLabel>
            <Select
              value={formData.producto}
              label="Producto asociado"
              disabled={!formData.categoria}
              onChange={(e) => handleInputChange("producto", e.target.value)}
            >
              {(mockProductos[formData.categoria] || []).map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Título */}
          <TextField
            label="Título"
            fullWidth
            sx={{ 
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(0, 213, 99, 0.03)',
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(0, 213, 99, 0.06)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 213, 99, 0.5)',
                  },
                },
                '&.Mui-focused': {
                  backgroundColor: 'rgba(0, 213, 99, 0.08)',
                  boxShadow: '0 0 0 3px rgba(0, 213, 99, 0.1)',
                },
              },
            }}
            value={formData.titulo}
            onChange={(e) => handleInputChange("titulo", e.target.value)}
            InputProps={{
              endAdornment:
                formData.titulo.length >= 5 && <CheckIcon color="success" />,
            }}
          />

          {/* Descripción */}
          <TextField
            label="Descripción"
            fullWidth
            multiline
            rows={3}
            sx={{ 
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(0, 213, 99, 0.03)',
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(0, 213, 99, 0.06)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 213, 99, 0.5)',
                  },
                },
                '&.Mui-focused': {
                  backgroundColor: 'rgba(0, 213, 99, 0.08)',
                  boxShadow: '0 0 0 3px rgba(0, 213, 99, 0.1)',
                },
              },
            }}
            value={formData.descripcion}
            onChange={(e) => handleInputChange("descripcion", e.target.value)}
            InputProps={{
              endAdornment:
                formData.descripcion.length >= 10 && (
                  <CheckIcon color="success" />
                ),
            }}
          />

          {/* Tipo Entrega */}
          <Typography sx={{ fontSize: 14, mb: 1.5, fontWeight: 500, color: 'text.secondary' }}>Tipo de Entrega</Typography>
          <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
            {["Presencial", "Envío"].map((op) => (
              <Chip
                key={op}
                label={op}
                clickable
                variant={
                  formData.tipoEntrega.includes(op) ? "filled" : "outlined"
                }
                color={
                  formData.tipoEntrega.includes(op) ? "primary" : "default"
                }
                sx={{
                  borderRadius: 2,
                  fontWeight: 500,
                  px: 1,
                  height: 40,
                  fontSize: '0.95rem',
                  transition: 'all 0.2s ease',
                  border: formData.tipoEntrega.includes(op) ? 'none' : '2px solid rgba(0, 0, 0, 0.12)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: formData.tipoEntrega.includes(op) 
                      ? '0 4px 12px rgba(0, 213, 99, 0.3)'
                      : '0 4px 12px rgba(0, 0, 0, 0.1)',
                  },
                }}
                onClick={() => {
                  const exists = formData.tipoEntrega.includes(op);
                  const updated = exists
                    ? formData.tipoEntrega.filter((x) => x !== op)
                    : [...formData.tipoEntrega, op];
                  handleInputChange("tipoEntrega", updated);
                }}
              />
            ))}
          </Stack>

          {/* Precio */}
          <TextField
            label="Precio"
            type="number"
            fullWidth
            sx={{ 
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(0, 213, 99, 0.03)',
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(0, 213, 99, 0.06)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 213, 99, 0.5)',
                  },
                },
                '&.Mui-focused': {
                  backgroundColor: 'rgba(0, 213, 99, 0.08)',
                  boxShadow: '0 0 0 3px rgba(0, 213, 99, 0.1)',
                },
              },
            }}
            value={formData.precio} // Enlace del precio al formulario
            onChange={(e) => handleInputChange("precio", e.target.value)} // Manejo del cambio del precio
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              endAdornment:
                formData.precio && <CheckIcon color="success" />,
            }}
          />

          <Button
            fullWidth
            variant="contained"
            onClick={handleSaveConfirm}
            disabled={saving}
            sx={{ 
              py: 1.8, 
              fontWeight: 600,
              fontSize: "1rem",
              textTransform: "none",
              borderRadius: 2,
              boxShadow: "0 4px 12px rgba(0, 213, 99, 0.3)",
              '&:hover': {
                boxShadow: "0 6px 16px rgba(0, 213, 99, 0.4)",
                transform: "translateY(-1px)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Guardar Cambios
          </Button>
        </Card>
      </Box>

      {/* DIALOG */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Confirmar cambios</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Deseas guardar los cambios realizados en esta publicación?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} autoFocus>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default EditPublicacion;
