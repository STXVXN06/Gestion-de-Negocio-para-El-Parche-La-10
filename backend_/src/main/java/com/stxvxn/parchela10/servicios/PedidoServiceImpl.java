package com.stxvxn.parchela10.servicios;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stxvxn.parchela10.entidades.Caja;
import com.stxvxn.parchela10.entidades.Ingrediente;
import com.stxvxn.parchela10.entidades.MovimientoCaja;
import com.stxvxn.parchela10.entidades.Pedido;
import com.stxvxn.parchela10.entidades.PedidoProducto;
import com.stxvxn.parchela10.entidades.ProductoIngrediente;
import com.stxvxn.parchela10.repositorios.IngredienteRepository;
import com.stxvxn.parchela10.repositorios.MovimientoCajaRepository;
import com.stxvxn.parchela10.repositorios.PedidoProductoRepository;
import com.stxvxn.parchela10.repositorios.PedidoRepository;
import com.stxvxn.parchela10.repositorios.ProductoIngredienteRepository;

/**
 * Implementación del servicio para la entidad Pedido.
 * Proporciona métodos para crear, buscar y cambiar el estado de los pedidos.
 */

@Service
public class PedidoServiceImpl implements IPedidoService {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private PedidoProductoRepository pedidoProductoRepository;

    @Autowired
    private IngredienteRepository ingredienteRepository;

    @Autowired
    private ProductoIngredienteRepository productoIngredienteRepository;

    @Autowired
    private MovimientoCajaRepository movimientoCajaRepository;

    @Autowired
    private CajaServiceImpl cajaService;



    @Transactional
    @Override
    public Optional<Pedido> crearPedido(Pedido pedido, List<PedidoProducto> pedidoProductos) {
        


        pedido.setEstado("PENDIENTE");
        Pedido pedidoGuardado = pedidoRepository.save(pedido);
        for (PedidoProducto pedidoProducto : pedidoProductos) {
            pedidoProducto.setPedido(pedidoGuardado);
            pedidoProductoRepository.save(pedidoProducto);
        }


        // Restar el stock de los ingredientes
        List<PedidoProducto> productos = pedidoProductoRepository.findByPedidoId(pedidoGuardado.getId());
        for (PedidoProducto pp : productos) {
                List<ProductoIngrediente> ingredientes = productoIngredienteRepository.findByProductoId(pp.getProducto().getId());

                for (ProductoIngrediente pi : ingredientes) {
                    Ingrediente ing = pi.getIngrediente();
                    double cantidadUsada = pi.getCantidadNecesaria() * pp.getCantidad();
                    ing.setCantidadActual(ing.getCantidadActual() - cantidadUsada);
                    ingredienteRepository.save(ing);
                }
            }
        return Optional.of(pedidoGuardado);
    }

    @Transactional(readOnly = true)
    @Override
    public Optional<Pedido> buscarPedidoPorId(Long id) {
        Optional<Pedido> pedidoOpt = pedidoRepository.findById(id);
        if (pedidoOpt.isPresent()) {
            Pedido pedido = pedidoOpt.get();
            // Forzar la carga de los productos asociados al pedido
            List<PedidoProducto> productos = pedidoProductoRepository.findByPedidoId(pedido.getId());
            productos.size();
        }
        return pedidoOpt;
    }

    @Transactional(readOnly = true)
    @Override
    public List<Pedido> obtenerTodos() {
         List<Pedido> pedidos = (List<Pedido>) pedidoRepository.findAll();
    // Forzar carga de productos para cada pedido
    pedidos.forEach(pedido -> {
        List<PedidoProducto> productos = pedidoProductoRepository.findByPedidoId(pedido.getId());
        productos.size(); // Activa la carga perezosa
    });
    return pedidos;
    }

    @Transactional
    @Override
    public Optional<Pedido> cambiarEstado(Long id, String estado) {
        Optional<Pedido> pedidoOpt = pedidoRepository.findById(id);
        
        if(pedidoOpt.isEmpty()) return Optional.empty();

        Pedido pedido = pedidoOpt.orElseThrow();
        pedido.setEstado(estado);
        pedidoRepository.save(pedido);

        // Si el estado es "CANCELADO", se debe devolver el stock de los ingredientes
        if (estado.equalsIgnoreCase("CANCELADO")) {
            List<PedidoProducto> productos = pedidoProductoRepository.findByPedidoId(pedido.getId());
            for (PedidoProducto pp : productos) {
                List<ProductoIngrediente> ingredientes = productoIngredienteRepository.findByProductoId(pp.getProducto().getId());

                for (ProductoIngrediente pi : ingredientes) {
                    Ingrediente ing = pi.getIngrediente();
                    double cantidadUsada = pi.getCantidadNecesaria() * pp.getCantidad();
                    ing.setCantidadActual(ing.getCantidadActual() + cantidadUsada);
                    ingredienteRepository.save(ing);
                }
            }
        }

        // Si el estado es "ENTREGADO", registrar el movimiento de caja
        if (estado.equalsIgnoreCase("ENTREGADO")) {
            Optional<Caja> cajaOptional = cajaService.obtenerCajaActual();

            // Registrar ingreso en caja
            MovimientoCaja ingreso = new MovimientoCaja();
            ingreso.setTipo("INGRESO");
            ingreso.setDescripcion("Pedido #" + pedido.getId() + " ENTREGADO");
            ingreso.setMonto(pedido.getTotal());
            ingreso.setFecha(pedido.getFecha());
            ingreso.setCaja(cajaOptional.orElseThrow()); 
            ingreso.setPedido(pedido);
            ingreso.setCompra(null);
            movimientoCajaRepository.save(ingreso);
            cajaService.ajustarMontoActual(pedido.getTotal());
            
        } 
    
        return Optional.of(pedido);


    }

    @Override
    public Optional<Pedido> actualizar(Long id, Pedido pedido) {
        Optional<Pedido> pedidoOpt = pedidoRepository.findById(id);
        if (pedidoOpt.isPresent()) {
            Pedido pedidoExistente = pedidoOpt.orElseThrow();
            pedidoExistente.setFecha(pedido.getFecha());
            pedidoExistente.setEstado(pedido.getEstado());
            pedidoExistente.setTotal(pedido.getTotal());
            pedidoExistente.setDetalles(pedido.getDetalles());
            return Optional.of(pedidoRepository.save(pedidoExistente));
        }
        return Optional.empty();
    }

    

}
