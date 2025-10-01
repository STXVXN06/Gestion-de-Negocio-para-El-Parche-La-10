package com.stxvxn.parchela10.servicios.inventario;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stxvxn.parchela10.entidades.Ingrediente;
import com.stxvxn.parchela10.repositorios.IngredienteRepository;

import lombok.RequiredArgsConstructor;

/**
 * Implementación del servicio de inventario
 * Cumple SRP: Solo se encarga del manejo de stock de ingredientes
 */
@Service
@RequiredArgsConstructor
public class InventarioServiceImpl implements IInventarioService {

    private final IngredienteRepository ingredienteRepository;

    @Override
    @Transactional
    public void incrementarStock(Long ingredienteId, Double cantidad) {
        if (cantidad <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser positiva");
        }
        
        Ingrediente ingrediente = obtenerIngrediente(ingredienteId);
        ingrediente.setCantidadActual(ingrediente.getCantidadActual() + cantidad);
        ingredienteRepository.save(ingrediente);
    }

    @Override
    @Transactional
    public void decrementarStock(Long ingredienteId, Double cantidad) {
        if (cantidad <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser positiva");
        }
        
        Ingrediente ingrediente = obtenerIngrediente(ingredienteId);
        
        double nuevaCantidad = ingrediente.getCantidadActual() - cantidad;
        if (nuevaCantidad < 0) {
            throw new IllegalStateException(
                String.format("Stock insuficiente. Disponible: %.2f, Solicitado: %.2f", 
                    ingrediente.getCantidadActual(), cantidad)
            );
        }
        
        ingrediente.setCantidadActual(nuevaCantidad);
        ingredienteRepository.save(ingrediente);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean tieneStockSuficiente(Long ingredienteId, Double cantidadRequerida) {
        Ingrediente ingrediente = obtenerIngrediente(ingredienteId);
        return ingrediente.getCantidadActual() >= cantidadRequerida;
    }

    private Ingrediente obtenerIngrediente(Long ingredienteId) {
        return ingredienteRepository.findById(ingredienteId)
                .orElseThrow(() -> new IllegalArgumentException(
                    "Ingrediente no encontrado con ID: " + ingredienteId));
    }
}