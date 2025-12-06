import api from './api';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface UploadResponse {
  mensaje: string;
  imagen: CloudinaryUploadResult;
}

export interface MultipleUploadResponse {
  mensaje: string;
  imagenes: CloudinaryUploadResult[];
}

/**
 * Servicio para manejar el upload de imágenes a Cloudinary
 */
class UploadService {
  /**
   * Sube UNA sola imagen
   */
  async uploadImage(file: File): Promise<CloudinaryUploadResult> {
    const validation = this.validateImage(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Imagen inválida');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<UploadResponse>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.imagen;
  }

  /**
   * Sube múltiples imágenes (máximo 10)
   */
  async uploadMultipleImages(files: File[]): Promise<CloudinaryUploadResult[]> {
    const validation = this.validateMultipleImages(files);
    if (!validation.valid) {
      throw new Error(validation.error || 'Error al validar imágenes');
    }

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    const response = await api.post<MultipleUploadResponse>(
      '/upload/images',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    return response.data.imagenes;
  }

  /**
   * Elimina una imagen desde Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    if (!publicId) throw new Error('publicId requerido');

    const encodedPublicId = encodeURIComponent(publicId);
    await api.delete(`/upload/${encodedPublicId}`);
  }

  /**
   * Valida una imagen
   */
  validateImage(
    file: File,
    maxSizeMB: number = 5
  ): { valid: boolean; error?: string } {
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'El archivo debe ser una imagen válida' };
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return {
        valid: false,
        error: `La imagen supera el límite de ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Valida múltiples imágenes
   */
  validateMultipleImages(
    files: File[],
    maxFiles: number = 10,
    maxSizeMB: number = 5
  ): { valid: boolean; error?: string } {
    if (!files || files.length === 0) {
      return { valid: false, error: 'No seleccionaste ninguna imagen' };
    }

    if (files.length > maxFiles) {
      return { valid: false, error: `Máximo permitido: ${maxFiles} imágenes` };
    }

    for (const f of files) {
      const v = this.validateImage(f, maxSizeMB);
      if (!v.valid) return v;
    }

    return { valid: true };
  }
}

export default new UploadService();
