package com.stxvxn.parchela10.servicios;

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

     @Autowired
    private ProductoIngredienteRepository productoIngredienteRepo;

    @Autowired
    private ProductoRepository productoRepo;

    @Autowired
    private IngredienteRepository ingredienteRepo;


    @Transactional
    @Override
    public Optional<ProductoIngrediente> agregarIngredienteAProducto(Long productoId, Long ingredienteId, Double cantidad) {
        
        if (productoId == null || ingredienteId == null || cantidad == null) {
            throw new IllegalArgumentException("productoId, ingredienteId o cantidad no pueden ser nulos");
        }
        
        Optional<Producto> productoOptional = productoRepo.findById(productoId);
        Optional<Ingrediente> ingredienteOptional = ingredienteRepo.findById(ingredienteId);

        if (productoOptional.isPresent() && ingredienteOptional.isPresent()) {
            ProductoIngrediente productoIngrediente = new ProductoIngrediente();
            productoIngrediente.setProducto(productoOptional.orElseThrow());
            productoIngrediente.setIngrediente(ingredienteOptional.orElseThrow());
            productoIngrediente.setCantidadNecesaria(cantidad);
            productoIngredienteRepo.save(productoIngrediente);
            return Optional.of(productoIngrediente);
        }
        return Optional.empty();
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
        
        return productoIngredienteRepo.findByProductoId(productoId);
    }

    @Transactional
    @Override
    public void eliminarIngredientesDeProducto(Long productoId) {
        productoIngredienteRepo.deleteByProductoId(productoId);
    }

}