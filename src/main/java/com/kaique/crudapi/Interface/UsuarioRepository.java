package com.kaique.crudapi.Interface;

import com.kaique.crudapi.Model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository <Produto, Long> {

}
