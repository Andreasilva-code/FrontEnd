// Configuración centralizada de la API
// Usamos variables de entorno para que sea fácil cambiar entre local y producción (Vercel)
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

export const API_BASE_URL = BASE_URL;

// Rutas específicas
export const API_ROUTES = {
  PARKING: `${API_BASE_URL}/solicitudparqueadero`,
  MOVING: `${API_BASE_URL}/solicitudtrasteos`,
  SOCIAL_HALL: `${API_BASE_URL}/solicitudsalonessociales`,
  MURO: `${API_BASE_URL}/muro`,
  LOGIN: `${API_BASE_URL}/usuarios/login`,
  REGISTER: `${API_BASE_URL}/usuarios`,
  RESIDENTS: `${API_BASE_URL}/residentes`,
  VISITOR_PARKING: `${API_BASE_URL}/parqueaderovisitante`,
  PQRS: `${API_BASE_URL}/pqrs`,
  // Para las imágenes y documentos, usamos la URL raíz del servidor (fuera de /api)
  UPLOAD_DIR: `${API_BASE_URL.replace('/api', '')}/uploads/`
};
