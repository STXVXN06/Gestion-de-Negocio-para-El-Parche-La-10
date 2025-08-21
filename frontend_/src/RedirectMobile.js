// src/RedirectMobile.js
import { Navigate } from 'react-router-dom';

const RedirectMobile = () => {
  const roles = JSON.parse(localStorage.getItem('roles') || '[]');
  
  if (roles.includes('ROLE_EMPLEADO')) {
    return <Navigate to="/pedidos-mobile" replace />;
  }
  return <Navigate to="/ingredientes" replace />;
};

export default RedirectMobile;