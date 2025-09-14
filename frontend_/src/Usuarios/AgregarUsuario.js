import React, { useState } from 'react';
import api from '../api';
import './AgregarUsuario.css';

const AgregarUsuario = ({ isOpen, onClose, onUsuarioAgregado }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    isAdmin: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      isAdmin: false
    });
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const usuarioData = {
        username: formData.username,
        password: formData.password,
        admin: formData.isAdmin
      };

      const response = await api.post('/api/users', usuarioData);

      handleClose();

      if (onUsuarioAgregado) {
        onUsuarioAgregado(response.data);
        
      }
    } catch (err) {
      if (err.response && err.response.data) {
        // Manejar errores de validación del backend
        if (typeof err.response.data === 'object') {
          const errorMessages = Object.values(err.response.data).join(', ');
          setError(errorMessages);
        } else {
          setError(err.response.data.message || 'Error al crear el usuario');
        }
      } else {
        setError('Error de conexión con el servidor');
      }
      console.error('Error creating user:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Agregar Nuevo Usuario</h3>
          <button
            className="close-button"
            onClick={handleClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="usuario-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Nombre de usuario:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              minLength={3}
              maxLength={15}
              placeholder="Entre 3 y 15 caracteres"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Mínimo 6 caracteres"
              disabled={loading}
            />
          </div>

          <div className="form-group checkbox-group">
            <label htmlFor="isAdmin" className="checkbox-label">
              <input
                type="checkbox"
                id="isAdmin"
                name="isAdmin"
                checked={formData.isAdmin}
                onChange={handleInputChange}
                disabled={loading}
              />
              <span className="checkmark"></span>
              ¿Es administrador?
            </label>
            <p className="checkbox-help">
              Si no se marca, el usuario tendrá roles de USER y EMPLEADO por defecto
            </p>
          </div>

          <div className="form-buttons">
            <button
              type="button"
              onClick={handleClose}
              className="btn-cancelar"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-guardar"
            >
              {loading ? 'Creando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgregarUsuario;