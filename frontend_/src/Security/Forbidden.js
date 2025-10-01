// src/Security/Forbidden.js
import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import { ShieldExclamation, ArrowLeft } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import './Forbidden.css';

const Forbidden = () => {
    const navigate = useNavigate();
    const roles = JSON.parse(localStorage.getItem('roles') || '[]');
    const isAdmin = roles.includes('ROLE_ADMIN');

    const handleGoBack = () => {
        if (isAdmin) {
            navigate('/reportes');
        } else {
            navigate('/pedidos-mobile');
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light forbidden-container">
            <Alert 
                variant="warning" 
                className="text-center p-5 shadow-lg forbidden-alert" 
                style={{ maxWidth: '600px', borderRadius: '15px' }}
            >
                <ShieldExclamation 
                    size={80} 
                    className="mb-4 text-warning forbidden-icon" 
                />
                <h1 className="fw-bold mb-3">Acceso Restringido</h1>
                <h4 className="text-muted mb-4">Error 403 - Prohibido</h4>
                <p className="fs-5 mb-4">
                    No tienes los permisos necesarios para acceder a este recurso.
                    <br />
                    <small className="text-muted">
                        Si crees que esto es un error, contacta al administrador del sistema.
                    </small>
                </p>
                <div className="d-flex gap-2 justify-content-center flex-wrap">
                    <Button
                        variant="warning"
                        size="lg"
                        onClick={handleGoBack}
                        className="d-flex align-items-center gap-2"
                    >
                        <ArrowLeft size={20} />
                        Volver al Inicio
                    </Button>
                    <Button
                        variant="outline-secondary"
                        size="lg"
                        onClick={() => window.history.back()}
                    >
                        Página Anterior
                    </Button>
                </div>
            </Alert>
        </div>
    );
};

export default Forbidden;