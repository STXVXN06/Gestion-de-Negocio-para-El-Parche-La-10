package com.stxvxn.parchela10.servicios;

import java.util.Optional;

import com.stxvxn.parchela10.entidades.Role;

public interface IRoleService {
    
    Optional<Role> buscarPorNombre(String name);
}
