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

const api = axios.create({
  baseURL: getBaseURL(), // URL de tu backend
});
// Interceptor para añadir el token a las solicitudes
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('🚀 Request:', config.method.toUpperCase(), config.url);
  console.log('🔑 Token:', token ? 'Presente' : 'Ausente');
  return config;
}, error => {
  return Promise.reject(error);
});

// Interceptor para manejar errores
api.interceptors.response.use(
  response => {
    // ✅ LOG para debug (eliminar después)
    console.log('✅ Response:', response.status, response.config.url);
    return response;
  },
  error => {
    // ✅ LOG para debug (eliminar después)
    console.error('❌ Error Response:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });

    if (error.response) {
      const status = error.response.status;
      
      switch (status) {
        case 401:
          message.error('Sesión expirada. Por favor inicie sesión nuevamente');
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          localStorage.removeItem('roles');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
          break;
          
        case 403:
          message.error('No tienes permisos para acceder a este recurso');
          setTimeout(() => {
            window.location.href = '/forbidden';
          }, 1500);
          break;
          
        case 404:
          message.error('Recurso no encontrado');
          break;
          
        case 500:
          message.error('Error interno del servidor');
          break;
          
        default:
          message.error(
            error.response.data?.mensaje || 
            error.response.data?.message || 
            'Error en la solicitud'
          );
      }
    } else if (error.request) {
      message.error('Error de conexión con el servidor');
      console.error('Error de red:', error.request);
    } else {
      message.error('Error al configurar la solicitud');
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;