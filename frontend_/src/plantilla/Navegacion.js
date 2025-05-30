import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Drawer, Button, ConfigProvider } from 'antd';
import {
  HomeOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  DollarOutlined,
  InboxOutlined,
  LineChartOutlined,
  MenuOutlined
} from '@ant-design/icons';
import './Navegacion.css';

export default function Navegacion() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  const items = [
    { key: '/', label: 'Inicio', icon: <HomeOutlined /> },
    { key: '/ingredientes', label: 'Ingredientes', icon: <AppstoreOutlined /> },
    { key: '/productos', label: 'Productos', icon: <InboxOutlined /> },
    { key: '/pedidos', label: 'Pedidos', icon: <ShoppingCartOutlined /> },
    { key: '/compras', label: 'Compras', icon: <DollarOutlined /> },
    { key: '/registroDesperdicios', label: 'Desperdicios', icon: <LineChartOutlined /> },
    { key: '/movimientosCaja', label: 'Caja', icon: <DollarOutlined /> }
  ];

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
        <Link to="/" className="nav-brand">
          <span className="gradient-text">ParcheLa10</span>
        </Link>
        
        <div className="desktop-menu-container">{menu}</div>

        <Button
          className="mobile-menu-button"
          icon={<MenuOutlined style={{ fontSize: '24px', color: '#fff' }} />}
          onClick={() => setVisible(true)}
          type="text"
        />
      </div>

      <Drawer
        title={
          <span className="gradient-text">Menú</span>
        }
        placement="right"
        onClose={() => setVisible(false)}
        open={visible}
        headerStyle={{ background: 'linear-gradient(135deg, #2c3e50, #3498db)' }}
        bodyStyle={{ padding: 0, background: '#f8f9fa' }}
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
              label: <Link to={item.key}>{item.label}</Link>
            }))}
          />
        </ConfigProvider>
      </Drawer>
    </div>
  );
}