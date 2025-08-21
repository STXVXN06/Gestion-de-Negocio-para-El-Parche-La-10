import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Drawer, Button, ConfigProvider, Dropdown, Avatar } from 'antd';
import {
  HomeOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  DollarOutlined,
  InboxOutlined,
  LineChartOutlined,
  MenuOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import './Navegacion.css';

export default function Navegacion({ setIsAuthenticated }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const username = localStorage.getItem('username') || 'Usuario';
  const roles = JSON.parse(localStorage.getItem('roles') || '[]');
  const isEmpleado = roles.includes('ROLE_EMPLEADO');

  // Definir items basados en el rol del usuario
  const getMenuItems = () => {
    if (isEmpleado) {
      return [
        { key: '/pedidos-mobile', label: 'Pedidos', icon: <ShoppingCartOutlined /> }
      ];
    }

    return [
      { key: '/reportes', label: 'Reportes', icon: <HomeOutlined /> },
      { key: '/pedidos', label: 'Pedidos', icon: <ShoppingCartOutlined /> },
      { key: '/ingredientes', label: 'Ingredientes', icon: <AppstoreOutlined /> },
      { key: '/productos', label: 'Productos', icon: <InboxOutlined /> },
      { key: '/combos', label: 'Combos', icon: <AppstoreOutlined /> },
      { key: '/compras', label: 'Compras', icon: <DollarOutlined /> },
      { key: '/registroDesperdicios', label: 'Desperdicios', icon: <LineChartOutlined /> },
      { key: '/movimientosCaja', label: 'Caja', icon: <DollarOutlined /> }
    ];
  };

  const items = getMenuItems();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('roles');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        {username}
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="logout"
        icon={<LogoutOutlined />}
        onClick={handleLogout}
        danger
      >
        Cerrar Sesión
      </Menu.Item>
    </Menu>
  );

  const menu = (
    <ConfigProvider
      theme={{
        components: {
          Menu: {
            itemHoverBg: 'rgba(255, 255, 255, 0.1)',
            itemSelectedBg: 'rgba(255, 255, 255, 0.2)',
            itemSelectedColor: '#fff',
            itemColor: 'rgba(255, 255, 255, 0.8)',
            itemHoverColor: '#fff',
          }
        }
      }}
    >
      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={items.map(item => ({
          key: item.key,
          icon: React.cloneElement(item.icon, { style: { fontSize: '18px' } }),
          label: <Link to={item.key}>{item.label}</Link>
        }))}
        className="desktop-menu"
      />
    </ConfigProvider>
  );

  return (
    <div className="nav-container">
      <div className="nav-bar">
        {/* Redirigir a la página principal según el rol */}
        <Link
          to={isEmpleado ? "/pedidos-mobile" : "/reportes"}
          className="nav-brand"
        >
          <span className="gradient-text">ParcheLa10</span>
        </Link>

        <div className="desktop-menu-container">{menu}</div>

        <div className="user-controls">
          <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
            <div className="user-info">
              <Avatar
                size="default"
                icon={<UserOutlined />}
                className="user-avatar"
              />
              <span className="username">{username}</span>
            </div>
          </Dropdown>

          <Button
            className="mobile-menu-button"
            icon={<MenuOutlined style={{ fontSize: '24px', color: '#fff' }} />}
            onClick={() => setVisible(true)}
            type="text"
          />
        </div>
      </div>

      <Drawer
        title={
          <div className="drawer-header">
            <Avatar
              size="large"
              icon={<UserOutlined />}
              className="drawer-avatar"
            />
            <span className="gradient-text">{username}</span>
          </div>
        }
        placement="right"
        onClose={() => setVisible(false)}
        open={visible}
        headerStyle={{
          background: 'linear-gradient(135deg, #2c3e50, #3498db)',
          padding: '16px 24px'
        }}
        bodyStyle={{ padding: 0, background: '#f8f9fa' }}
        footer={
          <Button
            block
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            danger
          >
            Cerrar Sesión
          </Button>
        }
      >
        <ConfigProvider
          theme={{
            components: {
              Menu: {
                itemHoverBg: 'rgba(52, 152, 219, 0.1)',
                itemSelectedBg: 'rgba(52, 152, 219, 0.2)',
                itemSelectedColor: '#2c3e50',
              }
            }
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={items.map(item => ({
              key: item.key,
              icon: React.cloneElement(item.icon, { style: { fontSize: '18px' } }),
              label: <Link to={item.key} onClick={() => setVisible(false)}>{item.label}</Link>
            }))}
          />
        </ConfigProvider>
      </Drawer>
    </div>
  );
}