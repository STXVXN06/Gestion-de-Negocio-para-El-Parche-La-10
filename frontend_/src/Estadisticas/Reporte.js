import React, { useState } from 'react';
import { Tabs } from 'antd';
import { BarChartOutlined, DollarOutlined, ShoppingOutlined } from '@ant-design/icons';
import ReporteGanancias from './ReporteGanancias';
import ListaCompras from './ListaCompras';
import './Reporte.css';
import Estadisticas from './Estadisticas';

const { TabPane } = Tabs;

const Reporte = () => {
  const [activeTab, setActiveTab] = useState('ganancias');
  return (
    <div className="reporte-container">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="custom-tabs"
      >
        <TabPane
          tab={
            <span className="tab-title">
              <DollarOutlined />
              Reporte de Ganancias
            </span>
          }
          key="ganancias"
        >
          <ReporteGanancias />
        </TabPane>

        <TabPane
          tab={
            <span className="tab-title">
              <BarChartOutlined />
              Estadisticas de Ventas
            </span>
          }
          key="estadisticas"
        >
          <Estadisticas />
        </TabPane>


        <TabPane
          tab={
            <span className="tab-title">
              <ShoppingOutlined />
              Lista de Compras
            </span>
          }
          key="compras"
        >
          <ListaCompras />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Reporte;