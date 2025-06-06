import { BrowserRouter, Route, Routes } from "react-router-dom";
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

const { Header, Content } = Layout;

function App() {
  return (
    <BrowserRouter>
      <Layout className="main-layout">
        <Header className="app-header">
          <Navegacion />
        </Header>

        <Content className="app-content">
          <Routes>
            <Route path="/ingredientes" element={<ListadoIngredientes />} />
            <Route path="/productos" element={<ListadoProductos />} />
            <Route path="/agregarIngrediente" element={<AgregarIngrediente />} />
            <Route path="/editarIngrediente/:id" element={<EditarIngrediente />} />
            <Route path="/agregarProducto" element={<AgregarProducto />} />
            <Route path="/editarProducto/:id" element={<EditarProducto />} />
            <Route path="/pedidos" element={<ListadoPedidos />} />
            <Route path="/agregarPedido" element={<AgregarPedido />} />
            <Route path="/editarPedido/:id" element={<EditarPedido />} />
            <Route path="/compras" element={<ListadoCompras />} />
            <Route path="/registroDesperdicios" element={<RegistroDesperdicios />} />
            <Route path="/historialDesperdicios" element={<HistorialDesperdicios />} />
            <Route path="/movimientosCaja" element={<ListadoMovimientosCaja />} />
            <Route path="/combos" element={<ListadoCombos />} />
          </Routes>
        </Content>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
