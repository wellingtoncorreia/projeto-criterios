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
        
        String path = request.getRequestURI();
        // Ignora rotas públicas
        if (path.contains("/api/auth/login") || path.contains("/api/auth/register") || request.getMethod().equals("OPTIONS")) {
            filterChain.doFilter(request, response);
            return;
        }

        var token = recuperarToken(request);
        
        if (token != null) {
            try {
                var email = tokenService.getSubject(token);
                var usuario = usuarioRepository.findByEmail(email).orElse(null);

                if (usuario != null) {
                    var auth = new UsernamePasswordAuthenticationToken(usuario, null, usuario.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                } else {
                    System.out.println("ALERTA SEGURANÇA: Usuário não encontrado para o email: " + email);
                }
            } catch (Exception e) {
                // Log para entender o erro (Token expirado, assinatura inválida, etc)
                System.out.println("ERRO DE TOKEN [" + path + "]: " + e.getMessage());
            }
        } else {
             // System.out.println("ALERTA: Requisição sem token para " + path);
        }
        
        filterChain.doFilter(request, response);
    }

    private String recuperarToken(HttpServletRequest request) {
        var authHeader = request.getHeader("Authorization");
        if (authHeader == null) return null;
        return authHeader.replace("Bearer ", "");
    }
}