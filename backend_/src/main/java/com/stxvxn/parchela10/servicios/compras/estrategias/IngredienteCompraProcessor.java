package com.stxvxn.parchela10.servicios.compras.estrategias;

import org.springframework.stereotype.Component;

import com.stxvxn.parchela10.entidades.Compra;
import com.stxvxn.parchela10.entidades.Ingrediente;
import com.stxvxn.parchela10.repositorios.IngredienteRepository;
import com.stxvxn.parchela10.servicios.inventario.IInventarioService;

import lombok.RequiredArgsConstructor;

/**
 * Procesador específico para compras de ingredientes
 * Cumple SRP: solo maneja la lógica de compras de ingredientes
 */
@Component
@RequiredArgsConstructor
public class IngredienteCompraProcessor implements CompraProcessor {

    private final IInventarioService inventarioService;
    private final IngredienteRepository ingredienteRepository;

    @Override
    public String procesarCompra(Compra compra) {
        validarCompraIngrediente(compra);
        
        Ingrediente ingrediente = ingredienteRepository.findById(compra.getIngrediente().getId())
                .orElseThrow(() -> new IllegalArgumentException("Ingrediente no encontrado"));

        // Delegar la actualización de inventario al servicio especializado
        inventarioService.incrementarStock(ingrediente.getId(), compra.getCantidad());

        // Actualizar descripción de la compra
        String descripcionGenerada = generarDescripcion(ingrediente, compra.getCantidad());
        compra.setDescripcion(descripcionGenerada);

        return descripcionGenerada;
    }

    @Override
    public void revertirCompra(Compra compra) {
        validarCompraIngrediente(compra);
        
        Ingrediente ingrediente = ingredienteRepository.findById(compra.getIngrediente().getId())
                .orElseThrow(() -> new IllegalArgumentException("Ingrediente no encontrado"));

        // Delegar la reversión al servicio de inventario
        inventarioService.decrementarStock(ingrediente.getId(), compra.getCantidad());
    }

    @Override
    public boolean puedesProcesar(Compra.TipoCompra tipo) {
        return tipo == Compra.TipoCompra.INGREDIENTE;
    }

    private void validarCompraIngrediente(Compra compra) {
        if (compra.getIngrediente() == null) {
            throw new IllegalArgumentException("El ingrediente no puede ser nulo");
        }
        if (compra.getCantidad() == null || compra.getCantidad() <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a cero");
        }
    }

    private String generarDescripcion(Ingrediente ingrediente, Double cantidad) {
        if (ingrediente.getUnidadMedida() == null) {
            throw new IllegalStateException("El ingrediente no tiene unidad de medida asignada");
        }
        
        return String.format("Compra de %s (%.2f %s)", 
                ingrediente.getNombre(), 
                cantidad, 
                ingrediente.getUnidadMedida().getSimbolo());
    }
}