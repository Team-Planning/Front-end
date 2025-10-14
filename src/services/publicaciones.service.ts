import api from './api';

export interface Multimedia {
  id?: string;
  url: string;
  orden: number;
  tipo?: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  activa: boolean;
}

export interface Publicacion {
  id?: string;
  id_vendedor: string;
  id_producto?: string;
  titulo: string;
  descripcion: string;
  categoriaId: string;
  categoria?: Categoria;
  estado?: string;
  fechaCreacion?: string;
  fechaModificacion?: string;
  multimedia?: Multimedia[];
  moderaciones?: any[];
}

export interface CreatePublicacionDto {
  id_vendedor: string;
  id_producto?: string;
  titulo: string;
  descripcion: string;
  categoriaId: string;
  estado?: string;
  multimedia?: Multimedia[];
}

export interface UpdatePublicacionDto {
  id_vendedor?: string;
  id_producto?: string;
  titulo?: string;
  descripcion?: string;
  categoriaId?: string;
  estado?: string;
}

class PublicacionesService {
  // Obtener todas las publicaciones
  async getAll(): Promise<Publicacion[]> {
    const response = await api.get('/publicaciones');
    return response.data;
  }

  // Obtener publicación por ID
  async getById(id: string): Promise<Publicacion> {
    const response = await api.get(`/publicaciones/${id}`);
    return response.data;
  }

  // Crear publicación
  async create(data: CreatePublicacionDto): Promise<Publicacion> {
    const response = await api.post('/publicaciones', data);
    return response.data;
  }

  // Actualizar publicación
  async update(id: string, data: UpdatePublicacionDto): Promise<Publicacion> {
    const response = await api.put(`/publicaciones/${id}`, data);
    return response.data;
  }

  // Eliminar publicación
  async delete(id: string): Promise<void> {
    await api.delete(`/publicaciones/${id}`);
  }

  // Cambiar estado
  async changeStatus(id: string, estado: string): Promise<Publicacion> {
    const response = await api.patch(`/publicaciones/${id}/estado`, { estado });
    return response.data;
  }

  // Agregar multimedia
  async addMultimedia(id: string, multimedia: Multimedia): Promise<any> {
    const response = await api.post(`/publicaciones/${id}/multimedia`, multimedia);
    return response.data;
  }

  // Eliminar multimedia
  async deleteMultimedia(multimediaId: string): Promise<void> {
    await api.delete(`/publicaciones/multimedia/${multimediaId}`);
  }
}

export default new PublicacionesService();
