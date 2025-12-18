package com.criterios.security;

import com.criterios.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class SecurityFilter extends OncePerRequestFilter {

    private final TokenService tokenService;
    private final UsuarioRepository usuarioRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        // 1. Recupera o token do cabeçalho
        var token = recuperarToken(request);
        
        // 2. Se o token existir, tenta autenticar o usuário
        if (token != null) {
            try {
                var email = tokenService.getSubject(token);
                var usuario = usuarioRepository.findByEmail(email).orElse(null);

                if (usuario != null) {
                    // Cria o objeto de autenticação com as authorities (roles) do usuário
                    var auth = new UsernamePasswordAuthenticationToken(usuario, null, usuario.getAuthorities());
                    
                    // Define o usuário como autenticado no contexto do Spring Security
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception e) {
                // Se o token for inválido ou expirado, apenas logamos o erro.
                // Não bloqueamos aqui; deixamos o SecurityConfig decidir se a rota exige login.
                System.err.println("Erro na validação do Token: " + e.getMessage());
            }
        }
        
        // 3. CONTINUA A EXECUÇÃO (Crucial para não dar 403 em rotas permitidas)
        filterChain.doFilter(request, response);
    }

    private String recuperarToken(HttpServletRequest request) {
        var authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        return authHeader.replace("Bearer ", "");
    }
}