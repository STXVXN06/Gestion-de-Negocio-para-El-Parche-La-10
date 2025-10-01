package com.stxvxn.parchela10.servicios.usuarios.estrategia;

public interface IPasswordEncryptionService {
    String encriptar(String password);
    boolean validar(String passwordPlano, String passwordEncriptado);
}