package com.stxvxn.parchela10.repositorios;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.stxvxn.parchela10.entidades.Combo;

public interface ComboRepository extends JpaRepository<Combo, Long> {

    List<Combo> findByActivoTrue();

    Page<Combo> findByActivoTrue(Pageable pageable);

}
