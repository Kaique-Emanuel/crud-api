package com.kaique.crudapi.Interface;

import com.kaique.crudapi.Model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

// repositorio de usuario
public interface UsuarioRepository extends JpaRepository <Usuario, Long> {
    Usuario findByLogin(String login);
    Usuario findFirstByEmailIgnoreCase(String email);
}
