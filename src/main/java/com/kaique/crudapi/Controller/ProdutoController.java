package com.kaique.crudapi.Controller;


import com.kaique.crudapi.Model.Produto;
import com.kaique.crudapi.Service.ProdutoService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/produto")
public class ProdutoController {
    private final ProdutoService service;

    public ProdutoController(ProdutoService service) {
        this.service = service;
    }

    @GetMapping
    public List<Produto> buscarProdutos(){
        return  service.listaTodos();
    }

    @PostMapping
    public  Produto salvarNovoPorduto(@RequestBody Produto produto){
        return service.salvar(produto);
    }

    @GetMapping("/{id}")
    public Produto buscarProdutoId(@PathVariable Long id){
        return service.buscarProduto(id);
    }

    @DeleteMapping("/{id}")
    public void deletarProduto(@PathVariable Long id){
        service.excluirProduto(id);
    }

@PutMapping("/{id}")
    public Produto atualizarProduto(@PathVariable Long id, @RequestBody Produto produtoAtualizado){
        Produto existeproduto = service.buscarProduto(id);

        if(existeproduto == null) return null;


        existeproduto.setNome(produtoAtualizado.getNome());
        existeproduto.setValor(produtoAtualizado.getValor());
        existeproduto.setQuantidade(produtoAtualizado.getQuantidade());

        
        return service.salvar(existeproduto);
    }



}
