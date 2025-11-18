import api from './api';

export interface Multimedia {
  id?: string;
  url: string;
  orden: number;
  tipo?: string;
}

export interface Publicacion {
  id?: string;
  id_vendedor: string;
  id_producto: string;
  titulo: string;
  descripcion: string;
  precio?: number;
  estado?: string;
  fechaCreacion?: string;
  fechaModificacion?: string;
  multimedia?: Multimedia[];
  moderaciones?: any[];
}

export interface CreatePublicacionDto {
  id_vendedor: string;
  id_producto: string;
  titulo: string;
  descripcion: string;
  precio?: number;
  estado?: string;
  multimedia?: Multimedia[];
}

export interface UpdatePublicacionDto {
  id_vendedor?: string;
  id_producto?: string;
  titulo?: string;
  descripcion?: string;
  precio?: number;
  estado?: string;
}

type GetAllOpts = {
  includeEliminadas?: boolean;
};

class PublicacionesService {
  private notifyListChanged() {
    localStorage.setItem('publicaciones-update', Date.now().toString());
  }

  async getAll(opts?: GetAllOpts): Promise<Publicacion[]> {
    const response = await api.get('/publicaciones');
    let data: Publicacion[] = response.data;

    if (opts?.includeEliminadas) return data;
    return data.filter(
      (p) => !(p.estado ?? '').toUpperCase().includes('ELIMIN')
    );
  }

  async getById(id: string): Promise<Publicacion> {
    const response = await api.get(`/publicaciones/${id}`);
    return response.data;
  }

  async create(data: CreatePublicacionDto): Promise<Publicacion> {
    // ==================================================================
    // 🎨 ARREGLO:
    // Cambiado 'EN REVISION' (mayúsculas) a 'en_revision' (minúsculas)
    // para que coincida con la validación del backend.
    // ==================================================================
    const payload = { ...data, estado: data.estado ?? 'en_revision' };
    const response = await api.post('/publicaciones', payload);
    this.notifyListChanged();
    return response.data;
  }

  async update(id: string, data: UpdatePublicacionDto): Promise<Publicacion> {
    const response = await api.put(`/publicaciones/${id}`, data);
    this.notifyListChanged();
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/publicaciones/${id}`);
    this.notifyListChanged();
  }

  async changeStatus(id: string, estado: string): Promise<Publicacion> {
    const response = await api.patch(`/publicaciones/${id}/estado`, { estado });
    this.notifyListChanged();
    return response.data;
  }

  async addMultimedia(id: string, multimedia: Multimedia): Promise<any> {
    const response = await api.post(`/publicaciones/${id}/multimedia`, multimedia);
    return response.data;
  }

  async deleteMultimedia(multimediaId: string): Promise<void> {
    await api.delete(`/publicaciones/multimedia/${multimediaId}`);
  }

  async cambiarEstado(id: string, estado: string): Promise<Publicacion> {
    const response = await api.patch(`/publicaciones/${id}/estado`, { estado });
    this.notifyListChanged();
    return response.data;
  }
}

export default new PublicacionesService();