package com.kaique.crudapi.Interface;

import com.kaique.crudapi.Model.Venda;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VendaRepository extends JpaRepository<Venda, Long> {
    // só essa query extra para puxar as últimas 10 vendas
    List<Venda> findTop10ByOrderByDataHoraDesc();
}
