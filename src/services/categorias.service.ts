import api from './api';

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  activa: boolean;
  fechaCreacion?: string;
}

class CategoriasService {
  // Obtener todas las categorías
  async getAll(): Promise<Categoria[]> {
    const response = await api.get('/categorias');
    return response.data;
  }

  // Obtener solo categorías activas
  async getActive(): Promise<Categoria[]> {
    const response = await api.get('/categorias/activas');
    return response.data;
  }

  // Obtener categoría por ID
  async getById(id: string): Promise<Categoria> {
    const response = await api.get(`/categorias/${id}`);
    return response.data;
  }
}

export default new CategoriasService();
