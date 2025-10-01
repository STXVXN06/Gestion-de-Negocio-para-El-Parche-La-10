package com.stxvxn.parchela10.servicios.productos;

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

    private final ProductoRepository productoRepository;

    @Autowired
    public ProductoServiceImpl(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }


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
        validarProducto(producto);
        return productoRepository.save(producto);
    }

    @Transactional
    @Override
    public Optional<Producto> update(Long id, Producto producto) {
        validarProducto(producto);

        return productoRepository.findById(id)
                .map(productoDb -> {
                    actualizarCampos(productoDb, producto);
                    return productoRepository.save(productoDb);
                });
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

    private void validarProducto(Producto producto) {
        if (producto == null) {
            throw new IllegalArgumentException("El producto no puede ser nulo");
        }
        if (producto.getNombre() == null || producto.getNombre().trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre del producto es requerido");
        }
        if (producto.getPrecio() == null || producto.getPrecio() < 0) {
            throw new IllegalArgumentException("El precio debe ser mayor o igual a cero");
        }
    }

    private void actualizarCampos(Producto productoDb, Producto producto) {
        productoDb.setNombre(producto.getNombre());
        productoDb.setTipo(producto.getTipo());
        productoDb.setPrecio(producto.getPrecio());
        productoDb.setActivo(producto.getActivo());
    }

}
