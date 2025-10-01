package com.stxvxn.parchela10.servicios.productos;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.stxvxn.parchela10.dto.ProductoConIngredientesResponse;
import com.stxvxn.parchela10.entidades.Producto;
import com.stxvxn.parchela10.entidades.ProductoIngrediente;

/**
 * Constructor de respuestas DTO para productos con ingredientes.
 * 
 * SOLID:
 * - SRP: Solo construye DTOs, no tiene lógica de negocio
 * - OCP: Puede extenderse para crear otros tipos de respuesta
 */
@Component
public class ProductoResponseBuilderImpl implements IProductoResponseBuilder {

    @Override
    public ProductoConIngredientesResponse buildResponse(List<ProductoIngrediente> ingredientes) {
        if (ingredientes == null || ingredientes.isEmpty()) {
            throw new IllegalArgumentException("La lista de ingredientes no puede estar vacía");
        }

        Producto producto = ingredientes.get(0).getProducto();

        ProductoConIngredientesResponse response = new ProductoConIngredientesResponse();
        response.setId(producto.getId());
        response.setNombre(producto.getNombre());
        response.setTipo(producto.getTipo());
        response.setPrecio(producto.getPrecio());
        response.setActivo(producto.getActivo());

        List<ProductoConIngredientesResponse.IngredienteDetalle> ingredientesDetalles = 
                ingredientes.stream()
                        .map(this::buildIngredienteDetalle)
                        .collect(Collectors.toList());

        response.setIngredientes(ingredientesDetalles);

        return response;
    }

    private ProductoConIngredientesResponse.IngredienteDetalle buildIngredienteDetalle(ProductoIngrediente pi) {
        ProductoConIngredientesResponse.IngredienteDetalle detalle = 
                new ProductoConIngredientesResponse.IngredienteDetalle();
        
        detalle.setId(pi.getIngrediente().getId());
        detalle.setNombre(pi.getIngrediente().getNombre());
        detalle.setUnidadMedida(pi.getIngrediente().getUnidadMedida().getNombre());
        detalle.setSimbolo(pi.getIngrediente().getUnidadMedida().getSimbolo());
        detalle.setCantidadNecesaria(pi.getCantidadNecesaria());

        return detalle;
    }
}