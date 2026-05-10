package com.kaique.crudapi.Service;

import com.kaique.crudapi.Interface.UsuarioRepository;
import com.kaique.crudapi.Model.Usuario;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UsuarioService {


    private final UsuarioRepository repository;

    public UsuarioService(UsuarioRepository repository) {
        this.repository = repository;
    }

    public List<Usuario> listaTodos(){
        return repository.findAll();
    }

    public Usuario salvar(Usuario usuario){
        return repository.save(usuario);
    }

    public void excluirUsuario(Long id){
        repository.deleteById(id);
    }

    public Usuario buscarUsuario(Long id){
        return repository.findById(id).orElse(null);
    }

    public Usuario buscarPorLogin(String login) {
        return repository.findByLogin(login);
    }

    public Usuario buscarPorEmail(String email) {
        return repository.findFirstByEmailIgnoreCase(email);
    }

}
