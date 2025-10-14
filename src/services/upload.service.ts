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
   * Sube una sola imagen a Cloudinary
   */
  async uploadImage(file: File): Promise<CloudinaryUploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<UploadResponse>('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.imagen;
  }

  /**
   * Sube múltiples imágenes a Cloudinary (máximo 10)
   */
  async uploadMultipleImages(files: File[]): Promise<CloudinaryUploadResult[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post<MultipleUploadResponse>(
      '/upload/images',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.imagenes;
  }

  /**
   * Elimina una imagen de Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    const encodedPublicId = encodeURIComponent(publicId);
    await api.delete(`/upload/${encodedPublicId}`);
  }

  /**
   * Valida que el archivo sea una imagen y no supere el tamaño máximo
   */
  validateImage(file: File, maxSizeMB: number = 5): { valid: boolean; error?: string } {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return {
        valid: false,
        error: 'El archivo debe ser una imagen',
      };
    }

    // Validar tamaño (convertir MB a bytes)
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `La imagen no debe superar los ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Valida múltiples archivos
   */
  validateMultipleImages(
    files: File[],
    maxFiles: number = 10,
    maxSizeMB: number = 5
  ): { valid: boolean; error?: string } {
    if (files.length > maxFiles) {
      return {
        valid: false,
        error: `No puedes subir más de ${maxFiles} imágenes`,
      };
    }

    for (const file of files) {
      const validation = this.validateImage(file, maxSizeMB);
      if (!validation.valid) {
        return validation;
      }
    }

    return { valid: true };
  }
}

export default new UploadService();
