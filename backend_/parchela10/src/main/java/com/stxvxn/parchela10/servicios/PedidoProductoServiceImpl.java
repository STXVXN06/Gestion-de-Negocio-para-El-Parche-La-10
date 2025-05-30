package com.stxvxn.parchela10.servicios;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stxvxn.parchela10.entidades.PedidoProducto;
import com.stxvxn.parchela10.repositorios.PedidoProductoRepository;



@Service
public class PedidoProductoServiceImpl implements IPedidoProductoService {

    @Autowired
    private PedidoProductoRepository pedidoProductoRepository;

    @Transactional(readOnly = true)
    @Override
    public List<PedidoProducto> obtenerPedidoProductosPorPedidoId(Long pedidoId) {
        return pedidoProductoRepository.findByPedidoId(pedidoId);
    }

    @Transactional
    @Override
    public PedidoProducto guardarPedidoProducto(PedidoProducto pedidoProducto) {
        return pedidoProductoRepository.save(pedidoProducto);
    }

    @Transactional
    @Override
    public Optional<PedidoProducto> eliminarPedidoProducto(Long id) {
        Optional<PedidoProducto> pedidoProductoOptional = pedidoProductoRepository.findById(id);
        if (pedidoProductoOptional.isPresent()) {
            pedidoProductoRepository.deleteById(id);
            return pedidoProductoOptional;
        }
        return pedidoProductoOptional;
        
    }
}
