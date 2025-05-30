package com.stxvxn.parchela10.DTO;

import java.util.List;

import lombok.Data;


@Data
public class ProductoConIngredientesResponse {
    private Long id;
    private String nombre;
    private String tipo;
    private Long precio;
    private Boolean activo;
    private List<IngredienteDetalle> ingredientes;

    @Data
    public static class IngredienteDetalle {
        private Long id;
        private String nombre;
        private String unidadMedida;
        private String simbolo;
        private Double cantidadNecesaria;
    }
}
