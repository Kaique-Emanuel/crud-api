package com.kaique.crudapi.Controller;

import com.kaique.crudapi.Interface.ProdutoRepository;
import com.kaique.crudapi.Interface.VendaRepository;
import com.kaique.crudapi.Model.Produto;
import com.kaique.crudapi.Model.Venda;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/venda")
public class VendaController {

    // controller de vendas, só pega os dados e devolve pro frontend
    private final VendaRepository repository;
    private final ProdutoRepository produtoRepository;

    public VendaController(VendaRepository repository, ProdutoRepository produtoRepository) {
        this.repository = repository;
        this.produtoRepository = produtoRepository;
    }

    @GetMapping
    public List<Venda> listarVendas() {
        // retorna tudo que tem de venda no banco
        return repository.findAll();
    }

    @GetMapping("/recentes")
    public List<Venda> listarRecentes() {
        // traz as 10 vendas mais recentes, pra dashboard
        return repository.findTop10ByOrderByDataHoraDesc();
    }

    @GetMapping("/relatorio")
    public Map<String, Object> relatorio() {
        List<Venda> vendas = repository.findAll();
        List<Produto> produtos = produtoRepository.findAll();
        LocalDate hoje = LocalDate.now();

        int vendasHoje = vendas.stream()
                .filter(v -> v.getDataHora() != null && v.getDataHora().toLocalDate().isEqual(hoje))
                .mapToInt(v -> v.getQuantidade() != null ? v.getQuantidade() : 0)
                .sum();

        double faturamentoHoje = vendas.stream()
                .filter(v -> v.getDataHora() != null && v.getDataHora().toLocalDate().isEqual(hoje))
                .mapToDouble(v -> v.getValorTotal() != null ? v.getValorTotal() : 0.0)
                .sum();

        double faturamentoTotal = vendas.stream()
                .mapToDouble(v -> v.getValorTotal() != null ? v.getValorTotal() : 0.0)
                .sum();

        String produtoMaisVendido = vendas.stream()
                .collect(Collectors.groupingBy(
                        v -> v.getProdutoNome() != null ? v.getProdutoNome() : "Produto sem nome",
                        Collectors.summingInt(v -> v.getQuantidade() != null ? v.getQuantidade() : 0)
                ))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(e -> e.getKey() + " (" + e.getValue() + ")")
                .orElse("Sem vendas");

        String pagamentoMaisUsado = vendas.stream()
                .collect(Collectors.groupingBy(Venda::getFormaPagamento, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(e -> e.getKey() != null ? e.getKey() : "Não informado")
                .orElse("Sem vendas");

        Map<String, Long> pagamentos = vendas.stream()
                .collect(Collectors.groupingBy(
                        v -> v.getFormaPagamento() != null ? v.getFormaPagamento() : "Não informado",
                        LinkedHashMap::new,
                        Collectors.counting()
                ));

        long estoqueBaixo = produtos.stream()
                .filter(p -> p.getQuantidade() != null && p.getQuantidade() < 5)
                .count();

        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("vendasHoje", vendasHoje);
        dados.put("faturamentoHoje", faturamentoHoje);
        dados.put("faturamentoTotal", faturamentoTotal);
        dados.put("produtoMaisVendido", produtoMaisVendido);
        dados.put("pagamentoMaisUsado", pagamentoMaisUsado);
        dados.put("pagamentos", pagamentos);
        dados.put("estoqueBaixo", estoqueBaixo);
        dados.put("totalVendasRegistradas", vendas.size());
        return dados;
    }
}
