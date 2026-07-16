package com.kaique.crudapi;

import com.kaique.crudapi.Interface.ProdutoRepository;
import com.kaique.crudapi.Interface.UsuarioRepository;
import com.kaique.crudapi.Model.Produto;
import com.kaique.crudapi.Model.Usuario;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class CrudApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(CrudApiApplication.class, args);
	}

	@Bean
	public CommandLineRunner criarAdminPadrao(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			Usuario adminExistente = usuarioRepository.findByLogin("admin");
			if (adminExistente == null) {
				Usuario admin = new Usuario();
				admin.setLogin("admin");
				admin.setEmail("admin@sistema.com");
				admin.setSenha(passwordEncoder.encode("admin123"));
				admin.setRole("ADMIN");
				usuarioRepository.save(admin);
			}
		};
	}

	@Bean
	public CommandLineRunner criarProdutosExemplo(ProdutoRepository produtoRepository) {
		return args -> {
			if (produtoRepository.count() > 0) {
				return;
			}

			Produto produto1 = new Produto();
			produto1.setNome("Caneca Térmica 300ml");
			produto1.setValor(29.90);
			produto1.setQuantidade(12);
			produto1.setVendas(4);
			produtoRepository.save(produto1);

			Produto produto2 = new Produto();
			produto2.setNome("Camiseta Básica P");
			produto2.setValor(49.90);
			produto2.setQuantidade(8);
			produto2.setVendas(6);
			produtoRepository.save(produto2);

			Produto produto3 = new Produto();
			produto3.setNome("Fone de Ouvido Bluetooth");
			produto3.setValor(189.90);
			produto3.setQuantidade(5);
			produto3.setVendas(2);
			produtoRepository.save(produto3);

			Produto produto4 = new Produto();
			produto4.setNome("Mochila Executiva");
			produto4.setValor(159.90);
			produto4.setQuantidade(7);
			produto4.setVendas(3);
			produtoRepository.save(produto4);

			Produto produto5 = new Produto();
			produto5.setNome("Garrafa de Água 500ml");
			produto5.setValor(24.90);
			produto5.setQuantidade(15);
			produto5.setVendas(8);
			produtoRepository.save(produto5);
		};
	}

}
