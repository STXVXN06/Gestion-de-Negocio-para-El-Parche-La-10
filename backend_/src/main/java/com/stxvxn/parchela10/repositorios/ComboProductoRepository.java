package com.stxvxn.parchela10.repositorios;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.stxvxn.parchela10.entidades.ComboProducto;

public interface ComboProductoRepository extends CrudRepository<ComboProducto, Long> {

    List<ComboProducto> findByComboId(Long comboId);

    void deleteByComboId(Long comboId);

    @Query("SELECT cp FROM ComboProducto cp WHERE cp.combo.id IN :comboIds")
    List<ComboProducto> findByComboIds(@Param("comboIds") List<Long> comboIds);

}
