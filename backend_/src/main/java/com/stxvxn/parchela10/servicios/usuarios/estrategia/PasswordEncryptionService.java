package com.stxvxn.parchela10.servicios.usuarios.estrategia;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PasswordEncryptionService implements IPasswordEncryptionService {
    
    private final PasswordEncoder passwordEncoder;
    
    public PasswordEncryptionService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }
    
    @Override
    public String encriptar(String password) {
        return passwordEncoder.encode(password);
    }
    
    @Override
    public boolean validar(String passwordPlano, String passwordEncriptado) {
        return passwordEncoder.matches(passwordPlano, passwordEncriptado);
    }
}