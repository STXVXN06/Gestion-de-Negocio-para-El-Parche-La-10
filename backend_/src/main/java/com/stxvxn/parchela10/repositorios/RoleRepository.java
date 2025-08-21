package com.stxvxn.parchela10.repositorios;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.stxvxn.parchela10.entidades.Role;

public interface RoleRepository extends CrudRepository<Role, Long> {

    Optional<Role> findByName(String name);
}
