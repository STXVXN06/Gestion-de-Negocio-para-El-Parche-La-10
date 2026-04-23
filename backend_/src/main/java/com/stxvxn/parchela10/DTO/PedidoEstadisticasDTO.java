package com.stxvxn.parchela10.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Conteos globales por estado (misma lógica que la UI con filtro de fechas opcional). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PedidoEstadisticasDTO {

    private long entregados;
    private long pendientes;
    private long cancelados;
}
