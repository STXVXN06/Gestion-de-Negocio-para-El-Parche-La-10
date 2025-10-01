package com.stxvxn.parchela10.servicios.usuarios.validacion;

import org.springframework.stereotype.Component;

import com.stxvxn.parchela10.entidades.User;
import com.stxvxn.parchela10.repositorios.UserRepository;

@Component
public class UserValidator implements IUserValidator {
    
    private final UserRepository userRepository;
    
    public UserValidator(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    @Override
    public void validarParaCreacion(User user) {
        if (user == null) {
            throw new IllegalArgumentException("El usuario no puede ser nulo");
        }
        
        if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("El username es obligatorio");
        }
        
        if (user.getUsername().length() < 3 || user.getUsername().length() > 15) {
            throw new IllegalArgumentException("El username debe tener entre 3 y 15 caracteres");
        }
        
        if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("La contraseña es obligatoria");
        }
        
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("El username ya existe");
        }
    }
    
    @Override
    public void validarParaActualizacion(User user) {
        if (user == null) {
            throw new IllegalArgumentException("El usuario no puede ser nulo");
        }
        
        if (user.getId() == null) {
            throw new IllegalArgumentException("El ID del usuario es obligatorio");
        }
    }
}