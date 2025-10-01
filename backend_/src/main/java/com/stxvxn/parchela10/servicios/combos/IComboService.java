package com.stxvxn.parchela10.servicios.combos;

import java.util.List;
import java.util.Optional;

import com.stxvxn.parchela10.dto.ComboDTO;
import com.stxvxn.parchela10.entidades.Combo;
import com.stxvxn.parchela10.entidades.ComboProducto;

public interface IComboService {

    Combo crearCombo(ComboDTO dto);

    Combo actualizarCombo(Long id, ComboDTO dto);

    void desactivarCombo(Long id);

    List<Combo> listarCombosActivos();

    Optional<Combo> findById(Long id);

    List<ComboProducto> obtenerProductoDelCombo(Long comboId);
}
