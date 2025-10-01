package com.stxvxn.parchela10.servicios.usuarios;

import java.util.List;
import java.util.Optional;

import com.stxvxn.parchela10.entidades.User;

// Interfaz para consultas
public interface IUserQueryService {
    List<User> findAll();
    Optional<User> findById(Long id);
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
}