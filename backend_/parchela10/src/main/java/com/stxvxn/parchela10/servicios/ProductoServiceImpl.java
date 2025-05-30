package com.stxvxn.parchela10.servicios;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stxvxn.parchela10.entidades.Producto;
import com.stxvxn.parchela10.repositorios.ProductoRepository;


/**
 * Implementación del servicio para la entidad Producto.
 * Proporciona métodos para realizar operaciones CRUD sobre productos.
 */

@Service
public class ProductoServiceImpl implements IProductoService {

    @Autowired
    private ProductoRepository productoRepository;


    @Transactional(readOnly = true)
    @Override
    public List<Producto> findAll() {
        return (List<Producto>) productoRepository.findAll();
    }

    @Transactional(readOnly = true)
    @Override
    public Optional<Producto> findById(Long id) {
        return productoRepository.findById(id);
    }

    @Transactional
    @Override
    public Producto save(Producto producto) {
        return productoRepository.save(producto);
    }

    @Transactional
    @Override
    public Optional<Producto> update(Long id, Producto producto) {
        Optional<Producto> productoOptional = productoRepository.findById(id);

        if(productoOptional.isPresent()){
            Producto productoDb = productoOptional.orElseThrow();
            productoDb.setNombre(producto.getNombre());
            productoDb.setTipo(producto.getTipo());
            productoDb.setPrecio(producto.getPrecio());
            productoDb.setActivo(producto.getActivo());
            return Optional.of(productoRepository.save(productoDb));
        }
        return productoOptional;
        
    }


    @Transactional
    @Override
    public Optional<Producto> delete(Long id) {
        Optional<Producto> productoOptional = productoRepository.findById(id);

        productoOptional.ifPresent(producto -> {
            producto.setActivo(false);
            productoRepository.save(producto);
        });
        return productoOptional;
    }

}
