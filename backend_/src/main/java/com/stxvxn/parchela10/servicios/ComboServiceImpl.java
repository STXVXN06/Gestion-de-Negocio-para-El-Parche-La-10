package com.stxvxn.parchela10.servicios;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stxvxn.parchela10.DTO.ComboDTO;
import com.stxvxn.parchela10.entidades.Combo;
import com.stxvxn.parchela10.entidades.ComboProducto;
import com.stxvxn.parchela10.entidades.Producto;
import com.stxvxn.parchela10.repositorios.ComboProductoRepository;
import com.stxvxn.parchela10.repositorios.ComboRepository;
import com.stxvxn.parchela10.repositorios.ProductoRepository;

/**
 * Servicio encargado de manejar la lógica relacionada con los Combos.
 */
@Service
public class ComboServiceImpl implements IComboService {

    @Autowired
    private ComboRepository comboRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private ComboProductoRepository comboProductoRepository;

    @Transactional
    @Override
    public Combo crearCombo(ComboDTO dto) {

        if (dto == null || dto.getProductos() == null || dto.getProductos().isEmpty()) {
            throw new IllegalArgumentException("El combo debe contener al menos un producto.");
        }

        // Crear entidad Combo
        Combo combo = new Combo();
        combo.setNombre(dto.getNombre());
        combo.setDescripcion(dto.getDescripcion());
        combo.setDescuento(dto.getDescuento());
        combo.setActivo(true);

        Combo comboGuardado = comboRepository.save(combo);

        // Asociar productos al combo
        for (ComboDTO.ComboItemDTO itemDTO : dto.getProductos()) {
            if (itemDTO.getProductoId() == null || itemDTO.getCantidad() == null || itemDTO.getCantidad() <= 0) {
                continue; // Ignorar productos no válidos
            }

            Optional<Producto> productoOptional = productoRepository.findById(itemDTO.getProductoId());

            if (productoOptional.isPresent()) {
                Producto producto = productoOptional.orElseThrow();

                ComboProducto comboProducto = new ComboProducto();
                comboProducto.setCombo(comboGuardado);
                comboProducto.setProducto(producto);
                comboProducto.setCantidad(itemDTO.getCantidad());

                comboProductoRepository.save(comboProducto);
            }
        }

        return comboGuardado;
    }

    @Transactional
    @Override
    public Combo actualizarCombo(Long id, ComboDTO dto) {

        Optional<Combo> comboOptional = comboRepository.findById(id);

        if (comboOptional.isEmpty()) {
            throw new RuntimeException("No se encontró combo con ID: " + id);
        }

        Combo combo = comboOptional.orElseThrow();

        combo.setNombre(dto.getNombre());
        combo.setDescripcion(dto.getDescripcion());
        combo.setDescuento(dto.getDescuento());

        // Eliminar relaciones anteriores
        comboProductoRepository.deleteByComboId(combo.getId());

        // Crear nuevas relaciones
        for (ComboDTO.ComboItemDTO itemDTO : dto.getProductos()) {
            if (itemDTO.getProductoId() == null || itemDTO.getCantidad() == null || itemDTO.getCantidad() <= 0) {
                continue;
            }

            Producto producto = productoRepository.findById(itemDTO.getProductoId()).orElseThrow();

            ComboProducto comboProducto = new ComboProducto();
            comboProducto.setCombo(combo);
            comboProducto.setProducto(producto);
            comboProducto.setCantidad(itemDTO.getCantidad());

            comboProductoRepository.save(comboProducto);
        }

        return comboRepository.save(combo);
    }

    @Transactional
    @Override
    public void desactivarCombo(Long id) {
        Optional<Combo> comboOptional = comboRepository.findById(id);

        if (comboOptional.isPresent()) {
            Combo combo = comboOptional.orElseThrow();
            combo.setActivo(false);
            comboRepository.save(combo);
        }
    }

    @Transactional(readOnly = true)
    @Override
    public List<Combo> listarCombosActivos() {
        return comboRepository.findByActivoTrue();
    }

    @Transactional(readOnly = true)
    @Override
    public Optional<Combo> findById(Long id) {
        return comboRepository.findById(id);
    }

    @Transactional(readOnly = true)
    @Override
    public Long calcularPrecioCombo(Long comboId) {

        Optional<Combo> comboOptional = comboRepository.findById(comboId);

        if (comboOptional.isEmpty()) {
            throw new RuntimeException("Combo no encontrado con ID: " + comboId);
        }

        List<ComboProducto> productosCombo = comboProductoRepository.findByComboId(comboId);

        long precioBase = 0;

        for (ComboProducto cp : productosCombo) {
            if (cp.getProducto() != null && cp.getCantidad() != null) {
                precioBase += cp.getProducto().getPrecio() * cp.getCantidad();
            }
        }

        Combo combo = comboOptional.orElseThrow();

        long descuentoAplicado = (long) (precioBase * combo.getDescuento());

        return precioBase - descuentoAplicado;
    }

    @Override
    public List<ComboProducto> obtenerProductoDelCombo(Long comboId) {
        return comboProductoRepository.findByComboId(comboId);
    }

}
