package com.stxvxn.parchela10.servicios;

import java.util.List;

import com.stxvxn.parchela10.entidades.User;

public interface IUserService {


    List<User> findAll();

    User save(User user);

    boolean ExistsByUsername(String username);
    
}
