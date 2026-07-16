package com.kaique.crudapi.Service;

import com.kaique.crudapi.Interface.ProdutoRepository;
import com.kaique.crudapi.Interface.VendaRepository;
import com.kaique.crudapi.Model.Produto;
import com.kaique.crudapi.Model.Venda;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
// service de produto
public class ProdutoService {
    private final ProdutoRepository repository;
    private final VendaRepository vendaRepository;

    public ProdutoService(ProdutoRepository repository, VendaRepository vendaRepository) {
        this.repository = repository;
        this.vendaRepository = vendaRepository;
    }

    public List<Produto> listaTodos(){
        return repository.findByAtivoTrue();
    }

    public List<Produto> listarDesativados(){
        return repository.findByAtivoFalse();
    }

    public Produto salvar(Produto produto){
        return repository.save(produto);
    }

    // deleta produto por id
    public boolean excluirProduto(Long id){
        try {
            repository.deleteById(id);
            return true;
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            desativarProduto(id);
            return false;
        }
    }

    public void desativarProduto(Long id) {
        Produto produto = buscarProduto(id);
        if (produto != null) {
            produto.setAtivo(false);
            repository.save(produto);
        }
    }

    public Produto reativarProduto(Long id) {
        Produto produto = repository.findById(id).orElse(null);
        if (produto != null) {
            produto.setAtivo(true);
            return repository.save(produto);
        }
        return null;
    }

    public  Produto buscarProduto(Long id){
        return repository.findById(id).orElse(null);
    }

    @Transactional
    public Map<String, Object> registrarVenda(Produto produto, Venda venda) {
        Produto produtoSalvo = repository.save(produto);
        venda.setProduto(produtoSalvo);
        Venda vendaSalva = vendaRepository.save(venda);
        return Map.of("produto", produtoSalvo, "venda", vendaSalva);
    }
}
