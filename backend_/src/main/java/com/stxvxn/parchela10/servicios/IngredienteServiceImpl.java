package com.stxvxn.parchela10.servicios;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stxvxn.parchela10.entidades.Ingrediente;
import com.stxvxn.parchela10.repositorios.IngredienteRepository;

/**
 * Implementación del servicio para la entidad Ingrediente. Proporciona métodos
 * para realizar operaciones CRUD sobre ingredientes.
 */
@Service
public class IngredienteServiceImpl implements IIngredienteService {

    @Autowired
    private IngredienteRepository ingredienteRepository;

    @Transactional(readOnly = true)
    @Override
    public List<Ingrediente> findAll() {
        return (List<Ingrediente>) ingredienteRepository.findAll();
    }

    @Transactional(readOnly = true)
    @Override
    public Optional<Ingrediente> findById(Long id) {
        return ingredienteRepository.findById(id);
    }

    @Transactional
    @Override
    public Ingrediente save(Ingrediente ingrediente) {
        return ingredienteRepository.save(ingrediente);
    }

    @Transactional
    @Override
    public Optional<Ingrediente> update(Long id, Ingrediente ingrediente) {
        Optional<Ingrediente> ingredienteOptional = ingredienteRepository.findById(id);

        if (ingredienteOptional.isPresent()) {
            Ingrediente ingredienteDb = ingredienteOptional.orElseThrow();
            ingredienteDb.setNombre(ingrediente.getNombre());
            ingredienteDb.setUnidadMedida(ingrediente.getUnidadMedida());
            ingredienteDb.setCantidadActual(ingrediente.getCantidadActual());
            return Optional.of(ingredienteRepository.save(ingredienteDb));
        }
        return ingredienteOptional;
    }

    @Transactional
    @Override
    public Optional<Ingrediente> delete(Long id) {
        Optional<Ingrediente> ingredienteOptional = ingredienteRepository.findById(id);

        ingredienteOptional.ifPresent(ingrediente -> {
            ingredienteRepository.delete(ingrediente);
        });
        return ingredienteOptional;
    }

    @Override
    public Optional<Ingrediente> findByNombre(String nombre) {
        return ingredienteRepository.findByNombre(nombre);
    }

}
