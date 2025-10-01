package com.stxvxn.parchela10.servicios.compras.estrategias;

import com.stxvxn.parchela10.entidades.Compra;

/**
 * Patrón Strategy para aplicar OCP (Open/Closed Principle)
 * Permite agregar nuevos tipos de compra sin modificar código existente
 */
public interface CompraProcessor {
    
    /**
     * Procesa una compra según su tipo específico
     * @param compra La compra a procesar
     * @return La descripción generada para el movimiento de caja
     */
    String procesarCompra(Compra compra);
    
    /**
     * Revierte el procesamiento de una compra anulada
     * @param compra La compra a revertir
     */
    void revertirCompra(Compra compra);
    
    /**
     * Indica si este procesador puede manejar el tipo de compra dado
     * @param tipo El tipo de compra
     * @return true si puede procesar, false en caso contrario
     */
    boolean puedesProcesar(Compra.TipoCompra tipo);
}