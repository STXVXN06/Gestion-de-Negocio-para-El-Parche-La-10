// import React, { useState } from 'react';
// import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet, ScrollView, Modal, Switch } from 'react-native';

// const PedidoForm = ({ pedido, onChange, onSave, onCancel, toggleStock }) => {
//     const [modalVisible, setModalVisible] = useState(false);
//     const [modalType, setModalType] = useState('');
//     const [selectedItems, setSelectedItems] = useState([]);
//     const [busqueda, setBusqueda] = useState('');

//     // Estados para desechables y domicilio
//     const [cantidadP1, setCantidadP1] = useState(pedido.cantidadP1 || 0);
//     const [cantidadC1, setCantidadC1] = useState(pedido.cantidadC1 || 0);
//     const [domicilio, setDomicilio] = useState(pedido.domicilio || false);
//     const [costoDomicilio, setCostoDomicilio] = useState(pedido.costoDomicilio || 2000);

//     const handleAddProduct = () => {
//         setModalType('productos');
//         setModalVisible(true);
//         // En una implementación real, cargaríamos productos desde la API
//         setSelectedItems([
//             { id: 1, nombre: 'Hamburguesa Clásica', precio: 12000 },
//             { id: 2, nombre: 'Pizza Margarita', precio: 15000 },
//             // ...otros productos
//         ]);
//     };

//     const handleAddCombo = () => {
//         setModalType('combos');
//         setModalVisible(true);
//         // En una implementación real, cargaríamos combos desde la API
//         setSelectedItems([
//             { id: 101, nombre: 'Combo Familiar', precio: 35000 },
//             { id: 102, nombre: 'Combo Pareja', precio: 25000 },
//             // ...otros combos
//         ]);
//     };

//     const handleAddAdicion = () => {
//         setModalType('adiciones');
//         setModalVisible(true);
//         // En una implementación real, cargaríamos adiciones desde la API
//         setSelectedItems([
//             { id: 201, nombre: 'Queso Extra', precio: 2000 },
//             { id: 202, nombre: 'Tocineta Extra', precio: 3000 },
//             // ...otras adiciones
//         ]);
//     };

//     const handleSelectItem = (item) => {
//         const newItem = {
//             ...item,
//             cantidad: 1,
//             aplicadoA: modalType === 'adiciones' ? '' : undefined
//         };

//         const currentItems = [...pedido[modalType]];
//         const existingIndex = currentItems.findIndex(i => i.id === item.id);

//         if (existingIndex > -1) {
//             currentItems[existingIndex].cantidad += 1;
//         } else {
//             currentItems.push(newItem);
//         }

//         onChange({
//             ...pedido,
//             [modalType]: currentItems
//         });

//         setModalVisible(false);
//     };

//     const updateItemQuantity = (type, id, cantidad) => {
//         const updatedItems = pedido[type].map(item =>
//             item.id === id ? { ...item, cantidad } : item
//         ).filter(item => item.cantidad > 0);

//         onChange({
//             ...pedido,
//             [type]: updatedItems
//         });
//     };

//     const filteredItems = selectedItems.filter(item =>
//         item.nombre.toLowerCase().includes(busqueda.toLowerCase())
//     );

//     // Calcular total
//     const calcularTotal = () => {
//         let total = 0;

//         // Sumar productos
//         pedido.productos.forEach(p => total += p.precio * p.cantidad);

//         // Sumar combos
//         pedido.combos.forEach(c => total += c.precio * c.cantidad);

//         // Sumar adiciones
//         pedido.adiciones.forEach(a => total += a.precio * a.cantidad);

//         // Sumar desechables
//         total += cantidadP1 * 500;
//         total += cantidadC1 * 500;

//         // Sumar domicilio
//         if (domicilio) total += costoDomicilio;

//         return total;
//     };

//     const handleSave = () => {
//         // Actualizar el pedido con los valores actuales
//         const updatedPedido = {
//             ...pedido,
//             cantidadP1,
//             cantidadC1,
//             domicilio,
//             costoDomicilio,
//             total: calcularTotal()
//         };

//         onChange(updatedPedido);
//         onSave();
//     };

//     return (
//         <ScrollView style={styles.container}>
//             <Text style={styles.header}>
//                 {pedido.id ? `Editando Pedido #${pedido.id}` : 'Nuevo Pedido'}
//             </Text>

//             <Button title="Ver Stock Ingredientes" onPress={toggleStock} />

//             {/* Sección Productos */}
//             <Text style={styles.sectionTitle}>Productos:</Text>
//             <FlatList
//                 data={pedido.productos}
//                 keyExtractor={item => item.id.toString()}
//                 renderItem={({ item }) => (
//                     <View style={styles.itemContainer}>
//                         <Text>{item.nombre} x {item.cantidad}</Text>
//                         <View style={styles.quantityControls}>
//                             <Button
//                                 title="-"
//                                 onPress={() => updateItemQuantity('productos', item.id, item.cantidad - 1)}
//                             />
//                             <Text style={styles.quantityText}>{item.cantidad}</Text>
//                             <Button
//                                 title="+"
//                                 onPress={() => updateItemQuantity('productos', item.id, item.cantidad + 1)}
//                             />
//                         </View>
//                     </View>
//                 )}
//             />
//             <Button title="+ Producto" onPress={handleAddProduct} />

//             {/* Sección Combos */}
//             <Text style={styles.sectionTitle}>Combos:</Text>
//             <FlatList
//                 data={pedido.combos}
//                 keyExtractor={item => item.id.toString()}
//                 renderItem={({ item }) => (
//                     <View style={styles.itemContainer}>
//                         <Text>{item.nombre} x {item.cantidad}</Text>
//                         <View style={styles.quantityControls}>
//                             <Button
//                                 title="-"
//                                 onPress={() => updateItemQuantity('combos', item.id, item.cantidad - 1)}
//                             />
//                             <Text style={styles.quantityText}>{item.cantidad}</Text>
//                             <Button
//                                 title="+"
//                                 onPress={() => updateItemQuantity('combos', item.id, item.cantidad + 1)}
//                             />
//                         </View>
//                     </View>
//                 )}
//             />
//             <Button title="+ Combo" onPress={handleAddCombo} />

//             {/* Sección Adiciones */}
//             <Text style={styles.sectionTitle}>Adiciones:</Text>
//             <FlatList
//                 data={pedido.adiciones}
//                 keyExtractor={item => item.id.toString()}
//                 renderItem={({ item }) => (
//                     <View style={styles.itemContainer}>
//                         <Text>{item.nombre} x {item.cantidad}</Text>
//                         <View style={styles.quantityControls}>
//                             <Button
//                                 title="-"
//                                 onPress={() => updateItemQuantity('adiciones', item.id, item.cantidad - 1)}
//                             />
//                             <Text style={styles.quantityText}>{item.cantidad}</Text>
//                             <Button
//                                 title="+"
//                                 onPress={() => updateItemQuantity('adiciones', item.id, item.cantidad + 1)}
//                             />
//                         </View>
//                     </View>
//                 )}
//             />
//             <Button title="+ Adición" onPress={handleAddAdicion} />

//             {/* Desechables */}
//             <Text style={styles.sectionTitle}>Desechables:</Text>
//             <View style={styles.desechablesContainer}>
//                 <Text>P1:</Text>
//                 <TextInput
//                     style={styles.input}
//                     keyboardType="numeric"
//                     value={cantidadP1.toString()}
//                     onChangeText={text => setCantidadP1(Number(text) || 0)}
//                 />

//                 <Text>C1:</Text>
//                 <TextInput
//                     style={styles.input}
//                     keyboardType="numeric"
//                     value={cantidadC1.toString()}
//                     onChangeText={text => setCantidadC1(Number(text) || 0)}
//                 />
//             </View>

//             {/* Domicilio */}
//             <View style={styles.domicilioContainer}>
//                 <Text>Domicilio:</Text>
//                 <Switch
//                     value={domicilio}
//                     onValueChange={setDomicilio}
//                 />
//                 {domicilio && (
//                     <TextInput
//                         style={styles.input}
//                         keyboardType="numeric"
//                         value={costoDomicilio.toString()}
//                         onChangeText={text => setCostoDomicilio(Number(text) || 0)}
//                         placeholder="Costo domicilio"
//                     />
//                 )}
//             </View>

//             {/* Detalles */}
//             <Text style={styles.sectionTitle}>Detalles:</Text>
//             <TextInput
//                 style={[styles.input, styles.multilineInput]}
//                 value={pedido.detalles}
//                 onChangeText={text => onChange({ ...pedido, detalles: text })}
//                 placeholder="Notas especiales"
//                 multiline
//                 numberOfLines={4}
//             />

//             {/* Total */}
//             <Text style={styles.totalText}>Total: ${calcularTotal().toLocaleString()}</Text>

//             {/* Botones de acción */}
//             <View style={styles.buttonsContainer}>
//                 <Button title="Cancelar" onPress={onCancel} color="gray" />
//                 <Button title="Guardar" onPress={handleSave} color="green" />
//             </View>

//             {/* Modal para seleccionar items */}
//             <Modal
//                 animationType="slide"
//                 transparent={false}
//                 visible={modalVisible}
//                 onRequestClose={() => setModalVisible(false)}
//             >
//                 <View style={styles.modalContainer}>
//                     <Text style={styles.modalTitle}>
//                         Seleccionar {modalType === 'productos' ? 'Productos' :
//                             modalType === 'combos' ? 'Combos' : 'Adiciones'}
//                     </Text>

//                     <TextInput
//                         style={styles.searchInput}
//                         placeholder="Buscar..."
//                         value={busqueda}
//                         onChangeText={setBusqueda}
//                     />

//                     <FlatList
//                         data={filteredItems}
//                         keyExtractor={item => item.id.toString()}
//                         renderItem={({ item }) => (
//                             <TouchableOpacity
//                                 style={styles.modalItem}
//                                 onPress={() => handleSelectItem(item)}
//                             >
//                                 <Text>{item.nombre}</Text>
//                                 <Text>${item.precio.toLocaleString()}</Text>
//                             </TouchableOpacity>
//                         )}
//                     />

//                     <Button
//                         title="Cerrar"
//                         onPress={() => setModalVisible(false)}
//                     />
//                 </View>
//             </Modal>
//         </ScrollView>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         padding: 10,
//     },
//     header: {
//         fontSize: 20,
//         fontWeight: 'bold',
//         marginBottom: 15,
//         textAlign: 'center',
//     },
//     sectionTitle: {
//         fontWeight: 'bold',
//         marginTop: 10,
//         marginBottom: 5,
//     },
//     itemContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         padding: 10,
//         borderBottomWidth: 1,
//         borderBottomColor: '#eee',
//     },
//     quantityControls: {
//         flexDirection: 'row',
//         alignItems: 'center',
//     },
//     quantityText: {
//         marginHorizontal: 10,
//     },
//     input: {
//         borderWidth: 1,
//         borderColor: '#ccc',
//         padding: 8,
//         marginVertical: 5,
//         borderRadius: 4,
//     },
//     multilineInput: {
//         height: 100,
//         textAlignVertical: 'top',
//     },
//     desechablesContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         marginVertical: 10,
//     },
//     domicilioContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginVertical: 10,
//     },
//     totalText: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         marginTop: 15,
//         textAlign: 'right',
//     },
//     buttonsContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         marginTop: 20,
//         marginBottom: 30,
//     },
//     modalContainer: {
//         flex: 1,
//         padding: 20,
//     },
//     modalTitle: {
//         fontSize: 20,
//         fontWeight: 'bold',
//         marginBottom: 15,
//         textAlign: 'center',
//     },
//     searchInput: {
//         borderWidth: 1,
//         borderColor: '#ccc',
//         padding: 10,
//         marginBottom: 15,
//         borderRadius: 4,
//     },
//     modalItem: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         padding: 15,
//         borderBottomWidth: 1,
//         borderBottomColor: '#eee',
//     },
// });

// export default PedidoForm;