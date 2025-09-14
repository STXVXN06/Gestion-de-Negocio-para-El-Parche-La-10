package com.stxvxn.parchela10.servicios;

import java.util.List;
import java.util.Optional;

import com.stxvxn.parchela10.entidades.User;

public interface IUserService {


    List<User> findAll();

    User save(User user);

    boolean ExistsByUsername(String username);

    Optional<User> delete(Long id);
    
}
