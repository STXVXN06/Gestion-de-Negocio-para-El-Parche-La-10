package com.stxvxn.parchela10.servicios.roles;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.stxvxn.parchela10.entidades.Role;
import com.stxvxn.parchela10.repositorios.RoleRepository;


@Service
public class RoleServiceImpl implements IRoleService {


    @Autowired
    private RoleRepository roleRepository;
    @Override
    public Optional<Role> buscarPorNombre(String name) {
        return roleRepository.findByName(name);
    }
    
}
