package com.stxvxn.parchela10.entidades;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Table(name = "adiciones_pedido")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class AdicionPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "pedido_id", nullable = false) // Asegúrate que sea nullable=false
    private Pedido pedido;

    @ManyToOne
    private Ingrediente ingrediente;

    private Integer cantidad;

    // Campo para notas sobre a qué producto se aplica
    private String aplicadoA;
}
