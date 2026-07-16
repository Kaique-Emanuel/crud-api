package com.kaique.crudapi;

import com.kaique.crudapi.Service.UsuarioDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private UsuarioDetailsService usuarioDetailsService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/login/**", "/cadastro/**", "/assets/**", "/shared/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/usuario", "/usuario/esqueci-senha").permitAll()
                        .requestMatchers(HttpMethod.GET, "/usuario/me").authenticated()
                        .requestMatchers(HttpMethod.POST, "/usuario/foto").authenticated()
                        .requestMatchers(HttpMethod.GET, "/usuario", "/usuario/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/usuario/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/usuario/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/usuario/{id}/gerar-senha").hasRole("ADMIN")
                        .requestMatchers("/admin/**").hasRole("ADMIN") // só adm acessa
                        .anyRequest().authenticated()
                )
                .formLogin(form -> form
                        .loginPage("/login/login.html")
                        .loginProcessingUrl("/login")
                        .defaultSuccessUrl("/home/index.html", true)
                        .permitAll()
                )
                .logout(logout -> logout
                        .logoutSuccessUrl("/login/login.html")
                )
                .csrf(csrf -> csrf.disable())
                .userDetailsService(usuarioDetailsService); // ← adicionado
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
