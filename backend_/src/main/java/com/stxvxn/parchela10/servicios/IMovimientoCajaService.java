package com.stxvxn.parchela10.servicios;

import java.util.List;
import java.util.Optional;

import com.stxvxn.parchela10.entidades.Compra;
import com.stxvxn.parchela10.entidades.MovimientoCaja;
import com.stxvxn.parchela10.entidades.Pedido;

/**
 * Interfaz del servicio para la entidad MovimientoCaja.
 * Proporciona métodos para realizar operaciones CRUD sobre movimientos de caja.
 */
public interface IMovimientoCajaService {

    MovimientoCaja registrarMovimiento(MovimientoCaja movimiento);

    List<MovimientoCaja> obtenerPorCaja(Long cajaId);

    MovimientoCaja registrarIngreso(String descripcion, Long monto, Long cajaId, Compra compra, Pedido pedido);

    MovimientoCaja registrarEgreso(String descripcion, Long monto, Long cajaId, Compra compra, Pedido pedido);

    List<MovimientoCaja> obtenerPorTipo(String tipoMovimiento);

    List<MovimientoCaja> findAll();

    Optional<MovimientoCaja> findById(Long id);

    MovimientoCaja save(MovimientoCaja movimientoCaja);

    Optional<MovimientoCaja> update(Long id, MovimientoCaja movimientoCaja);

    Optional<MovimientoCaja> eliminarPorCompra(Long id);
}
