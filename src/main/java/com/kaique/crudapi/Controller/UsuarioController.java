package com.kaique.crudapi.Controller;

import com.kaique.crudapi.Model.Usuario;
import com.kaique.crudapi.Service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/usuario")
public class UsuarioController {

    private final UsuarioService service;
    private final PasswordEncoder passwordEncoder;

    public UsuarioController(UsuarioService service, PasswordEncoder passwordEncoder) {
        this.service = service;
        this.passwordEncoder = passwordEncoder;
    }

    // Retorna o usuário da sessão atual
    @GetMapping("/me")
    public Map<String, String> usuarioLogado(Authentication auth) {
        Usuario u = service.buscarPorLogin(auth.getName());
        return Map.of(
            "login", u.getLogin(),
            "email", u.getEmail() != null ? u.getEmail() : "",
            "role",  u.getRole()  != null ? u.getRole()  : "USER"
        );
    }

    @GetMapping
    public ResponseEntity<List<Usuario>> buscarTodos(Authentication auth) {
        if (!ehAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(service.listaTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> buscarPorId(@PathVariable Long id, Authentication auth) {
        if (!ehAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        Usuario usuario = service.buscarUsuario(id);
        if (usuario == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(usuario);
    }

    @PostMapping
    public Usuario salvar(@RequestBody Usuario usuario) {
        usuario.setSenha(passwordEncoder.encode(usuario.getSenha()));
        return service.salvar(usuario);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id, Authentication auth) {
        if (!ehAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        service.excluirUsuario(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> atualizar(@PathVariable Long id, @RequestBody Usuario usuarioAtualizado, Authentication auth) {
        if (!ehAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        Usuario existente = service.buscarUsuario(id);
        if (existente == null) return ResponseEntity.notFound().build();

        existente.setLogin(usuarioAtualizado.getLogin());
        existente.setEmail(usuarioAtualizado.getEmail());

        // Só atualiza a senha se uma nova foi enviada
        if (usuarioAtualizado.getSenha() != null && !usuarioAtualizado.getSenha().isBlank()) {
            existente.setSenha(passwordEncoder.encode(usuarioAtualizado.getSenha()));
        }

        // Só atualiza o role se foi enviado
        if (usuarioAtualizado.getRole() != null && !usuarioAtualizado.getRole().isBlank()) {
            existente.setRole(usuarioAtualizado.getRole());
        }

        return ResponseEntity.ok(service.salvar(existente));
    }

    @PostMapping("/{id}/gerar-senha")
    public ResponseEntity<Map<String, String>> gerarSenhaTemporaria(@PathVariable Long id, Authentication auth) {
        if (!ehAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        Usuario usuario = service.buscarUsuario(id);
        if (usuario == null) return ResponseEntity.notFound().build();

        String senhaTemporaria = "Temp@" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        usuario.setSenha(passwordEncoder.encode(senhaTemporaria));
        usuario.setResetSolicitado(false);
        usuario.setResetSolicitadoEm(null);
        service.salvar(usuario);

        return ResponseEntity.ok(Map.of(
                "senhaTemporaria", senhaTemporaria,
                "mensagem", "Senha temporaria gerada com sucesso."
        ));
    }

    @PostMapping("/esqueci-senha")
    public ResponseEntity<Map<String, String>> esqueciSenha(@RequestBody Map<String, String> body) {
        String login = body.getOrDefault("login", "").trim();
        String email = body.getOrDefault("email", "").trim();

        if (!login.isBlank() && !email.isBlank()) {
            Usuario usuario = service.buscarPorLogin(login);
            if (usuario != null && usuario.getEmail() != null && usuario.getEmail().equalsIgnoreCase(email)) {
                usuario.setResetSolicitado(true);
                usuario.setResetSolicitadoEm(LocalDateTime.now());
                service.salvar(usuario);
            }
        }

        return ResponseEntity.ok(Map.of(
                "mensagem", "Se os dados estiverem corretos, um administrador verá sua solicitação e poderá gerar uma senha temporária."
        ));
    }

    @PostMapping("/alterar-senha")
    public ResponseEntity<Map<String, String>> alterarMinhaSenha(@RequestBody Map<String, String> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        String senhaAtual = body.getOrDefault("senhaAtual", "");
        String novaSenha = body.getOrDefault("novaSenha", "");

        if (novaSenha.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "A nova senha deve ter pelo menos 6 caracteres."));
        }

        Usuario usuario = service.buscarPorLogin(auth.getName());
        if (usuario == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        if (!passwordEncoder.matches(senhaAtual, usuario.getSenha())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensagem", "Senha atual incorreta."));
        }

        usuario.setSenha(passwordEncoder.encode(novaSenha));
        usuario.setResetSolicitado(false);
        usuario.setResetSolicitadoEm(null);
        service.salvar(usuario);

        return ResponseEntity.ok(Map.of("mensagem", "Senha alterada com sucesso."));
    }

    private boolean ehAdmin(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }
}
