// ============================================================================
// publicaciones.service.ts
// Servicio oficial de manejo de Publicaciones (Backend + LocalStorage)
// ============================================================================

import api from "./api";

// Tipos necesarios
export interface Multimedia {
  id?: string;
  url: string;
  tipo: "imagen" | "video";
  orden?: number;
  eliminado?: boolean;
}

export interface Publicacion {
  id?: string;
  titulo: string;
  descripcion: string;
  precio?: number;
  estado?: string;
  id_vendedor?: string;
  id_producto: string;   
  categoria?: any;
  multimedia?: Multimedia[];
}

// DTO oficial para actualizar
export interface UpdatePublicacionDto {
  titulo?: string;
  descripcion?: string;
  precio?: number;
}

// =============================================================================
// LOCALSTORAGE HELPERS (solo datos mock nuevos)
// =============================================================================

const EXTRA_KEY = "publicacion_extras"; // { [idPublicacion]: { categoriaMock, productoMock, stockMock, tipoEntregaMock } }

function loadExtras() {
  try {
    const raw = localStorage.getItem(EXTRA_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveExtras(map: any) {
  localStorage.setItem(EXTRA_KEY, JSON.stringify(map));
}

// =============================================================================
// LOCALSTORAGE HELPERS PARA IMÁGENES Y ESTADO
// =============================================================================

const ORDER_KEY = "publicacion_multimedia_order"; // { [idPub]: [array de ids en orden] }
const DELETE_KEY = "publicacion_deleted";         // { [idPub]: true/false }
const DELETE_MEDIA_KEY = "publicacion_media_deleted"; // { idMedia: true/false }
const PORTADA_KEY = "publicacion_portada";        // { [idPub]: idMedia }

function load(key: string): any {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
}

// =============================================================================
// PUBLICACIONES SERVICE
// =============================================================================

const publicacionesService = {
  // ============================================================================
  // GET ALL
  // ============================================================================
  async getAll(params: any = {}) {
    const res = await api.get("/publicaciones", { params });
    return res.data;
  },

  // ============================================================================
  // GET BY ID (mezcla backend + extras locales + orden + portada + eliminadas)
  // ============================================================================
  async getById(id: string): Promise<Publicacion> {
    const res = await api.get(`/publicaciones/${id}`);
    const pub = res.data;

    if (!pub.multimedia) pub.multimedia = [];

    // ---- aplicar portada local ----
    const portadaMap = load(PORTADA_KEY);
    if (portadaMap[id]) {
      pub.multimedia.sort((a: any, b: any) =>
        a.id === portadaMap[id] ? -1 : b.id === portadaMap[id] ? 1 : 0
      );
    }

    // ---- aplicar orden local ----
    const orderMap = load(ORDER_KEY);
    if (orderMap[id]) {
      const order = orderMap[id];
      pub.multimedia.sort((a: any, b: any) => {
        const ia = order.indexOf(a.id);
        const ib = order.indexOf(b.id);
        return ia - ib;
      });
    }

    // ---- aplicar eliminadas localmente ----
    const delMedia = load(DELETE_MEDIA_KEY);
    pub.multimedia = pub.multimedia.map((m: Multimedia) => ({
      ...m,
      eliminado: delMedia[m.id || ""] || false,
    }));

    // ---- estado de la publicación ----
    const deletedMap = load(DELETE_KEY);
    if (deletedMap[id]) {
      pub.estado = "ELIMINADO";
    }

    // ---- aplicar extras mock ----
    const extras = loadExtras();
    if (extras[id]) {
      pub["categoriaMock"] = extras[id].categoriaMock ?? null;
      pub["productoMock"] = extras[id].productoMock ?? null;
      pub["stockMock"] = extras[id].stockMock ?? null;
      pub["tipoEntregaMock"] = extras[id].tipoEntregaMock ?? null;
    }

    return pub;
  },

  // ============================================================================
  // CREAR PUBLICACIÓN (envía solo datos REALES al backend)
  // y guarda mocks en localStorage
  // ============================================================================
  async create(dto: any, mockExtras: any) {
    const res = await api.post("/publicaciones", dto);
    const pubId = res.data?.id;

    // Guardar datos mock (stock, tipoEntrega, producto, categoría)
    if (pubId) {
      const map = loadExtras();
      map[pubId] = {
        categoriaMock: mockExtras.categoriaMock ?? null,
        productoMock: mockExtras.productoMock ?? null,
        stockMock: mockExtras.stockMock ?? null,
        tipoEntregaMock: mockExtras.tipoEntregaMock ?? null,
      };
      saveExtras(map);
    }

    return res.data;
  },

  // ============================================================================
  // ACTUALIZAR PUBLICACIÓN (solo backend)
  // y guardar solo mocks en localStorage
  // ============================================================================
  async update(id: string, dto: UpdatePublicacionDto, mockExtras?: any) {
    const res = await api.patch(`/publicaciones/${id}`, dto);

    if (mockExtras) {
      const map = loadExtras();
      map[id] = {
        categoriaMock: mockExtras.categoriaMock ?? null,
        productoMock: mockExtras.productoMock ?? null,
        stockMock: mockExtras.stockMock ?? null,
        tipoEntregaMock: mockExtras.tipoEntregaMock ?? null,
      };
      saveExtras(map);
    }

    return res.data;
  },

  // ============================================================================
  // AGREGAR MULTIMEDIA
  // ============================================================================
  async addMultimedia(idPublicacion: string, item: any) {
    const res = await api.post(`/publicaciones/${idPublicacion}/multimedia`, item);
    return res.data;
  },

  // ============================================================================
  // CAMBIAR ESTADO DE PUBLICACIÓN
  // ============================================================================
  async cambiarEstado(id: string, estado: 'borrador' | 'en_revision' | 'activo' | 'pausado' | 'vendido' | 'rechazado' | 'eliminado') {
    const res = await api.patch(`/publicaciones/${id}/estado`, { estado });
    return res.data;
  },

  // ============================================================================
  // ELIMINAR PUBLICACIÓN (cambiar estado a eliminado)
  // ============================================================================
  async delete(id: string) {
    const res = await api.delete(`/publicaciones/${id}`);
    return res.data;
  },

  // ============================================================================
  // ELIMINAR MULTIMEDIA (local, no backend)
  // ============================================================================
  async deleteMultimedia(idMedia: string) {
    const map = load(DELETE_MEDIA_KEY);
    map[idMedia] = true;
    save(DELETE_MEDIA_KEY, map);
  },

  async restoreMultimediaLocal(idMedia: string) {
    const map = load(DELETE_MEDIA_KEY);
    delete map[idMedia];
    save(DELETE_MEDIA_KEY, map);
  },

  // ============================================================================
  // MARCAR PUBLICACIÓN COMO ELIMINADA (local)
  // ============================================================================
  async markPublicationDeletedLocal(id: string) {
    const map = load(DELETE_KEY);
    map[id] = true;
    save(DELETE_KEY, map);
  },

  async restorePublicationLocal(id: string) {
    const map = load(DELETE_KEY);
    delete map[id];
    save(DELETE_KEY, map);
  },

  // ============================================================================
  // ORDENAR MULTIMEDIA (local)
  // ============================================================================
  async setMultimediaOrderLocal(idPublicacion: string, ids: string[]) {
    const map = load(ORDER_KEY);
    map[idPublicacion] = ids;
    save(ORDER_KEY, map);
  },

  // ============================================================================
  // PORTADA (local)
  // ============================================================================
  async setPortadaLocal(idPublicacion: string, idMultimedia: string) {
    const map = load(PORTADA_KEY);
    map[idPublicacion] = idMultimedia;
    save(PORTADA_KEY, map);
  },

  // ============================================================================
  // OBTENER HISTORIAL DE MODERACIÓN
  // ============================================================================
  async getModeracion(id: string): Promise<any[]> {
    const res = await api.get(`/publicaciones/${id}/moderacion`);
    return res.data;
  },
};

export default publicacionesService;
