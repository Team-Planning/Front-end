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
    // ==================================================================
    // 🚀 CORRECCIÓN:
    // El endpoint /categorias/activas da error 404 (No Encontrado).
    // Como plan B, llamamos al endpoint /categorias (que trae TODAS)
    // y filtramos las activas aquí en el frontend.
    // ==================================================================
    try {
      // Intenta llamar al endpoint original
      const response = await api.get('/categorias/activas');
      return response.data;
    } catch (error) {
      // Si falla (que es lo que está pasando)...
      console.warn('El endpoint /categorias/activas falló (404). Intentando plan B con /categorias.');
      
      // Plan B: Obtener todas y filtrar
      const todasLasCategorias = await this.getAll();
      return todasLasCategorias.filter(cat => cat.activa === true);
    }
  }

  // Obtener categoría por ID
  async getById(id: string): Promise<Categoria> {
    const response = await api.get(`/categorias/${id}`);
    return response.data;
  }
}

export default new CategoriasService();