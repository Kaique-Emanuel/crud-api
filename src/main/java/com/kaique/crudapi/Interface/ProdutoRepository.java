package com.kaique.crudapi.Interface;

import com.kaique.crudapi.Model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;

// repositorio de produto
public interface ProdutoRepository extends JpaRepository <Produto, Long> {

}
