package com.stxvxn.parchela10.servicios.inventario;

/**
 * Abstracción para el manejo de inventario
 * Aplica DIP: Las clases de alto nivel dependen de esta abstracción
 * Aplica ISP: Interfaz específica y cohesiva
 */
public interface IInventarioService {
    
    /**
     * Incrementa el stock de un ingrediente
     * @param ingredienteId ID del ingrediente
     * @param cantidad Cantidad a incrementar
     */
    void incrementarStock(Long ingredienteId, Double cantidad);
    
    /**
     * Decrementa el stock de un ingrediente
     * @param ingredienteId ID del ingrediente
     * @param cantidad Cantidad a decrementar
     */
    void decrementarStock(Long ingredienteId, Double cantidad);
    
    /**
     * Verifica si un ingrediente tiene stock suficiente
     * @param ingredienteId ID del ingrediente
     * @param cantidadRequerida Cantidad requerida
     * @return true si hay stock suficiente
     */
    boolean tieneStockSuficiente(Long ingredienteId, Double cantidadRequerida);
}