// import React from 'react';
// import { View, Text, FlatList, Modal, Button, StyleSheet } from 'react-native';

// const StockView = ({ ingredientes, onClose }) => {
//     return (
//         <Modal
//             animationType="slide"
//             transparent={false}
//             visible={true}
//             onRequestClose={onClose}
//         >
//             <View style={styles.container}>
//                 <Text style={styles.header}>Stock de Ingredientes</Text>

//                 <FlatList
//                     data={ingredientes}
//                     keyExtractor={item => item.id.toString()}
//                     renderItem={({ item }) => (
//                         <View style={styles.item}>
//                             <Text style={styles.name}>{item.nombre}</Text>
//                             <Text>
//                                 {item.cantidadActual} {item.unidadMedida?.simbolo || ''}
//                                 {item.cantidadMinima && (
//                                     <Text style={styles.minStock}>
//                                         {' '}(Mín: {item.cantidadMinima})
//                                     </Text>
//                                 )}
//                             </Text>
//                         </View>
//                     )}
//                 />

//                 <Button
//                     title="Cerrar"
//                     onPress={onClose}
//                     color="gray"
//                 />
//             </View>
//         </Modal>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         padding: 20,
//         backgroundColor: '#fff',
//     },
//     header: {
//         fontSize: 24,
//         fontWeight: 'bold',
//         marginBottom: 20,
//         textAlign: 'center',
//     },
//     item: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         padding: 15,
//         borderBottomWidth: 1,
//         borderBottomColor: '#eee',
//     },
//     name: {
//         fontWeight: 'bold',
//         flex: 2,
//     },
//     minStock: {
//         color: '#888',
//         fontSize: 12,
//     },
// });

// export default StockView;