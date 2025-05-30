package com.stxvxn.parchela10.servicios;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.stxvxn.parchela10.entidades.UnidadMedida;
import com.stxvxn.parchela10.repositorios.UnidadMedidaRepository;

@Service
public class UnidadMedidaServiceImpl implements IUnidadMedidaService {

    @Autowired
    private UnidadMedidaRepository unidadMedidaRepository;

    @Override
    public List<UnidadMedida> obtenerTodos() {
        return (List<UnidadMedida>) unidadMedidaRepository.findAll(); 
    }

}
