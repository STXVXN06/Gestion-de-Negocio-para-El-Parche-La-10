// src/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { LockFill, PersonFill } from 'react-bootstrap-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import api from '../api';

const Login = ({setIsAuthenticated}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('http://localhost:9090/login', {
                username,
                password
            });

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('username', username);


                // Guardar roles en localStorage
                localStorage.setItem('roles', JSON.stringify(response.data.roles));
                setIsAuthenticated(true);
                // Redirigir según rol
                if (response.data.roles.includes('ROLE_EMPLEADO')) {
                    navigate('/pedidos-mobile');
                } else {
                    navigate('/');
                }
            }
        } catch (err) {
            setError('Credenciales incorrectas o usuario no autorizado');
            console.error('Error de autenticación:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
            <Card className="shadow-lg" style={{ width: '400px', borderRadius: '15px' }}>
                <Card.Body className="p-4">
                    <div className="text-center mb-4">
                        <div className="bg-primary rounded-circle p-3 d-inline-block mb-3">
                            <LockFill size={40} color="white" />
                        </div>
                        <h2 className="fw-bold">Acceso Administrativo</h2>
                        <p className="text-muted">Ingrese sus credenciales para continuar</p>
                    </div>

                    {error && <Alert variant="danger" className="text-center">{error}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-medium">Usuario</Form.Label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0">
                                    <PersonFill />
                                </span>
                                <Form.Control
                                    type="text"
                                    placeholder="Ingrese su usuario"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="border-start-0"
                                />
                            </div>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="fw-medium">Contraseña</Form.Label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0">
                                    <LockFill />
                                </span>
                                <Form.Control
                                    type="password"
                                    placeholder="Ingrese su contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="border-start-0"
                                />
                            </div>
                        </Form.Group>

                        <Button
                            variant="primary"
                            type="submit"
                            className="w-100 py-2 fw-bold"
                            disabled={loading}
                        >
                            {loading ? 'Verificando...' : 'Ingresar al Sistema'}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Login;