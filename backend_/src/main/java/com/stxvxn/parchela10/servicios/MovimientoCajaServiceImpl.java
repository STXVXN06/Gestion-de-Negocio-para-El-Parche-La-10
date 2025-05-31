package com.stxvxn.parchela10.servicios;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stxvxn.parchela10.entidades.Caja;
import com.stxvxn.parchela10.entidades.Compra;
import com.stxvxn.parchela10.entidades.MovimientoCaja;
import com.stxvxn.parchela10.entidades.Pedido;
import com.stxvxn.parchela10.repositorios.MovimientoCajaRepository;

@Service
public class MovimientoCajaServiceImpl implements IMovimientoCajaService {

    @Autowired
    private MovimientoCajaRepository movimientoCajaRepository;

    @Autowired
    private CajaServiceImpl cajaService;

    @Autowired
    @Lazy
    private CompraServiceImpl compraService;

    // Método nuevo para movimientos manuales
    @Transactional
    public MovimientoCaja registrarMovimientoManual(String tipo, String descripcion, Long monto, Long cajaId) {
        if (!tipo.equalsIgnoreCase("INGRESO") && !tipo.equalsIgnoreCase("EGRESO")) {
            throw new IllegalArgumentException("Tipo de movimiento inválido");
        }
        return crearMovimiento(tipo.toUpperCase(), descripcion, monto, cajaId, null, null);
    }

    // Método modificado para incluir validación de estado
    private MovimientoCaja crearMovimiento(String tipo, String descripcion, Long monto, Long cajaId,
            Compra compra, Pedido pedido) {
        Caja caja = cajaService.obtenerCajaActual().orElseThrow(() -> new RuntimeException("Caja no encontrada"));

        MovimientoCaja movimiento = new MovimientoCaja();
        movimiento.setTipo(tipo);
        movimiento.setDescripcion(descripcion);
        movimiento.setMonto(monto);
        movimiento.setEstado("activo"); // Estado por defecto
        movimiento.setCaja(caja);
        movimiento.setCompra(compra);
        movimiento.setPedido(pedido);

        actualizarMontoCaja(caja, tipo, monto);
        return movimientoCajaRepository.save(movimiento);
    }

    // Nuevo método para anulación de movimientos
    @Transactional
    public Optional<MovimientoCaja> anularMovimiento(Long id) {
        Optional<MovimientoCaja> movimientoOpt = movimientoCajaRepository.findById(id);
        if (movimientoOpt.isPresent()) {
            MovimientoCaja movimiento = movimientoOpt.orElseThrow();
            if (!movimiento.getEstado().equals("activo")) {
                throw new IllegalStateException("Solo se pueden anular movimientos activos");
            }

            if (movimiento.getCompra() != null) {
                compraService.eliminarCompra(movimiento.getCompra().getId());
            } else {
                Caja caja = movimiento.getCaja();
                if (movimiento.getTipo().equals("INGRESO")) {
                    caja.setMontoActual(caja.getMontoActual() - movimiento.getMonto());
                } else {
                    caja.setMontoActual(caja.getMontoActual() + movimiento.getMonto());
                }
                cajaService.save(caja);
            }

            movimiento.setEstado("ANULADO");
            return Optional.of(movimientoCajaRepository.save(movimiento));
        }
        return movimientoOpt;
    }

    // Método auxiliar para actualizar montos
    private void actualizarMontoCaja(Caja caja, String tipo, Long monto) {
        if (tipo.equals("INGRESO")) {
            caja.setMontoActual(caja.getMontoActual() + monto);
        } else {
            if (caja.getMontoActual() < monto) {
                throw new RuntimeException("Fondos insuficientes en caja");
            }
            caja.setMontoActual(caja.getMontoActual() - monto);
        }
        cajaService.save(caja);
    }

    // Método modificado para obtener por tipo
    @Override
    public List<MovimientoCaja> obtenerPorTipo(String tipo) {
        return movimientoCajaRepository.findByTipoIgnoreCase(tipo);
    }

    @Override
    public MovimientoCaja registrarMovimiento(MovimientoCaja movimiento) {
        movimiento.setEstado("activo");
        return movimientoCajaRepository.save(movimiento);
    }

    @Override
    public MovimientoCaja registrarIngreso(String descripcion, Long monto, Long cajaId, Compra compra, Pedido pedido) {
        return crearMovimiento("INGRESO", descripcion, monto, cajaId, compra, pedido);
    }

    @Override
    public MovimientoCaja registrarEgreso(String descripcion, Long monto, Long cajaId, Compra compra, Pedido pedido) {
        return crearMovimiento("EGRESO", descripcion, monto, cajaId, compra, pedido);
    }

    @Override
    public List<MovimientoCaja> findAll() {
        return (List<MovimientoCaja>) movimientoCajaRepository.findAll();
    }

    @Override
    public Optional<MovimientoCaja> findById(Long id) {
        return movimientoCajaRepository.findById(id);
    }

    @Override
    public MovimientoCaja save(MovimientoCaja movimientoCaja) {
        return movimientoCajaRepository.save(movimientoCaja);
    }

    @Override
    public Optional<MovimientoCaja> update(Long id, MovimientoCaja movimientoCaja) {
        Optional<MovimientoCaja> movimientoOptional = movimientoCajaRepository.findById(id);

        if (movimientoOptional.isPresent()) {
            MovimientoCaja movimientoDb = movimientoOptional.orElseThrow();
            movimientoDb.setTipo(movimientoCaja.getTipo());
            movimientoDb.setDescripcion(movimientoCaja.getDescripcion());
            movimientoDb.setMonto(movimientoCaja.getMonto());
            return Optional.of(movimientoCajaRepository.save(movimientoDb));
        }
        return movimientoOptional;
    }

    @Override
    public Optional<MovimientoCaja> eliminarPorCompra(Long id) {
        Optional<MovimientoCaja> movimientoOptional = movimientoCajaRepository.findByCompraId(id);
        if (!movimientoOptional.isPresent()) {
            return Optional.empty();
        }
        MovimientoCaja movimiento = movimientoOptional.orElseThrow();

        // Marcar como ANULADO
        movimiento.setEstado("ANULADO");
        movimientoCajaRepository.save(movimiento);
        return Optional.of(movimiento);

    }

    @Override
    public List<MovimientoCaja> obtenerPorCaja(Long cajaId) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

}
