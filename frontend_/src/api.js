// src/api.js
import axios from 'axios';
import { message } from 'antd';


const getBaseURL = () => {
  if (process.env.NODE_ENV === 'development') {
    // Reemplaza con la IP de tu máquina en la red local
    return 'http://localhost:9090';
  } else {
    return '/api';
  }
};

/** URL absoluta del endpoint SockJS/STOMP (mismo origen que el API en producción). */
export function getWebSocketSockJsUrl() {
  const base = getBaseURL();
  if (base.startsWith('http')) {
    return `${base.replace(/\/$/, '')}/ws`;
  }
  return `${window.location.origin}/ws`;
}

const api = axios.create({
  baseURL: getBaseURL(), // URL de tu backend
});
// Interceptor para añadir el token a las solicitudes
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Interceptor para manejar errores
api.interceptors.response.use(response => response, error => {
  if (error.response) {
    if (error.response.status === 401) {
      message.error('Sesión expirada. Por favor inicie sesión nuevamente');
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login';
    } else if (error.response.status === 403) {
      message.error('No tiene permisos para realizar esta acción');
    } else {
      message.error(`Error en la solicitud: ${error.response.data.message || 'Error desconocido'}`);
    }
  } else {
    message.error('Error de conexión con el servidor');
  }
  return Promise.reject(error);
});

export default api;