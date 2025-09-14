import React, { useState, useEffect } from 'react';
import api from '../api';
import './ListadoUsuarios.css';
import AgregarUsuario from './AgregarUsuario';
import { message, Modal } from 'antd';
import 'antd/dist/reset.css';

const ListadoUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);


  const [messageApi, contextHolder] = message.useMessage();

  const cargarUsuarios = async () => {
    try {
      const response = await api.get('/api/users');
      setUsuarios(response.data);
      setLoading(false);
    } catch (err) {
      setError('Error al cargar los usuarios');
      setLoading(false);
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    cargarUsuarios();

    return () => {
      // Limpiar el estado cuando el componente se desmonte
      setConfirmModalVisible(false);
      setUsuarioAEliminar(null);
    };
  }, []);

  const handleAgregarUsuario = () => {
    setModalAbierto(true);
  };

  const handleCerrarModal = () => {
    setModalAbierto(false);
  };

  const handleUsuarioAgregado = (nuevoUsuario) => {
    cargarUsuarios();
  };

  const mostrarConfirmacionEliminar = (usuario) => {
    setUsuarioAEliminar(usuario);
    setConfirmModalVisible(true);
  };

  const handleEliminarConfirmado = async () => {
    if (!usuarioAEliminar) return;

    try {
      const response = await api.delete(`/api/users/${usuarioAEliminar.id}`);

      // Verificar si la respuesta tiene un mensaje del backend
      if (response.data && response.data.message) {
        messageApi.success(response.data.message);
        console.log(response.data.message);
      } else {
        messageApi.success(`Usuario ${usuarioAEliminar.username} eliminado correctamente`);
      }

      setConfirmModalVisible(false);
      setUsuarioAEliminar(null);
      cargarUsuarios();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        message.error(err.response.data.message);
      } else {
        message.error('Error al eliminar el usuario');
      }
      console.error('Error deleting user:', err);
    }
  };

  const cancelarEliminacion = () => {
    setConfirmModalVisible(false);
    setUsuarioAEliminar(null);
  };

  // Filtrar usuarios por rol
  const administradores = usuarios.filter(user =>
    user.roles && user.roles.some(role => role.name === 'ROLE_ADMIN')
  );

  const empleados = usuarios.filter(user =>
    user.roles && !user.roles.some(role => role.name === 'ROLE_ADMIN')
  );

  const handleEditar = (usuario) => {
    console.log('Editar usuario:', usuario);
    // La funcionalidad se implementará más tarde
  };

  if (loading) {
    return <div className="listado-usuarios-container">Cargando usuarios...</div>;
  }

  if (error) {
    return <div className="listado-usuarios-container">{error}</div>;
  }

  return (
    <div className="listado-usuarios-container">
      {contextHolder}
      <h2>Gestión de Usuarios</h2>

      <button className="btn-agregar" onClick={handleAgregarUsuario}>
        + Agregar Nuevo Usuario
      </button>

      <AgregarUsuario
        isOpen={modalAbierto}
        onClose={handleCerrarModal}
        onUsuarioAgregado={handleUsuarioAgregado}
      />

      {/* Modal de confirmación */}
      <Modal
        title="Confirmar eliminación"
        open={confirmModalVisible}
        onOk={handleEliminarConfirmado}
        onCancel={cancelarEliminacion}
        okText="Sí, eliminar"
        cancelText="Cancelar"
      >
        <p>¿Estás seguro de que deseas eliminar al usuario <strong>{usuarioAEliminar?.username}</strong>?</p>
        <p>Esta acción no se puede deshacer.</p>
      </Modal>

      <div className="usuarios-grid">
        {/* Columna de Administradores */}
        <div className="columna-administradores">
          <h3>Administradores</h3>
          {administradores.length === 0 ? (
            <p>No hay administradores registrados</p>
          ) : (
            administradores.map(usuario => (
              <div key={usuario.id} className="usuario-card">
                <div className="usuario-info">
                  <span className="usuario-nombre">{usuario.username}</span>
                  <span className="usuario-rol">Administrador</span>
                </div>
                <div className="usuario-acciones">
                  <button
                    className="btn-editar"
                    onClick={() => handleEditar(usuario)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-eliminar"
                    onClick={() => mostrarConfirmacionEliminar(usuario)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Columna de Empleados */}
        <div className="columna-empleados">
          <h3>Empleados</h3>
          {empleados.length === 0 ? (
            <p>No hay empleados registrados</p>
          ) : (
            empleados.map(usuario => (
              <div key={usuario.id} className="usuario-card">
                <div className="usuario-info">
                  <span className="usuario-nombre">{usuario.username}</span>
                  <span className="usuario-rol">Empleado</span>
                </div>
                <div className="usuario-acciones">
                  <button
                    className="btn-editar"
                    onClick={() => handleEditar(usuario)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-eliminar"
                    onClick={() => mostrarConfirmacionEliminar(usuario)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ListadoUsuarios;