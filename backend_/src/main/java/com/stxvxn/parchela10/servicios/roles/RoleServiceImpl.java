package com.stxvxn.parchela10.servicios.roles;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stxvxn.parchela10.entidades.Role;
import com.stxvxn.parchela10.repositorios.RoleRepository;

import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements IRoleService {
    
    private final RoleRepository roleRepository;
    
    @Override
    @Transactional(readOnly = true)
    public Optional<Role> findByName(String name) {
        return roleRepository.findByName(name);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Role> findAll() {
        return (List<Role>) roleRepository.findAll();
    }
    
    @Override
    @Transactional
    public Role save(Role role) {
        return roleRepository.save(role);
    }
}
