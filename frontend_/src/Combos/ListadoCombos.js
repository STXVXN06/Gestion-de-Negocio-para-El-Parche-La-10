// src/components/ListadoCombos.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Button, Modal, List, Tag, Spin, notification } from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import './ListadoCombos.css'; // Archivo CSS para estilos personalizados

const { Meta } = Card;

export default function ListadoCombos() {
    const [combos, setCombos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [comboToDelete, setComboToDelete] = useState(null);

    useEffect(() => {
        fetchCombos();
    }, []);

    const fetchCombos = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:9090/api/combos');
            setCombos(response.data);
            setLoading(false);
        } catch (err) {
            setError('Error al cargar los combos');
            setLoading(false);
            console.error(err);
        }
    };

    const showDeleteConfirm = (combo) => {
        setComboToDelete(combo);
        setIsDeleteModalVisible(true);
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`/api/combos/${comboToDelete.id}`);
            notification.success({
                message: 'Combo desactivado',
                description: 'El combo ha sido desactivado correctamente.',
                placement: 'bottomRight'
            });
            fetchCombos();
        } catch (err) {
            notification.error({
                message: 'Error',
                description: 'No se pudo desactivar el combo.',
                placement: 'bottomRight'
            });
            console.error(err);
        }
        setIsDeleteModalVisible(false);
    };

    const handleAddCombo = () => {
        // Navegar a AgregarCombo
        notification.info({
            message: 'Redirección',
            description: 'Redirigiendo a Agregar Combo...',
            placement: 'bottomRight'
        });
        console.log("Navegar a AgregarCombo");
    };

    const handleEditCombo = (combo) => {
        // Navegar a EditarCombo
        notification.info({
            message: 'Editar Combo',
            description: `Editando combo: ${combo.nombre}`,
            placement: 'bottomRight'
        });
        console.log(`Navegar a EditarCombo para combo ID: ${combo.id}`);
    };

    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return <div className="alert alert-danger text-center mt-5">{error}</div>;
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Gestión de Combos</h1>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddCombo}
                >
                    Agregar Nuevo Combo
                </Button>
            </div>

            {combos.length === 0 ? (
                <div className="alert alert-info text-center">
                    No hay combos disponibles
                </div>
            ) : (
                <div className="row">
                    {combos.map(combo => (
                        <div className="col-md-4 mb-4" key={combo.id}>
                            <Card
                                className="combo-card"
                                actions={[
                                    <EditOutlined
                                        key="edit"
                                        onClick={() => handleEditCombo(combo)}
                                    />,
                                    <DeleteOutlined
                                        key="delete"
                                        onClick={() => showDeleteConfirm(combo)}
                                    />
                                ]}
                            >
                                <Meta
                                    title={
                                        <div className="d-flex justify-content-between">
                                            <span>{combo.nombre}</span>
                                            <Tag
                                                color={combo.activo ? "green" : "red"}
                                                icon={combo.activo ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                                            >
                                                {combo.activo ? "Activo" : "Inactivo"}
                                            </Tag>
                                        </div>
                                    }
                                    description={
                                        <>
                                            <p className="text-primary fw-bold">${combo.precio.toLocaleString()}</p>
                                            <p>{combo.descripcion || "Sin descripción"}</p>

                                            <div className="mt-3">
                                                <h6>Productos incluidos:</h6>
                                                <List
                                                    size="small"
                                                    dataSource={combo.productos || []}
                                                    renderItem={item => (
                                                        <List.Item>
                                                            <List.Item.Meta
                                                                title={`${item.cantidad}x ${item.nombre}`}
                                                                description={`$${item.precio.toLocaleString()} c/u`}
                                                            />
                                                        </List.Item>
                                                    )}
                                                />
                                            </div>

                                            <p className="mt-2">
                                                <small className="text-muted">Descuento: {combo.descuento * 100}%</small>
                                            </p>
                                        </>
                                    }
                                />
                            </Card>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                title="Confirmar desactivación"
                visible={isDeleteModalVisible}
                onOk={handleDelete}
                onCancel={() => setIsDeleteModalVisible(false)}
                okText="Desactivar"
                cancelText="Cancelar"
                okButtonProps={{ danger: true }}
            >
                <p>
                    ¿Está seguro que desea desactivar el combo "{comboToDelete?.nombre}"?
                    Los usuarios ya no podrán seleccionarlo en nuevos pedidos.
                </p>
            </Modal>
        </div>
    );
}