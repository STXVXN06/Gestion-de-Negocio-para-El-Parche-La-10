package com.stxvxn.parchela10.repositorios;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.stxvxn.parchela10.entidades.Combo;

public interface ComboRepository extends CrudRepository<Combo, Long> {

    List<Combo> findByActivoTrue();

}
