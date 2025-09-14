package com.stxvxn.parchela10.servicios;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stxvxn.parchela10.DTO.RegistroUsuarioDTO;
import com.stxvxn.parchela10.entidades.Role;
import com.stxvxn.parchela10.entidades.User;
import com.stxvxn.parchela10.repositorios.RoleRepository;
import com.stxvxn.parchela10.repositorios.UserRepository;

@Service
public class UserServiceImpl implements IUserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public List<User> findAll() {

        return (List<User>) userRepository.findAll();

    }

    @Override
    public User save(User user) {

        Optional<Role> optionalRoleUser = roleRepository.findByName("ROLE_USER");
        Optional<Role> optionalRoleEmpleado = roleRepository.findByName("ROLE_EMPLEADO");

        List<Role> roles = new ArrayList<>();

        optionalRoleUser.ifPresent(roles::add);
        optionalRoleEmpleado.ifPresent(roles::add);

        if (user.isAdmin()) {
            Optional<Role> optionalRoleAdmin = roleRepository.findByName("ROLE_ADMIN");
            optionalRoleAdmin.ifPresent(roles::add);
        }

        user.setRoles(roles);
        user.setPassword(passwordEncoder.encode(user.getPassword()));


        return userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean ExistsByUsername(String username) {
        return userRepository.existsByUsername(username);

    }

    @Override
    public Optional<User> delete(Long id) {
        Optional<User> userOptional = userRepository.findById(id);
        userOptional.ifPresent(user -> userRepository.delete(user));
        return userOptional;

    }

}
