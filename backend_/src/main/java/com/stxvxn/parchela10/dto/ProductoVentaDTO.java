package com.stxvxn.parchela10.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductoVentaDTO {
    private Long productoId;
    private String nombreProducto;
    private Long cantidadVendida;
    // getters y setters
}