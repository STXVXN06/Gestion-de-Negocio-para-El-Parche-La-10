package com.stxvxn.parchela10.servicios.productos;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stxvxn.parchela10.dto.ProductoConIngredienteDTO;
import com.stxvxn.parchela10.dto.ProductoConIngredientesResponse;
import com.stxvxn.parchela10.entidades.Producto;
import com.stxvxn.parchela10.entidades.ProductoIngrediente;
import com.stxvxn.parchela10.validation.IProductoIngredienteValidator;

/**
 * Implementación del Facade para operaciones complejas de productos.
 * 
 * SOLID:
 * - SRP: Coordina servicios pero no contiene lógica de negocio específica
 * - OCP: Abierto a extensión mediante inyección de nuevos servicios
 * - DIP: Todas las dependencias son interfaces
 * 
 * Patrón: Facade + Coordinator
 */
@Service
public class ProductoFacadeServiceImpl implements IProductoFacadeService {

    private final IProductoService productoService;
    private final IProductoIngredienteService productoIngredienteService;
    private final IProductoResponseBuilder responseBuilder;
    private final IProductoIngredienteValidator validator;

    @Autowired
    public ProductoFacadeServiceImpl(
            IProductoService productoService,
            IProductoIngredienteService productoIngredienteService,
            IProductoResponseBuilder responseBuilder,
            IProductoIngredienteValidator validator) {
        this.productoService = productoService;
        this.productoIngredienteService = productoIngredienteService;
        this.responseBuilder = responseBuilder;
        this.validator = validator;
    }

    @Transactional
    @Override
    public Optional<Producto> crearProductoConIngredientes(ProductoConIngredienteDTO dto) {
        // Validar ingredientes antes de crear
        if (!validator.validarIngredientes(dto.getIngredientes())) {
            return Optional.empty();
        }

        // 1. Crear el producto
        Producto producto = construirProducto(dto);
        Producto productoGuardado = productoService.save(producto);

        // 2. Agregar ingredientes
        agregarIngredientesAProducto(productoGuardado.getId(), dto.getIngredientes());

        return Optional.of(productoGuardado);
    }

    @Transactional
    @Override
    public Optional<Producto> actualizarProductoConIngredientes(Long id, ProductoConIngredienteDTO dto) {
        // Validar ingredientes
        if (dto.getIngredientes() != null && !validator.validarIngredientes(dto.getIngredientes())) {
            return Optional.empty();
        }

        // 1. Actualizar producto
        Producto producto = construirProducto(dto);
        producto.setId(id);

        Optional<Producto> productoActualizado = productoService.update(id, producto);
        if (productoActualizado.isEmpty()) {
            return Optional.empty();
        }

        // 2. Actualizar ingredientes si están presentes
        if (dto.getIngredientes() != null) {
            actualizarIngredientesDeProducto(id, dto.getIngredientes());
        }

        return productoActualizado;
    }

    @Transactional(readOnly = true)
    @Override
    public Optional<ProductoConIngredientesResponse> obtenerProductoConIngredientes(Long productoId) {
        List<ProductoIngrediente> ingredientes = productoIngredienteService
                .obtenerIngredientesDeProducto(productoId);

        if (ingredientes.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(responseBuilder.buildResponse(ingredientes));
    }

    // ==================== MÉTODOS PRIVADOS ====================

    private Producto construirProducto(ProductoConIngredienteDTO dto) {
        Producto producto = new Producto();
        producto.setNombre(dto.getNombre());
        producto.setTipo(dto.getTipo());
        producto.setPrecio(dto.getPrecio());
        producto.setActivo(dto.getActivo() != null ? dto.getActivo() : true);
        return producto;
    }

    private void agregarIngredientesAProducto(Long productoId, List<ProductoConIngredienteDTO.IngredienteCantidad> ingredientes) {
        for (ProductoConIngredienteDTO.IngredienteCantidad ing : ingredientes) {
            productoIngredienteService.agregarIngredienteAProducto(
                    productoId,
                    ing.getIngredienteId(),
                    ing.getCantidad()
            );
        }
    }

    private void actualizarIngredientesDeProducto(Long productoId, List<ProductoConIngredienteDTO.IngredienteCantidad> ingredientes) {
        // Eliminar ingredientes existentes
        productoIngredienteService.eliminarIngredientesDeProducto(productoId);

        // Agregar nuevos ingredientes
        agregarIngredientesAProducto(productoId, ingredientes);
    }
}