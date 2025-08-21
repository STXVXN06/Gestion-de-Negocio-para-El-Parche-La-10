// import React from 'react';
// import { View, Text, FlatList, Button, StyleSheet, ActivityIndicator } from 'react-native';

// const PedidosList = ({ pedidos, onCreate, onEdit, loading }) => {
//     if (loading) {
//         return (
//             <View style={styles.loadingContainer}>
//                 <ActivityIndicator size="large" color="#0000ff" />
//                 <Text>Cargando pedidos...</Text>
//             </View>
//         );
//     }

//     return (
//         <View>
//             <Text style={styles.header}>Pedidos Existentes</Text>

//             <Button
//                 title="Nuevo Pedido"
//                 onPress={onCreate}
//                 color="green"
//             />

//             <FlatList
//                 data={pedidos}
//                 keyExtractor={item => item.id.toString()}
//                 renderItem={({ item }) => (
//                     <View style={styles.item}>
//                         <Text>Pedido #{item.id}</Text>
//                         <Text>Estado: {item.estado}</Text>
//                         <Text>Total: ${item.total.toLocaleString()}</Text>
//                         <Button
//                             title="Editar"
//                             onPress={() => onEdit(item)}
//                         />
//                     </View>
//                 )}
//                 ListEmptyComponent={
//                     <Text style={styles.emptyText}>No hay pedidos registrados</Text>
//                 }
//             />
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     header: {
//         fontSize: 20,
//         fontWeight: 'bold',
//         marginBottom: 15,
//         textAlign: 'center',
//     },
//     item: {
//         padding: 15,
//         borderBottomWidth: 1,
//         borderBottomColor: '#eee',
//     },
//     emptyText: {
//         textAlign: 'center',
//         marginTop: 20,
//         fontStyle: 'italic',
//     },
//     loadingContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
// });

// export default PedidosList;