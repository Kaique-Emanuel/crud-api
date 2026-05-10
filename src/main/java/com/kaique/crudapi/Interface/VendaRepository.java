package com.kaique.crudapi.Interface;

import com.kaique.crudapi.Model.Venda;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VendaRepository extends JpaRepository<Venda, Long> {
    List<Venda> findTop10ByOrderByDataHoraDesc();
}
