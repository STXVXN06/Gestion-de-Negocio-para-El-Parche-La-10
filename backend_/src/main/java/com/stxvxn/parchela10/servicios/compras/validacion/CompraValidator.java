package com.stxvxn.parchela10.servicios.compras.validacion;

import org.springframework.stereotype.Component;

import com.stxvxn.parchela10.entidades.Compra;

/**
 * Validador específico para compras
 * Cumple SRP: Solo se encarga de validaciones de negocio
 */
@Component
public class CompraValidator {

    /**
     * Valida que una compra cumpla con todas las reglas de negocio
     * @param compra La compra a validar
     * @throws IllegalArgumentException si la validación falla
     */
    public void validar(Compra compra) {
        validarNoNulo(compra);
        validarTipo(compra);
        validarCostoTotal(compra);
        validarCamposSegunTipo(compra);
    }

    private void validarNoNulo(Compra compra) {
        if (compra == null) {
            throw new IllegalArgumentException("La compra no puede ser nula");
        }
    }

    private void validarTipo(Compra compra) {
        if (compra.getTipo() == null) {
            throw new IllegalArgumentException("El tipo de compra es obligatorio");
        }
    }

    private void validarCostoTotal(Compra compra) {
        if (compra.getCostoTotal() == null) {
            throw new IllegalArgumentException("El costo total es obligatorio");
        }
        if (compra.getCostoTotal() <= 0) {
            throw new IllegalArgumentException("El costo total debe ser mayor a cero");
        }
    }

    private void validarCamposSegunTipo(Compra compra) {
        if (compra.esDeIngrediente()) {
            validarCompraIngrediente(compra);
        } else {
            validarCompraOtros(compra);
        }
    }

    private void validarCompraIngrediente(Compra compra) {
        if (compra.getIngrediente() == null) {
            throw new IllegalArgumentException(
                "El ingrediente es obligatorio para compras de tipo INGREDIENTE");
        }
        if (compra.getCantidad() == null || compra.getCantidad() <= 0) {
            throw new IllegalArgumentException(
                "La cantidad debe ser mayor a cero para compras de ingredientes");
        }
    }

    private void validarCompraOtros(Compra compra) {
        if (compra.getDescripcion() == null || compra.getDescripcion().trim().isEmpty()) {
            throw new IllegalArgumentException(
                "La descripción es obligatoria para compras que no son de ingredientes");
        }
    }
}