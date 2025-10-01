package com.stxvxn.parchela10.servicios.compras.estrategias;

import org.springframework.stereotype.Component;

import com.stxvxn.parchela10.entidades.Compra;

/**
 * Procesador para compras que no son de ingredientes
 * (servicios, equipos, otros gastos)
 */
@Component
public class OtrosCompraProcessor implements CompraProcessor {

    @Override
    public String procesarCompra(Compra compra) {
        validarCompraOtros(compra);
        
        // Para otros tipos, solo usar la descripción proporcionada
        compra.setCantidad(null); // No aplica cantidad para estos tipos
        
        return compra.getDescripcion() != null 
                ? compra.getDescripcion() 
                : "Compra de " + compra.getTipo().name().toLowerCase();
    }

    @Override
    public void revertirCompra(Compra compra) {
        // No hay acciones adicionales para otros tipos de compra
        // El movimiento de caja ya se revierte en otro lugar
    }

    @Override
    public boolean puedesProcesar(Compra.TipoCompra tipo) {
        return tipo != Compra.TipoCompra.INGREDIENTE;
    }

    private void validarCompraOtros(Compra compra) {
        if (compra.getDescripcion() == null || compra.getDescripcion().trim().isEmpty()) {
            throw new IllegalArgumentException("La descripción es obligatoria para este tipo de compra");
        }
    }
}