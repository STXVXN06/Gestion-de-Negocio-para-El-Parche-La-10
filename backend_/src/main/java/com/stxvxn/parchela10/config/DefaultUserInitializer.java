package com.stxvxn.parchela10.config;
import com.stxvxn.parchela10.entidades.Role;
import com.stxvxn.parchela10.entidades.User;
import com.stxvxn.parchela10.repositorios.RoleRepository;
import com.stxvxn.parchela10.repositorios.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Optional;

@Component
public class DefaultUserInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Verificar si ya existen usuarios
        if (userRepository.count() == 0) {
            // Crear rol ADMIN si no existe
            Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> roleRepository.save(new Role("ROLE_ADMIN")));

            // Crear rol USER si no existe
            Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseGet(() -> roleRepository.save(new Role("ROLE_USER")));

            // Crear rol EMPLEADO si no existe
            Role empleadoRole = roleRepository.findByName("ROLE_EMPLEADO")
                .orElseGet(() -> roleRepository.save(new Role("ROLE_EMPLEADO")));

            // Crear usuario admin por defecto
            User adminUser = new User();
            adminUser.setUsername("admin");
            adminUser.setPassword(passwordEncoder.encode("admin"));
            adminUser.setRoles(Collections.singletonList(adminRole));
            adminUser.setEnabled(true);

            userRepository.save(adminUser);
            System.out.println("Usuario admin creado por defecto");
        }
    }
}