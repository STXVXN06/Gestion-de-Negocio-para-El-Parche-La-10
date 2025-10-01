package com.stxvxn.parchela10.servicios.usuarios;

import java.util.Optional;

import com.stxvxn.parchela10.entidades.User;

// Interfaz para comandos
public interface IUserCommandService {
    User save(User user);
    Optional<User> delete(Long id);
}