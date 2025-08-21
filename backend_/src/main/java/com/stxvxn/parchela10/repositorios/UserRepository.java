package com.stxvxn.parchela10.repositorios;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.stxvxn.parchela10.entidades.User;

public interface UserRepository extends CrudRepository<User, Long> {


    boolean existsByUsername(String username);

    Optional<User> findByUsername(String username);

}
