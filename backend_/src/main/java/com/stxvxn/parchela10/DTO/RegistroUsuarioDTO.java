package com.stxvxn.parchela10.DTO;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;


@Data
public class RegistroUsuarioDTO {
     @NotBlank
    @Size(min = 3, max = 15, message = "El nombre de usuario debe tener entre 3 y 15 caracteres")
    private String username;
    
    @NotBlank
    private String password;
    
    private boolean isAdmin = false;
}
