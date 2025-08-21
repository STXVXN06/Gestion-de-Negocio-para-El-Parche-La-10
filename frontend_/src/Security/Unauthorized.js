// src/Unauthorized.js
import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import { ShieldExclamation } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <Alert variant="danger" className="text-center p-5 shadow">
                <ShieldExclamation size={64} className="mb-3 text-danger" />
                <h2 className="fw-bold mb-3">Acceso No Autorizado</h2>
                <p className="fs-5 mb-4">
                    No tienes los permisos necesarios para acceder a esta sección.
                    <br />
                    Contacta al administrador del sistema.
                </p>
                <Button
                    variant="outline-danger"
                    size="lg"
                    onClick={() => navigate('/login')}
                >
                    Volver al inicio de sesion
                </Button>
            </Alert>
        </div>
    );
};

export default Unauthorized;