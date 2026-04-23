package com.kaique.crudapi.Service;

import com.kaique.crudapi.Interface.ProdutoRepository;
import com.kaique.crudapi.Model.Produto;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProdutoService {
    private final ProdutoRepository repository;

    public ProdutoService(ProdutoRepository repository) {
        this.repository = repository;
    }

    public List<Produto> listaTodos(){
        return repository.findAll();
    }

    public Produto salvar(Produto produto){
        return repository.save(produto);
    }

    public void excluirProduto(Long id){
        repository.deleteById(id);
    }

    public  Produto buscarProduto(Long id){
        return repository.findById(id).orElse(null);
    }






}
