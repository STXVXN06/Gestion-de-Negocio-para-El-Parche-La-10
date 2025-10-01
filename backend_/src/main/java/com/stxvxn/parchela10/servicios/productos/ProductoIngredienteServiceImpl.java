package com.stxvxn.parchela10.servicios.productos;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stxvxn.parchela10.entidades.Ingrediente;
import com.stxvxn.parchela10.entidades.Producto;
import com.stxvxn.parchela10.entidades.ProductoIngrediente;
import com.stxvxn.parchela10.repositorios.IngredienteRepository;
import com.stxvxn.parchela10.repositorios.ProductoIngredienteRepository;
import com.stxvxn.parchela10.repositorios.ProductoRepository;

@Service
public class ProductoIngredienteServiceImpl implements IProductoIngredienteService {

    // Implementación de los métodos de la interfaz IProductoIngrediente

    private final ProductoIngredienteRepository productoIngredienteRepo;
    private final ProductoRepository productoRepo;
    private final IngredienteRepository ingredienteRepo;

    @Autowired
    public ProductoIngredienteServiceImpl(
            ProductoIngredienteRepository productoIngredienteRepo,
            ProductoRepository productoRepo,
            IngredienteRepository ingredienteRepo) {
        this.productoIngredienteRepo = productoIngredienteRepo;
        this.productoRepo = productoRepo;
        this.ingredienteRepo = ingredienteRepo;
    }


    @Transactional
    @Override
    public Optional<ProductoIngrediente> agregarIngredienteAProducto(
            Long productoId, 
            Long ingredienteId, 
            Double cantidad) {
        
        validarParametros(productoId, ingredienteId, cantidad);

        Optional<Producto> productoOpt = productoRepo.findById(productoId);
        Optional<Ingrediente> ingredienteOpt = ingredienteRepo.findById(ingredienteId);

        if (productoOpt.isEmpty() || ingredienteOpt.isEmpty()) {
            return Optional.empty();
        }

        ProductoIngrediente relacion = crearRelacion(
                productoOpt.get(), 
                ingredienteOpt.get(), 
                cantidad
        );

        return Optional.of(productoIngredienteRepo.save(relacion));
    }

    @Transactional
    @Override
    public Optional<ProductoIngrediente> eliminarIngredienteDeProducto(Long productoId, Long ingredienteId) {
        Optional<ProductoIngrediente> productoIngredienteOptional = productoIngredienteRepo.findByProductoIdAndIngredienteId(productoId, ingredienteId);    
        if (productoIngredienteOptional.isPresent()) {
            productoIngredienteRepo.delete(productoIngredienteOptional.orElseThrow());
            
        }
        return productoIngredienteOptional;
    }   

    @Transactional(readOnly = true)
    @Override
    public List<ProductoIngrediente> obtenerIngredientesDeProducto(Long productoId) {
        if (productoId == null) {
            throw new IllegalArgumentException("El ID del producto no puede ser nulo");
        }
        return productoIngredienteRepo.findByProductoId(productoId);
    }

    @Transactional
    @Override
    public void eliminarIngredientesDeProducto(Long productoId) {
        if (productoId == null) {
            throw new IllegalArgumentException("El ID del producto no puede ser nulo");
        }
        productoIngredienteRepo.deleteByProductoId(productoId);
    }

    private void validarParametros(Long productoId, Long ingredienteId, Double cantidad) {
        if (productoId == null) {
            throw new IllegalArgumentException("El ID del producto no puede ser nulo");
        }
        if (ingredienteId == null) {
            throw new IllegalArgumentException("El ID del ingrediente no puede ser nulo");
        }
        if (cantidad == null || cantidad <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a cero");
        }
    }

    private ProductoIngrediente crearRelacion(Producto producto, Ingrediente ingrediente, Double cantidad) {
        ProductoIngrediente relacion = new ProductoIngrediente();
        relacion.setProducto(producto);
        relacion.setIngrediente(ingrediente);
        relacion.setCantidadNecesaria(cantidad);
        return relacion;
    }

}