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
  Person as PersonIcon,
  Storefront as StorefrontIcon,
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
  tipoEntrega: yup
    .array()
    .of(yup.string())
    .min(1, "Selecciona al menos un método de entrega"),
  precio: yup.number().required().min(0), // Validación habilitada para el precio
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
  
  // Obtener tienda seleccionada desde localStorage
  const tiendaGuardada = localStorage.getItem('tienda_seleccionada');
  const idTienda = tiendaGuardada ? parseInt(tiendaGuardada) : 1;
  const nombreTienda = idTienda === 2 ? 'Tienda Demo 2' : 'Tienda Demo 1';

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
      tipoEntrega: [],
      precio: "", // Inicialización del precio
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
  // DRAG & DROP ORDEN
  // =====================================================
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("index", String(index));
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    const from = Number(e.dataTransfer.getData("index"));
    if (isNaN(from) || from === index) return;

    const newOrder = [...images];
    const [item] = newOrder.splice(from, 1);
    newOrder.splice(index, 0, item);

    setImages(newOrder);
    setCurrentImageIndex(index);

    setSnackbar({
      open: true,
      message: "Orden actualizado",
      severity: "success",
    });
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
        tipoEntregaMock: data.tipoEntrega,
      };

      localStorage.setItem("publicacion_local_extra", JSON.stringify(extras));

      const dto = {
        id_producto: "1",
        id_tienda: idTienda,
        titulo: data.titulo,
        descripcion: data.descripcion,
        precio: Number(data.precio), // Envío del precio al backend
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
          onClick={() => navigate("/publicaciones")}
          sx={{ 
            color: "white", 
            mr: 2,
            '&:hover': {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
          Crear Publicación
        </Typography>
      </Box>

      {loading && <LinearProgress sx={{ position: "fixed", top: 64, left: 0, right: 0, zIndex: 1099 }} />}

      <Box sx={{ maxWidth: 600, mx: "auto", p: 2, pt: 10 }}>
        {/* INPUT FILE */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />

        {/* BOTÓN DE PORTADA */}
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <Button
            variant="outlined"
            size="medium"
            disabled={
              uploadingImages || images.length === 0 || currentImageIndex === 0
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
            onClick={() => {
              if (currentImageIndex === 0) return;

              const newOrder = [...images];
              const [item] = newOrder.splice(currentImageIndex, 1);
              newOrder.unshift(item);

              setImages(newOrder);
              setCurrentImageIndex(0);

              setSnackbar({
                open: true,
                message: "Imagen definida como portada",
                severity: "success",
              });
            }}
          >
            Definir como portada
          </Button>
        </Box>

        {/* GALERÍA */}
        <Card sx={{ 
          mb: 3, 
          borderRadius: 3, 
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          border: "1px solid rgba(0, 0, 0, 0.06)",
        }}>
          <Box sx={{ 
            position: "relative", 
            height: 280, 
            background: "linear-gradient(135deg, #f5f5f5 0%, #e8f5e9 100%)",
          }}>
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
          <Box sx={{ display: "flex", gap: 1, overflowX: "auto", p: 2 }}>
            {images.map((img, i) => (
              <Box
                key={i}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, i)}
                onClick={() => setCurrentImageIndex(i)}
                sx={{
                  width: 70,
                  height: 70,
                  borderRadius: 2,
                  overflow: "hidden",
                  border:
                    currentImageIndex === i
                      ? "3px solid #00D563"
                      : "2px solid #e0e0e0",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: currentImageIndex === i ? "0 4px 8px rgba(0, 213, 99, 0.3)" : "none",
                  '&:hover': {
                    transform: "scale(1.05)",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  },
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
                  width: 70,
                  height: 70,
                  border: "2px dashed #00D563",
                  borderRadius: 2,
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
                {uploadingImages ? (
                  <CircularProgress size={24} />
                ) : (
                  <AddPhotoAlternateIcon color="primary" />
                )}
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

        {/* INFORMACIÓN DE VENDEDOR Y TIENDA */}
        {/* TODO: Reemplazar "Vendedor 1" con user?.name y tienda dinámica cuando se implemente auth */}
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
                  {nombreTienda}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>

        {/* FORMULARIO */}
        <Card sx={{ 
          p: 4, 
          borderRadius: 3,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          border: "1px solid rgba(0, 0, 0, 0.06)",
        }}>
          {/* CATEGORÍA */}
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
            {...register("descripcion")}
            InputProps={{
              endAdornment:
                watch("descripcion")?.length >= 10 &&
                !errors.descripcion ? (
                  <CheckIcon color="success" />
                ) : null,
            }}
          />

          {/* TIPO ENTREGA */}
          <Typography sx={{ fontSize: 14, mb: 1.5, ml: 0.3, fontWeight: 500, color: 'text.secondary' }}>
            Tipo de entrega
          </Typography>
          <Controller
            name="tipoEntrega"
            control={control}
            render={({ field }) => (
              <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
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
                    sx={{
                      borderRadius: 2,
                      fontWeight: 500,
                      px: 1,
                      height: 40,
                      fontSize: '0.95rem',
                      transition: 'all 0.2s ease',
                      border: field.value.includes(op) ? 'none' : '2px solid rgba(0, 0, 0, 0.12)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: field.value.includes(op) 
                          ? '0 4px 12px rgba(0, 213, 99, 0.3)'
                          : '0 4px 12px rgba(0, 0, 0, 0.1)',
                      },
                    }}
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

          {/* PRECIO - Comentado: Se obtendrá del microservicio de inventario */}
          <TextField
            label="Precio"
            type="number"
            fullWidth
            sx={{ 
              mb: 3,
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
            {...register("precio")} // Registro del campo precio
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            disabled={loading || images.length === 0}
            onClick={handleSubmit(onSubmit)}
            sx={{
              py: 1.8,
              fontSize: "1rem",
              fontWeight: 600,
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