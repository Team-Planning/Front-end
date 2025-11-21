import api from './api';

export interface Multimedia {
  id?: string;
  url: string;
  orden: number;
  tipo?: string;
  eliminado?: boolean;
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
  categoria?: { nombre?: string } | null;
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
    const params: any = {};
    if (opts?.includeEliminadas) params.includeEliminadas = true;
    const response = await api.get('/publicaciones', { params });
    let data: Publicacion[] = response.data;

    // Inyectar estado 'eliminado' en multimedia según flags locales y overrides de estado de publicación
    const deletedMap = this._readDeletedMap();
    const estadoMap = this._readEstadoMap();
    const portadaMap = this._readPortadaMap();
    const orderMap = this._readOrderMap();
    data = data.map((p) => {
      let withFlags = this._applyDeletedFlags(p, deletedMap);
      const withEstado = this._applyEstadoOverride(withFlags, estadoMap);
      const withOrder = this._applyOrderOverride(withEstado, orderMap);
      return this._applyPortadaOverride(withOrder, portadaMap);
    });

    if (opts?.includeEliminadas) return data;
    return data.filter((p) => !(p.estado ?? '').toUpperCase().includes('ELIMIN'));
  }

  async getById(id: string): Promise<Publicacion> {
    const response = await api.get(`/publicaciones/${id}`);
    const pub: Publicacion = response.data;
    const deletedMap = this._readDeletedMap();
    const estadoMap = this._readEstadoMap();
    const portadaMap = this._readPortadaMap();
    const withFlags = this._applyDeletedFlags(pub, deletedMap);
    const withEstado = this._applyEstadoOverride(withFlags, estadoMap);
    const orderMap = this._readOrderMap();
    const withOrder = this._applyOrderOverride(withEstado, orderMap);
    return this._applyPortadaOverride(withOrder, portadaMap);
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

  async deleteMultimedia(multimediaId: string, publicacionId?: string, markPublicationDeleted = true): Promise<void> {
    // Marca la multimedia como eliminada en localStorage (front-only)
    this._markMultimediaDeletedLocal(multimediaId);
    // Opcional: marcar la publicación como eliminada localmente para que aparezca en la sección Eliminadas
    if (publicacionId && markPublicationDeleted) {
      this._markPublicationDeletedLocal(publicacionId);
    }
    this.notifyListChanged();
  }

  async restoreMultimediaLocal(multimediaId: string): Promise<void> {
    this._restoreMultimediaLocal(multimediaId);
    this.notifyListChanged();
  }

  // -----------------
  // Local storage helpers
  // -----------------
  private _deletedMapKey = 'publicacion_multimedia_deleted_v1';
  private _estadoOverrideKey = 'publicacion_estado_override_v1';
  private _portadaKey = 'publicacion_portada_v1';
  private _orderKey = 'publicacion_multimedia_order_v1';

  private _readPortadaMap(): Record<string, string> {
    try {
      const raw = localStorage.getItem(this._portadaKey);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }

  private _writePortadaMap(m: Record<string, string>) {
    try {
      localStorage.setItem(this._portadaKey, JSON.stringify(m));
    } catch (e) {
      // ignore
    }
  }

  async setPortadaLocal(publicacionId: string, multimediaId: string) {
    try {
      const map = this._readPortadaMap();
      map[publicacionId] = multimediaId;
      this._writePortadaMap(map);
      this.notifyListChanged();
    } catch (e) {
      // ignore
    }
  }

  private _applyPortadaOverride(pub: Publicacion, portadaMap: Record<string, string>): Publicacion {
    try {
      if (!pub || !pub.id || !pub.multimedia || pub.multimedia.length === 0) return pub;
      const portadaId = portadaMap[pub.id];
      if (!portadaId) return pub;
      const idx = pub.multimedia.findIndex((m) => m.id === portadaId);
      if (idx === -1) return pub;
      // Move selected multimedia to front
      const copy = [...pub.multimedia];
      const [sel] = copy.splice(idx, 1);
      copy.unshift(sel);
      return { ...pub, multimedia: copy };
    } catch (e) {
      return pub;
    }
  }

  private _readOrderMap(): Record<string, string[]> {
    try {
      const raw = localStorage.getItem(this._orderKey);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }

  private _writeOrderMap(m: Record<string, string[]>) {
    try {
      localStorage.setItem(this._orderKey, JSON.stringify(m));
    } catch (e) {
      // ignore
    }
  }

  async setMultimediaOrderLocal(publicacionId: string, orderedIds: string[]) {
    try {
      const map = this._readOrderMap();
      map[publicacionId] = orderedIds;
      this._writeOrderMap(map);
      this.notifyListChanged();
    } catch (e) {
      // ignore
    }
  }

  private _applyOrderOverride(pub: Publicacion, orderMap: Record<string, string[]>): Publicacion {
    try {
      if (!pub || !pub.id || !pub.multimedia || pub.multimedia.length === 0) return pub;
      const order = orderMap[pub.id];
      if (!order || order.length === 0) return pub;
      const idToMult = pub.multimedia.reduce<Record<string, Multimedia>>((acc, m) => {
        if (m.id) acc[m.id] = m;
        return acc;
      }, {});
      const ordered: Multimedia[] = [];
      for (const mid of order) {
        if (idToMult[mid]) {
          ordered.push(idToMult[mid]);
          delete idToMult[mid];
        }
      }
      const remaining = pub.multimedia.filter((m) => m.id && idToMult[m.id!]);
      return { ...pub, multimedia: [...ordered, ...remaining] };
    } catch (e) {
      return pub;
    }
  }

  private _readEstadoMap(): Record<string, string> {
    try {
      const raw = localStorage.getItem(this._estadoOverrideKey);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }

  private _writeEstadoMap(m: Record<string, string>) {
    try {
      localStorage.setItem(this._estadoOverrideKey, JSON.stringify(m));
    } catch (e) {
      // ignore
    }
  }

  private _markPublicationDeletedLocal(publicacionId: string) {
    const map = this._readEstadoMap();
    map[publicacionId] = 'eliminado';
    this._writeEstadoMap(map);
  }

  async markPublicationDeletedLocal(publicacionId: string) {
    this._markPublicationDeletedLocal(publicacionId);
    this.notifyListChanged();
  }

  async restorePublicationLocal(publicacionId: string) {
    const map = this._readEstadoMap();
    // Restaurar a 'activo'
    map[publicacionId] = 'activo';
    this._writeEstadoMap(map);
    this.notifyListChanged();
  }

  private _applyEstadoOverride(pub: Publicacion, estadoMap: Record<string, string>): Publicacion {
    try {
      if (!pub || !pub.id) return pub;
      const override = estadoMap[pub.id];
      if (!override) return pub;
      return { ...pub, estado: override };
    } catch (e) {
      return pub;
    }
  }

  private _readDeletedMap(): Record<string, string[]> {
    try {
      const raw = localStorage.getItem(this._deletedMapKey);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }

  private _writeDeletedMap(m: Record<string, string[]>) {
    try {
      localStorage.setItem(this._deletedMapKey, JSON.stringify(m));
    } catch (e) {
      // ignore
    }
  }

  private _markMultimediaDeletedLocal(multimediaId: string) {
    // We don't have publicationId here; try to find it by searching cached publications in localStorage if any
    // Simpler approach: store a flat list of deleted multimedia ids under special key
    const key = `${this._deletedMapKey}_flat`;
    try {
      const raw = localStorage.getItem(key);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      if (!arr.includes(multimediaId)) arr.push(multimediaId);
      localStorage.setItem(key, JSON.stringify(arr));
    } catch (e) {
      // ignore
    }
  }

  private _restoreMultimediaLocal(multimediaId: string) {
    const key = `${this._deletedMapKey}_flat`;
    try {
      const raw = localStorage.getItem(key);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      const idx = arr.indexOf(multimediaId);
      if (idx !== -1) {
        arr.splice(idx, 1);
        localStorage.setItem(key, JSON.stringify(arr));
      }
    } catch (e) {
      // ignore
    }
  }

  private _applyDeletedFlags(pub: Publicacion, _map: Record<string, string[]>): Publicacion {
    try {
      const key = `${this._deletedMapKey}_flat`;
      const raw = localStorage.getItem(key);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      if (!pub || !pub.multimedia) return pub;
      const multimedia = pub.multimedia.map((m) => ({ ...m, eliminado: !!(m.id && arr.includes(m.id)) }));
      return { ...pub, multimedia };
    } catch (e) {
      return pub;
    }
  }
  async cambiarEstado(id: string, estado: string): Promise<Publicacion> {
    const response = await api.patch(`/publicaciones/${id}/estado`, { estado });
    this.notifyListChanged();
    return response.data;
  }
}

export default new PublicacionesService();