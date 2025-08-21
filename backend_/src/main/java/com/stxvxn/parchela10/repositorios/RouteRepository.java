package com.stxvxn.parchela10.repositorios;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.stxvxn.parchela10.entidades.Route;

public interface RouteRepository extends CrudRepository<Route, Long> {

    
    List<Route> findByPathAndMethod(String path, String method);

    @Query("SELECT r FROM Route r LEFT JOIN FETCH r.roles")
    List<Route> findAllWithRoles();
}
