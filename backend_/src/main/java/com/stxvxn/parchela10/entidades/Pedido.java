package com.stxvxn.parchela10.entidades;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pedidos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private LocalDateTime fecha = LocalDateTime.now(ZoneId.of("America/Bogota"));

    @NotBlank
    private String estado; // PENDIENTE, ENVIADO, ENTREGADO

    @NotNull
    private Long total;

    private String detalles;

    @NotNull
    private Integer cantidadP1 = 0;

    @NotNull
    private Integer cantidadC1 = 0;

    @NotNull
    @PositiveOrZero(message = "El costo de domicilio debe ser positivo")
    private Long costoDomicilio = 2000L; // Valor por defecto

    @NotNull
    private boolean domicilio = false;

    @Column(name = "metodo_pago")
    private String metodoPago;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL)
    private List<AdicionPedido> adiciones = new ArrayList<>();

}
