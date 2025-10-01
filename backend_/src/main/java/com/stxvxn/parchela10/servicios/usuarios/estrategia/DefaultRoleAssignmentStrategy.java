package com.stxvxn.parchela10.servicios.usuarios.estrategia;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.stxvxn.parchela10.entidades.Role;
import com.stxvxn.parchela10.repositorios.RoleRepository;

@Component
public class DefaultRoleAssignmentStrategy implements RoleAssignmentStrategy {
    
    private final RoleRepository roleRepository;
    
    public DefaultRoleAssignmentStrategy(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }
    
    @Override
    public List<Role> asignarRoles(boolean isAdmin) {
        List<Role> roles = new ArrayList<>();
        
        // Roles base para todos los usuarios
        roleRepository.findByName("ROLE_USER").ifPresent(roles::add);
        roleRepository.findByName("ROLE_EMPLEADO").ifPresent(roles::add);
        
        // Rol adicional si es admin
        if (isAdmin) {
            roleRepository.findByName("ROLE_ADMIN").ifPresent(roles::add);
        }
        
        return roles;
    }
}