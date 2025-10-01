package com.stxvxn.parchela10.servicios.usuarios.estrategia;

import java.util.List;

import com.stxvxn.parchela10.entidades.Role;

public interface RoleAssignmentStrategy {
    List<Role> asignarRoles(boolean isAdmin);
}