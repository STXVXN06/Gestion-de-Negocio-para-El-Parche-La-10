package com.stxvxn.parchela10.controladores;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.stxvxn.parchela10.entidades.UnidadMedida;
import com.stxvxn.parchela10.servicios.UnidadMedidaServiceImpl;

@RestController
@CrossOrigin(value = "http://localhost:3000")
@RequestMapping("/api/unidadesMedida")
public class UnidadMedidaController {

    @Autowired
    private UnidadMedidaServiceImpl unidadMedidaService;

    @GetMapping
    public List<UnidadMedida> list(){
        return unidadMedidaService.obtenerTodos();
    }
}
