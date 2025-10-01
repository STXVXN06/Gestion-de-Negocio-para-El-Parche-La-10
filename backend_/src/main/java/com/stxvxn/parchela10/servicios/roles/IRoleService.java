package com.stxvxn.parchela10.servicios.roles;

import java.util.List;
import java.util.Optional;

import com.stxvxn.parchela10.entidades.Role;

public interface IRoleService {
    Optional<Role> findByName(String name);
    List<Role> findAll();
    Role save(Role role);
}