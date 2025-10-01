package com.stxvxn.parchela10.servicios.usuarios;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stxvxn.parchela10.dto.RegistroUsuarioDTO;
import com.stxvxn.parchela10.entidades.Role;
import com.stxvxn.parchela10.entidades.User;
import com.stxvxn.parchela10.repositorios.RoleRepository;
import com.stxvxn.parchela10.repositorios.UserRepository;
import com.stxvxn.parchela10.servicios.usuarios.estrategia.IPasswordEncryptionService;
import com.stxvxn.parchela10.servicios.usuarios.estrategia.RoleAssignmentStrategy;
import com.stxvxn.parchela10.servicios.usuarios.validacion.IUserValidator;

import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class UserServiceImpl implements IUserService {
    
    // ✅ Dependencias de abstracciones (DIP)
    private final UserRepository userRepository;
    private final RoleAssignmentStrategy roleAssignmentStrategy;
    private final IPasswordEncryptionService passwordEncryptionService;
    private final IUserValidator userValidator;
    
    // ===== QUERIES =====
    
    @Override
    @Transactional(readOnly = true)
    public List<User> findAll() {
        return (List<User>) userRepository.findAll();
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }
    
    // ===== COMMANDS =====
    
    @Override
    @Transactional
    public User save(User user) {
        // ✅ 1. Validar (delegado)
        userValidator.validarParaCreacion(user);
        
        // ✅ 2. Asignar roles (delegado a estrategia)
        List<Role> roles = roleAssignmentStrategy.asignarRoles(user.isAdmin());
        user.setRoles(roles);
        
        // ✅ 3. Encriptar contraseña (delegado)
        String passwordEncriptada = passwordEncryptionService.encriptar(user.getPassword());
        user.setPassword(passwordEncriptada);
        
        // ✅ 4. Persistir (única lógica propia del servicio)
        return userRepository.save(user);
    }
    
    @Override
    @Transactional
    public Optional<User> delete(Long id) {
        Optional<User> userOptional = userRepository.findById(id);
        userOptional.ifPresent(userRepository::delete);
        return userOptional;
    }
}
