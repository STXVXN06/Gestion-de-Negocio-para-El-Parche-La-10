import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "antd";
import ListadoIngredientes from "./Ingredientes/ListadoIngredientes";
import Navegacion from "./plantilla/Navegacion";
import ListadoProductos from "./Productos/ListadoProductos";
import AgregarIngrediente from "./Ingredientes/AgregarIngrediente";
import EditarIngrediente from "./Ingredientes/EditarIngrediente";
import AgregarProducto from "./Productos/AgregarProducto";
import EditarProducto from "./Productos/EditarProducto";
import ListadoPedidos from "./Pedidos/ListadoPedidos";
import AgregarPedido from "./Pedidos/AgregarPedido";
import EditarPedido from "./Pedidos/EditarPedido";
import ListadoCompras from "./Compras/ListadoCompras";
import RegistroDesperdicios from "./Desperdicios/RegistroDesperdicios";
import HistorialDesperdicios from "./Desperdicios/HistorialDesperdicios";
import ListadoMovimientosCaja from "./Movimientos/ListadoMovimientosCaja";
import './app.css'
import ListadoCombos from "./Combos/ListadoCombos";
import AgregarCombo from "./Combos/AgregarCombo";
import EditarCombo from "./Combos/EditarCombo";
import Reporte from "./Estadisticas/Reporte";

import Login from "./Login/Login";
import Unauthorized from "./Security/Unauthorized";
import PrivateRoute from "./Security/PrivateRoute";

import { useEffect, useState } from 'react';
import PedidosList from "./Pedidos/PedidoMobile/PedidosList";
import PedidoForm from "./Pedidos/PedidoMobile/PedidoForm";
import PedidoEdit from "./Pedidos/PedidoMobile/PedidoEdit";
import StockView from "./Pedidos/PedidoMobile/StockView";
import ListadoUsuarios from "./Usuarios/ListadoUsuarios";
import AgregarUsuario from "./Usuarios/AgregarUsuario";

const { Header, Content } = Layout;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // if (!isAuthenticated) { 
  //   return (
  //     <BrowserRouter>
  //       <Routes>
  //         <Route path="/login" element={<Login />} />
  //         <Route path="*" element={<Login />} />
  //       </Routes>
  //     </BrowserRouter>
  //   );
  // }
  return (
    <BrowserRouter>
      <Layout className="main-layout">
        {isAuthenticated && (
          <Header className="app-header">
            <Navegacion setIsAuthenticated={setIsAuthenticated} />
          </Header>
        )}


        <Content className={isAuthenticated ? "app-content" : ""}>
          <Routes>
            {/* Rutas públicas */}
            <Route
              path="/login"
              element={<Login setIsAuthenticated={setIsAuthenticated} />}
            />
            <Route
              path="/unauthorized"
              element={<Unauthorized />}
            />

            <Route
              path="/pedidos-mobile"
              element={
                <PrivateRoute requiredRoles={['ROLE_EMPLEADO']}>
                  <PedidosList />
                </PrivateRoute>
              }
            />
            <Route
              path="/pedidos-mobile/agregarPedido"
              element={
                <PrivateRoute requiredRoles={['ROLE_EMPLEADO', 'ROLE_ADMIN']}>
                  <PedidoForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/pedidos-mobile/editarPedido/:id"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN','ROLE_EMPLEADO']}>
                  <PedidoEdit />
                </PrivateRoute>
              }
            />
            <Route
              path="/mobile/inventario"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN','ROLE_EMPLEADO']}>
                  <StockView />
                </PrivateRoute>
              }
            />

            <Route
              path="/"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN']}>
                  <ListadoIngredientes />
                </PrivateRoute>
              }
            />
            <Route
              path="/ingredientes"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN','ROLE_EMPLEADO']}>
                  <ListadoIngredientes />
                </PrivateRoute>
              }
            />
            <Route
              path="/agregarIngrediente"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN']}>
                  <AgregarIngrediente />
                </PrivateRoute>
              }
            />
            <Route
              path="/editarIngrediente/:id"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN']}>
                  <EditarIngrediente />
                </PrivateRoute>
              }
            />
            <Route
              path="/productos"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN','ROLE_EMPLEADO']}>
                  <ListadoProductos />
                </PrivateRoute>
              }
            />
            <Route
              path="/agregarProducto"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN']}>
                  <AgregarProducto />
                </PrivateRoute>
              }
            />
            <Route
              path="/editarProducto/:id"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN']}>
                  <EditarProducto />
                </PrivateRoute>
              }
            />
            <Route
              path="/pedidos"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN', 'ROLE_EMPLEADO']}>
                  <ListadoPedidos />
                </PrivateRoute>
              }
            />
            <Route
              path="/agregarPedido"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN']}>
                  <AgregarPedido />
                </PrivateRoute>
              }
            />
            <Route
              path="/editarPedido/:id"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN']}>
                  <EditarPedido />
                </PrivateRoute>
              }
            />
            <Route
              path="/compras"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN']}>
                  <ListadoCompras />
                </PrivateRoute>
              }
            />
            <Route
              path="/registroDesperdicios"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN']}>
                  <RegistroDesperdicios />
                </PrivateRoute>
              }
            />
            <Route
              path="/historialDesperdicios"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN']}>
                  <HistorialDesperdicios />
                </PrivateRoute>
              }
            />
            <Route
              path="/movimientosCaja"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN']}>
                  <ListadoMovimientosCaja />
                </PrivateRoute>
              }
            />
            <Route
              path="/combos"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN']}>
                  <ListadoCombos />
                </PrivateRoute>
              }
            />
            <Route
              path="/agregarCombo"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN']}>
                  <AgregarCombo />
                </PrivateRoute>
              }
            />
            <Route
              path="/editarCombo/:id"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN']}>
                  <EditarCombo />
                </PrivateRoute>
              }
            />
            <Route
              path="/reportes"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN']}>
                  <Reporte />
                </PrivateRoute>
              }
            />
            <Route
              path="/usuarios"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN']}>
                  <ListadoUsuarios/>
                </PrivateRoute>
              }
            />
             <Route
              path="/agregarUsuario"
              element={
                <PrivateRoute requiredRoles={['ROLE_ADMIN']}>
                  <AgregarUsuario/>
                </PrivateRoute>
              }
            />


          </Routes>
        </Content>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
