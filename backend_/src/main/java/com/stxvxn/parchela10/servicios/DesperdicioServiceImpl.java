package com.stxvxn.parchela10.servicios;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stxvxn.parchela10.entidades.Desperdicio;
import com.stxvxn.parchela10.entidades.Ingrediente;
import com.stxvxn.parchela10.entidades.Producto;
import com.stxvxn.parchela10.entidades.ProductoIngrediente;
import com.stxvxn.parchela10.repositorios.DesperdicioRepository;
import com.stxvxn.parchela10.repositorios.IngredienteRepository;

/**
 * Implementación del servicio para la entidad Desperdicio.
 * Proporciona métodos para registrar desperdicios y obtener la lista de desperdicios.
 */

@Service
public class DesperdicioServiceImpl implements IDesperdicioService{

    @Autowired
    private DesperdicioRepository desperdicioRepository;

    @Autowired
    private IngredienteRepository ingredienteRepository;

    @Autowired
    private IMovimientoCajaService movimientoCajaService;

    @Autowired
    private ICajaService cajaService;

    @Autowired
    private IProductoIngredienteService productoIngredienteService;

    @Transactional
    @Override
    public Optional<Desperdicio> registrarDesperdicio(Desperdicio desperdicio) {
        try {
             // Validación de negocio
            if ((desperdicio.getCantidadProducto() == null || desperdicio.getCantidadProducto() <= 0) && 
            (desperdicio.getCantidadIngrediente() == null || desperdicio.getCantidadIngrediente() <= 0)) {
            throw new IllegalArgumentException("Debe ingresar al menos un producto o ingrediente");
            }

            

            // 1. Procesar desperdicio de producto
            if (desperdicio.getProducto() != null && desperdicio.getCantidadProducto() > 0) {
                procesarDesperdicioProducto(desperdicio.getProducto(), desperdicio.getCantidadProducto());
            }

            // 2. Procesar desperdicio de ingrediente directo
            if (desperdicio.getIngrediente() != null && desperdicio.getCantidadIngrediente() > 0) {
                procesarDesperdicioIngrediente(desperdicio.getIngrediente(), desperdicio.getCantidadIngrediente());
            }

            // 3. Guardar registro de desperdicio
            Desperdicio guardado = desperdicioRepository.save(desperdicio);


            return Optional.of(guardado);
        } catch (Exception e) {
            throw new RuntimeException("Error al registrar desperdicio: " + e.getMessage());
        }
    }

    @Transactional
    public List<Desperdicio> registrarDesperdicios(List<Desperdicio> desperdicios) {
    List<Desperdicio> resultados = new ArrayList<>();
    for (Desperdicio d : desperdicios) {
        resultados.add(this.registrarDesperdicio(d).orElseThrow());
    }
    return resultados;
}

    private void procesarDesperdicioProducto(Producto producto, Double cantidad) {
        // Obtener todos los ingredientes del producto
        List<ProductoIngrediente> ingredientes = productoIngredienteService.obtenerIngredientesDeProducto(producto.getId());
        
        for (ProductoIngrediente pi : ingredientes) {
            Ingrediente ingrediente = pi.getIngrediente();
            double cantidadTotal = pi.getCantidadNecesaria() * cantidad;
            
            if (ingrediente.getCantidadActual() < cantidadTotal) {
                throw new RuntimeException("Stock insuficiente de " + ingrediente.getNombre() + 
                                        " para el producto " + producto.getNombre());
            }
            
            ingrediente.setCantidadActual(ingrediente.getCantidadActual() - cantidadTotal);
            ingredienteRepository.save(ingrediente);
        }
    }

    private void procesarDesperdicioIngrediente(Ingrediente ingrediente, Double cantidad) {
        if (ingrediente.getCantidadActual() < cantidad) {
            throw new RuntimeException("Stock insuficiente de " + ingrediente.getNombre());
        }
        
        ingrediente.setCantidadActual(ingrediente.getCantidadActual() - cantidad);
        ingredienteRepository.save(ingrediente);
    }

    @Transactional(readOnly = true)
    @Override
    public List<Desperdicio> obtenerDesperdicios() {
        return (List<Desperdicio>) desperdicioRepository.findAll();
    }

}
