package com.stxvxn.parchela10.controladores;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    @GetMapping("/page")
    public Page<UnidadMedida> listPage(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ){
        int p = page != null ? Math.max(0, page) : 0;
        int s = size != null ? Math.min(100, Math.max(1, size)) : 20;
        Pageable pageable = PageRequest.of(p, s, Sort.by(Sort.Direction.ASC, "id"));
        return unidadMedidaService.obtenerTodos(pageable);
    }
}
