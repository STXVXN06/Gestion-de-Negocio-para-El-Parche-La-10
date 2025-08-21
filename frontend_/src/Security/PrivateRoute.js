// src/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const PrivateRoute = ({ children, requiredRoles = [] }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        const decodedToken = jwtDecode(token);

        const userRoles = decodedToken.authorities || [];

        // Verificar si el usuario tiene al menos uno de los roles requeridos
        const hasRequiredRole = requiredRoles.some(role =>
            userRoles.includes(role)
        );

        if (!hasRequiredRole) {
            return <Navigate to="/unauthorized" replace />;
        }

        return children;
    } catch (error) {
        console.error('Error decodificando token:', error);
        return <Navigate to="/login" replace />;
    }
};

export default PrivateRoute;