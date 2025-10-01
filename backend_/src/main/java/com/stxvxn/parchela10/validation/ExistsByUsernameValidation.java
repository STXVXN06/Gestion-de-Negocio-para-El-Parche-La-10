package com.stxvxn.parchela10.validation;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.stxvxn.parchela10.servicios.usuarios.UserServiceImpl;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

@Component
public class ExistsByUsernameValidation implements ConstraintValidator<ExistsByUsername, String> {

    @Autowired
    private UserServiceImpl userService;

    @Override
    public boolean isValid(String username, ConstraintValidatorContext context) {

        if (userService == null) {
            return true;
        }

        return !userService.existsByUsername(username);

    }

}
