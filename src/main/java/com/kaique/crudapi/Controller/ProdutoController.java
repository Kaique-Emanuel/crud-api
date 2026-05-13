package com.kaique.crudapi.Controller;


import com.kaique.crudapi.Interface.VendaRepository;
import com.kaique.crudapi.Model.Produto;
import com.kaique.crudapi.Model.Venda;
import com.kaique.crudapi.Service.ProdutoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/produto")
// controller de produto
public class ProdutoController {
    private final ProdutoService service;
    private final VendaRepository vendaRepository;

    public ProdutoController(ProdutoService service, VendaRepository vendaRepository) {
        this.service = service;
        this.vendaRepository = vendaRepository;
    }

    @GetMapping
    // lista todos os produtos
    public List<Produto> buscarProdutos(){
        return  service.listaTodos();
    }

    @PostMapping
    // cadastra novo produto
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
        if (existeproduto.getVendas() == null) existeproduto.setVendas(0);

        
        return service.salvar(existeproduto);
    }

    @PostMapping("/{id}/vender")
    // faz a venda e atualiza estoque
    public ResponseEntity<?> venderProduto(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Produto produto = service.buscarProduto(id);
        if (produto == null) return ResponseEntity.notFound().build();

        int quantidadeVendida = parseQuantidade(body.get("quantidade"));
        String formaPagamento = String.valueOf(body.getOrDefault("formaPagamento", "")).trim();

        if (quantidadeVendida <= 0) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "Informe uma quantidade valida para venda."));
        }

        if (formaPagamento.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "Selecione a forma de pagamento."));
        }

        int estoqueAtual = produto.getQuantidade() != null ? produto.getQuantidade() : 0;
        if (estoqueAtual < quantidadeVendida) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensagem", "Estoque insuficiente para essa venda."));
        }

        int vendasAtuais = produto.getVendas() != null ? produto.getVendas() : 0;
        produto.setQuantidade(estoqueAtual - quantidadeVendida);
        produto.setVendas(vendasAtuais + quantidadeVendida);

        Produto produtoSalvo = service.salvar(produto);

        Venda venda = new Venda();
        venda.setProduto(produtoSalvo);
        venda.setProdutoNome(produtoSalvo.getNome());
        venda.setQuantidade(quantidadeVendida);
        venda.setValorUnitario(produtoSalvo.getValor() != null ? produtoSalvo.getValor() : 0.0);
        venda.setValorTotal(venda.getValorUnitario() * quantidadeVendida);
        venda.setFormaPagamento(formaPagamento);
        venda.setDataHora(LocalDateTime.now());

        return ResponseEntity.ok(Map.of(
                "produto", produtoSalvo,
                "venda", vendaRepository.save(venda)
        ));
    }

    @PostMapping("/{id}/entrada")
    // adiciona itens ao estoque
    public ResponseEntity<?> entradaEstoque(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Produto produto = service.buscarProduto(id);
        if (produto == null) return ResponseEntity.notFound().build();

        int quantidadeEntrada = parseQuantidade(body.get("quantidade"));
        if (quantidadeEntrada <= 0) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "Informe uma quantidade valida para entrada."));
        }

        int estoqueAtual = produto.getQuantidade() != null ? produto.getQuantidade() : 0;
        produto.setQuantidade(estoqueAtual + quantidadeEntrada);

        return ResponseEntity.ok(service.salvar(produto));
    }

    private int parseQuantidade(Object valor) {
        if (valor instanceof Number numero) return numero.intValue();
        try {
            return Integer.parseInt(String.valueOf(valor));
        } catch (RuntimeException ex) {
            return 0;
        }
    }

}
