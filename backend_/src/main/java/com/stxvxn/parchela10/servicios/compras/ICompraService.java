package com.stxvxn.parchela10.servicios.compras;

import java.util.List;

import com.stxvxn.parchela10.entidades.Compra;

/**
 * Interfaz del servicio de compras
 * Aplica ISP: Interfaz cohesiva con métodos específicos de compras
 */
public interface ICompraService {

    /**
     * Registra una nueva compra en el sistema
     * - Procesa según el tipo de compra
     * - Actualiza inventario si aplica
     * - Registra movimiento de caja
     * 
     * @param compra Datos de la compra a registrar
     * @return La compra registrada
     * @throws IllegalArgumentException si los datos son inválidos
     * @throws IllegalStateException si no hay caja activa
     */
    Compra registrarCompra(Compra compra);
    
    /**
     * Obtiene todas las compras registradas
     * @return Lista de todas las compras
     */
    List<Compra> obtenerTodasLasCompras();
    
    /**
     * Anula una compra existente
     * - Marca la compra como anulada
     * - Revierte el inventario si aplica
     * - Ajusta la caja
     * 
     * @param compraId ID de la compra a anular
     * @throws IllegalArgumentException si la compra no existe
     * @throws IllegalStateException si la compra ya está anulada
     */
    void anularCompra(Long compraId);
}