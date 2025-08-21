// import React, { useState, useEffect } from 'react';
// import { View, StyleSheet, Alert } from 'react-native';
// import PedidoForm from './PedidoForm';
// import StockView from './StockView';
// import PedidosList from './PedidosList';
// import api from '../../api'; // Ajusta la ruta según tu estructura

// const PedidosMobile = () => {
//     const [pedidos, setPedidos] = useState([]);
//     const [currentPedido, setCurrentPedido] = useState(null);
//     const [showStock, setShowStock] = useState(false);
//     const [ingredientes, setIngredientes] = useState([]);
//     const [loading, setLoading] = useState(true);

//     // Cargar datos iniciales
//     useEffect(() => {
//         fetchPedidos();
//         fetchIngredientes();
//     }, []);

//     const fetchPedidos = async () => {
//         try {
//             setLoading(true);
//             const response = await api.get('/api/pedidos');
//             setPedidos(response.data);
//         } catch (error) {
//             console.error('Error fetching pedidos:', error);
//             Alert.alert('Error', 'No se pudieron cargar los pedidos');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const fetchIngredientes = async () => {
//         try {
//             const response = await api.get('/api/ingredientes');
//             setIngredientes(response.data);
//         } catch (error) {
//             console.error('Error fetching ingredientes:', error);
//         }
//     };

//     const handleCreatePedido = () => {
//         setCurrentPedido({
//             productos: [],
//             combos: [],
//             adiciones: [],
//             cantidadP1: 0,
//             cantidadC1: 0,
//             domicilio: false,
//             costoDomicilio: 2000,
//             detalles: '',
//             estado: 'PENDIENTE',
//         });
//     };

//     const handleSavePedido = async () => {
//         try {
//             let response;

//             if (currentPedido.id) {
//                 // Actualizar pedido existente
//                 response = await api.put(`/api/pedidos/${currentPedido.id}`, currentPedido);
//             } else {
//                 // Crear nuevo pedido
//                 response = await api.post('/api/pedidos', currentPedido);
//             }

//             if (response.status >= 200 && response.status < 300) {
//                 fetchPedidos();
//                 setCurrentPedido(null);
//                 Alert.alert('Éxito', currentPedido.id ? 'Pedido actualizado' : 'Pedido creado');
//             }
//         } catch (error) {
//             console.error('Error saving pedido:', error);

//             // Manejar errores de stock
//             if (error.response?.data?.detalles) {
//                 const errorMessages = error.response.data.detalles.join('\n');
//                 Alert.alert('Error de stock', errorMessages);
//             } else {
//                 Alert.alert('Error', 'No se pudo guardar el pedido');
//             }
//         }
//     };

//     const handleCancel = () => {
//         setCurrentPedido(null);
//     };

//     return (
//         <View style={styles.container}>
//             {currentPedido ? (
//                 <>
//                     <PedidoForm
//                         pedido={currentPedido}
//                         onChange={setCurrentPedido}
//                         onSave={handleSavePedido}
//                         onCancel={handleCancel}
//                         toggleStock={() => setShowStock(!showStock)}
//                     />

//                     {showStock && (
//                         <StockView
//                             ingredientes={ingredientes}
//                             onClose={() => setShowStock(false)}
//                         />
//                     )}
//                 </>
//             ) : (
//                 <PedidosList
//                     pedidos={pedidos}
//                     onCreate={handleCreatePedido}
//                     onEdit={pedido => setCurrentPedido(pedido)}
//                     loading={loading}
//                 />
//             )}
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         padding: 10,
//         backgroundColor: '#f5f5f5',
//     },
// });

// export default PedidosMobile;

import React from 'react'

export default function PedidosMobile() {
  return (
    <div>HOliiiii</div>
  )
}
