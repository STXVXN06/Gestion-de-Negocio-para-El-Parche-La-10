package com.stxvxn.parchela10.DTO;

import java.util.List;

import lombok.Data;

@Data
public class ProductoConIngredienteDTO {
    
    private String nombre;
    private String tipo;
    private Long precio;
    private Boolean activo = true;
    private List<IngredienteCantidad> ingredientes;


    @Data
    public static class IngredienteCantidad{
        private Long ingredienteId;
        private Double cantidad;
    }


}
