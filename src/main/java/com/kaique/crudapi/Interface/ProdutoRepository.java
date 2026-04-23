package com.kaique.crudapi.Interface;

import com.kaique.crudapi.Model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProdutoRepository extends JpaRepository <Produto, Long> {

}
