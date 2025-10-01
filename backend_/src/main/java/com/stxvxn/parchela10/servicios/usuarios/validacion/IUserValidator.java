package com.stxvxn.parchela10.servicios.usuarios.validacion;

import com.stxvxn.parchela10.entidades.User;

public interface IUserValidator {
    void validarParaCreacion(User user);
    void validarParaActualizacion(User user);
}