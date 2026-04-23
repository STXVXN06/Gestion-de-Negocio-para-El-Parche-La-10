package com.stxvxn.parchela10.DTO;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Cabecera de pedido para listados paginados (sin líneas de detalle).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PedidoResumenDTO {

    private Long id;
    private LocalDateTime fecha;
    private String estado;
    private Long total;
    private String detalles;
    private Integer cantidadP1;
    private Integer cantidadC1;
    private boolean domicilio;
    private Long costoDomicilio;
    private String metodoPago;
}
