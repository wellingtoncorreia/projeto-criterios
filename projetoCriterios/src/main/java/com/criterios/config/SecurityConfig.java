package com.criterios.config;

import com.criterios.security.SecurityFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final SecurityFilter securityFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(req -> req
                        
                        // 1. Rotas Públicas (Autenticação e OPTIONS) - Mais permissivas
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 2. Rotas de GESTOR (Criação/Edição/Deleção de Disciplinas e Rotas de Admin)
                        .requestMatchers("/api/admin/**").hasRole("GESTOR")
                        .requestMatchers(HttpMethod.POST, "/api/disciplinas").hasRole("GESTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/disciplinas/**").hasRole("GESTOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/disciplinas/**").hasRole("GESTOR")
                        
                        // 3. Rotas de Autenticado (GET e Operações Gerais)
                        .requestMatchers(HttpMethod.GET, "/api/disciplinas/**").authenticated() 
                        
                        // Rotas de Gestão Geral (CRUD de Turmas, Alunos, Avaliações, Arquivos, GestaoController)
                        .requestMatchers("/api/turmas/**").authenticated()
                        .requestMatchers("/api/alunos/**").authenticated()
                        .requestMatchers("/api/avaliacoes/**").authenticated()
                        .requestMatchers("/api/arquivos/**").authenticated()
                        .requestMatchers("/api/gestao/**").authenticated() 

                        // O que sobrar, exige autenticação (redundante, mas seguro)
                        .anyRequest().authenticated()
                )
                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}