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
    stock: "",
    tipoEntrega: [] as string[],
    precio: "",
  });

  const [errors, setErrors] = useState({
    categoria: "",
    producto: "",
    titulo: "",
    descripcion: "",
    stock: "",
    tipoEntrega: "",
    precio: "",
  });

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
        stock: extra.stock ?? "",
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
    setErrors((prev) => ({ ...prev, [field]: "" }));
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

    setSaving(true);

    try {
      await publicacionesService.deleteMultimedia(target.id);

      setMultimedia((prev) => prev.filter((m) => m.id !== target.id));

      setCurrentImageIndex((prev) => {
        const newL = multimedia.length - 1;
        return Math.max(0, Math.min(prev, newL - 1));
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Error al eliminar imagen",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
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

    if (!formData.stock || Number(formData.stock) < 1) {
      newErrors.stock = "Stock mínimo 1";
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

    setErrors(newErrors);
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
        ...(formData.precio !== "" ? { precio: Number(formData.precio) } : {}),
      };

      await publicacionesService.update(id!, dto);

      // Guardar extras locales
      const key = "publicacion_extras";
      const raw = localStorage.getItem(key);
      const map = raw ? JSON.parse(raw) : {};

      map[id!] = {
        categoria: formData.categoria,
        producto: formData.producto,
        stock: Number(formData.stock),
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
          p: 2,
          display: "flex",
          alignItems: "center",
          width: "calc(100% + 48px)",
          marginLeft: "-24px",
          marginRight: "-24px",
        }}
      >
        <IconButton
          sx={{ color: "white", mr: 2 }}
          onClick={() => navigate(`/publicaciones/${id}`)}
        >
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
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

      {(saving || loading) && <LinearProgress />}

      <Box sx={{ maxWidth: 600, mx: "auto", p: 2 }}>
        {/* BOTÓN DE PORTADA */}
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            disabled={
              saving || multimedia.length === 0 || currentImageIndex === 0
            }
            sx={{
              borderColor: "primary.main",
              color: "primary.main",
              borderRadius: "20px",
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
        <Card sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
          <Box
            sx={{
              position: "relative",
              backgroundColor: "#E0E0E0",
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
                    top: 8,
                    right: 8,
                    backgroundColor: "rgba(255,255,255,0.85)",
                    color: "#D32F2F",
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
                  borderRadius: 1,
                  border:
                    currentImageIndex === index
                      ? "3px solid #1976d2"
                      : "1px solid #ddd",
                  overflow: "hidden",
                  cursor: "pointer",
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
                  borderRadius: 1,
                  border: "2px dashed #1976d2",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
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

        {/* FORMULARIO COMPLETO */}
        <Card sx={{ p: 3, borderRadius: 2 }}>
          {/* Categoría */}
          <FormControl fullWidth sx={{ mb: 2 }}>
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
          <FormControl fullWidth sx={{ mb: 2 }}>
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
            sx={{ mb: 2 }}
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
            sx={{ mb: 2 }}
            value={formData.descripcion}
            onChange={(e) => handleInputChange("descripcion", e.target.value)}
            InputProps={{
              endAdornment:
                formData.descripcion.length >= 10 && (
                  <CheckIcon color="success" />
                ),
            }}
          />

          {/* Stock */}
          <TextField
            label="Stock"
            type="number"
            fullWidth
            sx={{ mb: 2 }}
            value={formData.stock}
            onChange={(e) => handleInputChange("stock", e.target.value)}
          />

          {/* Tipo Entrega */}
          <Typography sx={{ fontSize: 13, mb: 1 }}>Tipo de Entrega</Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
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
            sx={{ mb: 3 }}
            value={formData.precio}
            onChange={(e) => handleInputChange("precio", e.target.value)}
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
            sx={{ py: 1.5, fontWeight: "bold" }}
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
