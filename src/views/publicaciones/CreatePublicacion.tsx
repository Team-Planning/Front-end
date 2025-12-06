// ==========================================
// CreatePublicacion.tsx — PULGASHOP FRONT
// ==========================================

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

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
  CircularProgress,
  InputLabel,
  Chip,
  Stack,
} from "@mui/material";

import {
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon,
  CheckCircle as CheckIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";

import publicacionesService from "../../services/publicaciones.service";
import { Multimedia } from "../../services/publicaciones.service";

import uploadService, {
  CloudinaryUploadResult,
} from "../../services/upload.service";

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// ===============================================
// MOCKS TEMPORALES
// ===============================================
const mockCategorias = [
  { id: "tec", nombre: "Tecnología" },
  { id: "rop", nombre: "Ropa y Accesorios" },
  { id: "hog", nombre: "Hogar y Muebles" },
  { id: "lib", nombre: "Libros y Apuntes" },
  { id: "otr", nombre: "Otros" },
];

const mockProductos = {
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

// ===============================================
// TIPOS
// ===============================================
interface ImagePreview {
  file: File;
  preview: string;
  cloudinaryData?: CloudinaryUploadResult;
}

// ===============================================
// VALIDACIÓN
// ===============================================
const schema = yup.object({
  categoria: yup.string().required("Selecciona una categoría"),
  producto: yup.string().required("Selecciona un producto asociado"),
  titulo: yup.string().required().min(5, "Mínimo 5 caracteres"),
  descripcion: yup.string().required().min(10, "Mínimo 10 caracteres"),
  stock: yup.number().required().min(1),
  tipoEntrega: yup
    .array()
    .of(yup.string())
    .min(1, "Selecciona al menos un método de entrega"),
  precio: yup.number().required().min(0),
});

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
const CreatePublicacion = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<ImagePreview[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [loading, setLoading] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning",
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<any>({
    resolver: yupResolver(schema),
    defaultValues: {
      categoria: "",
      producto: "",
      titulo: "",
      descripcion: "",
      stock: "",
      tipoEntrega: [],
      precio: "",
    },
  });

  // Tipado corregido
  const categoriaSeleccionada: keyof typeof mockProductos =
    watch("categoria") || "tec";

  // =====================================================
  // MANEJO DE IMÁGENES
  // =====================================================
  const handleFileSelect = (e: any) => {
    const files = e.target.files as FileList;
    if (!files) return;

    const limit = 6 - images.length;
    const list: File[] = Array.from(files).slice(0, limit);

    const valid = uploadService.validateMultipleImages(list, limit);
    if (!valid.valid) {
      setSnackbar({
        open: true,
        message: valid.error!,
        severity: "error",
      });
      return;
    }

    const arr = list.map((file: File) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages([...images, ...arr]);
    e.target.value = "";
  };

  const removeImage = (i: number) => {
    URL.revokeObjectURL(images[i].preview);
    const arr = images.filter((_, idx) => idx !== i);
    setImages(arr);
    if (currentImageIndex >= arr.length) {
      setCurrentImageIndex(arr.length - 1);
    }
  };

  // =====================================================
  // SUBMIT
  // =====================================================
  const onSubmit = async (data: any) => {
    if (images.length === 0) {
      setSnackbar({
        open: true,
        message: "Debes agregar al menos una imagen",
        severity: "error",
      });
      return;
    }

    try {
      setLoading(true);
      setUploadingImages(true);

      console.log("Subiendo imágenes...", images.length);
      const uploaded = await uploadService.uploadMultipleImages(
        images.map((x) => x.file)
      );
      console.log("Imágenes subidas:", uploaded);

      setUploadingImages(false);

      const multimedia: Multimedia[] = uploaded.map((f, i) => ({
        url: f.url,
        orden: i + 1,
        tipo: "imagen",
      }));

      // Guardado extra local y NO enviado al backend
const extras = {
        categoriaMock: data.categoria,
        productoMock: data.producto,
        stockMock: data.stock,
        tipoEntregaMock: data.tipoEntrega,
      };

      localStorage.setItem("publicacion_local_extra", JSON.stringify(extras));

      const dto = {
        id_producto: "1",
        titulo: data.titulo,
        descripcion: data.descripcion,
        precio: Number(data.precio),
        multimedia,
      };

      await publicacionesService.create(dto, extras);

      setSnackbar({
        open: true,
        message: "¡Tu publicación fue enviada!",
        severity: "success",
      });

      reset();
      setImages([]);

      setTimeout(() => navigate("/publicaciones"), 1000);
    } catch (e: any) {
      console.error("Error completo:", e);
      const errorMsg = e?.response?.data?.message || e?.message || "Error al crear la publicación";
      setSnackbar({
        open: true,
        message: errorMsg,
        severity: "error",
      });
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================
  return (
    <Box sx={{ minHeight: "100vh", pb: 4, background: "#fff" }}>
      <Box
        sx={{
          backgroundColor: "primary.main",
          color: "white",
          p: 2,
          display: "flex",
          alignItems: "center",
        }}
      >
        <IconButton
          onClick={() => navigate("/publicaciones")}
          sx={{ color: "white", mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Añadir Publicación
        </Typography>
      </Box>

      {loading && <LinearProgress />}

      <Box sx={{ maxWidth: 600, mx: "auto", p: 2 }}>
        {/* INPUT FILE */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />

        {/* GALERÍA */}
        <Card sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
          <Box sx={{ position: "relative", height: 280, background: "#eee" }}>
            {images.length > 0 ? (
              <>
                <img
                  src={images[currentImageIndex].preview}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />

                <IconButton
                  onClick={() => removeImage(currentImageIndex)}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    color: "white",
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </>
            ) : (
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 58, color: "#999", mb: 1 }} />
                <Typography>Click para agregar imágenes</Typography>
                <Typography variant="caption">Máximo 6 imágenes</Typography>
              </Box>
            )}
          </Box>

          {/* MINIATURAS */}
          <Box sx={{ display: "flex", gap: 1, overflowX: "auto", p: 1 }}>
            {images.map((img, i) => (
              <Box
                key={i}
                onClick={() => setCurrentImageIndex(i)}
                sx={{
                  width: 68,
                  height: 68,
                  borderRadius: 1,
                  overflow: "hidden",
                  border:
                    currentImageIndex === i
                      ? "2px solid #1976d2"
                      : "1px solid #ccc",
                  cursor: "pointer",
                }}
              >
                <img
                  src={img.preview}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Box>
            ))}

            {images.length < 6 && (
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  width: 68,
                  height: 68,
                  border: "2px dashed #1976d2",
                  borderRadius: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <AddPhotoAlternateIcon color="primary" />
              </Box>
            )}
          </Box>

          <Typography
            variant="caption"
            sx={{
              textAlign: "center",
              display: "block",
              pb: 1,
              color: "#666",
            }}
          >
            {images.length}/6 imágenes
          </Typography>
        </Card>

        {/* FORMULARIO */}
        <Card sx={{ p: 3, borderRadius: 2 }}>
          {/* CATEGORÍA */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Categoría</InputLabel>
            <Controller
              name="categoria"
              control={control}
              render={({ field }) => (
                <Select {...field} label="Categoría">
                  {mockCategorias.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.nombre}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>

          {/* PRODUCTO */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Producto asociado</InputLabel>
            <Controller
              name="producto"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  label="Producto asociado"
                  disabled={!watch("categoria")}
                >
                  {(mockProductos[categoriaSeleccionada] || []).map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.nombre}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>

          {/* TITULO */}
          <TextField
            label="Título del producto"
            fullWidth
            sx={{ mb: 2 }}
            {...register("titulo")}
            InputProps={{
              endAdornment:
                watch("titulo")?.length >= 5 && !errors.titulo ? (
                  <CheckIcon color="success" />
                ) : null,
            }}
          />

          {/* DESCRIPCIÓN */}
          <TextField
            label="Descripción"
            fullWidth
            multiline
            rows={3}
            sx={{ mb: 2 }}
            {...register("descripcion")}
            InputProps={{
              endAdornment:
                watch("descripcion")?.length >= 10 &&
                !errors.descripcion ? (
                  <CheckIcon color="success" />
                ) : null,
            }}
          />

          {/* STOCK */}
          <TextField
            label="Stock"
            type="number"
            fullWidth
            sx={{ mb: 3 }}
            {...register("stock")}
          />

          {/* TIPO ENTREGA */}
          <Typography sx={{ fontSize: 13, mb: 1, ml: 0.3 }}>
            Tipo de entrega
          </Typography>
          <Controller
            name="tipoEntrega"
            control={control}
            render={({ field }) => (
              <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                {["Presencial", "Envío"].map((op) => (
                  <Chip
                    key={op}
                    label={op}
                    clickable
                    variant={
                      field.value.includes(op) ? "filled" : "outlined"
                    }
                    color={
                      field.value.includes(op) ? "primary" : "default"
                    }
                    onClick={() => {
                      const exists = field.value.includes(op);
                      const updated = exists
                        ? field.value.filter((x: string) => x !== op)
                        : [...field.value, op];
                      field.onChange(updated);
                    }}
                  />
                ))}
              </Stack>
            )}
          />

          {/* PRECIO */}
          <TextField
            label="Precio"
            type="number"
            fullWidth
            sx={{ mb: 3 }}
            {...register("precio")}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            disabled={loading || images.length === 0}
            onClick={handleSubmit(onSubmit)}
          >
            {uploadingImages ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Subiendo imágenes...
              </>
            ) : (
              "PUBLICAR"
            )}
          </Button>
        </Card>
      </Box>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CreatePublicacion;
