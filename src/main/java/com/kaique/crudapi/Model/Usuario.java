package com.kaique.crudapi.Model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
// modelo de usuario
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String login;
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String senha;

    private Boolean resetSolicitado = false;
    private LocalDateTime resetSolicitadoEm;

    @Column
    private String role = "USER"; // ← aqui

    public Long getId()               { return id; }
    public void setId(Long id)        { this.id = id; }
    public String getLogin()          { return login; }
    public void setLogin(String l)    { this.login = l; }
    public String getEmail()          { return email; }
    public void setEmail(String e)    { this.email = e; }
    public String getSenha()          { return senha; }
    public void setSenha(String s)    { this.senha = s; }
    public Boolean getResetSolicitado() { return resetSolicitado; }
    public void setResetSolicitado(Boolean r) { this.resetSolicitado = r; }
    public LocalDateTime getResetSolicitadoEm() { return resetSolicitadoEm; }
    public void setResetSolicitadoEm(LocalDateTime e) { this.resetSolicitadoEm = e; }
    public String getRole()           { return role; }
    public void setRole(String r)     { this.role = r; }
}
