package com.criterios.controller;

import com.criterios.dto.LoginDTO;
import com.criterios.entities.Usuario;
import com.criterios.entities.TipoUsuario;
import com.criterios.repository.UsuarioRepository;
import com.criterios.security.TokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager manager;
    private final TokenService tokenService;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<Object> login(@RequestBody LoginDTO dados) {
        try {
            var tokenAuth = new UsernamePasswordAuthenticationToken(dados.getEmail(), dados.getSenha());
            var auth = manager.authenticate(tokenAuth);
            Usuario usuario = (Usuario) auth.getPrincipal();
            var token = tokenService.gerarToken(usuario);
            
            return ResponseEntity.ok(Map.of(
                "token", token, 
                "nome", usuario.getNome(),
                "tipo", usuario.getTipo() // [NOVO] Retorna o tipo (GESTOR/PROFESSOR)
            ));
        } catch (Exception e) {
            return ResponseEntity.status(403).body("Erro de autenticação");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<Object> registrar(@RequestBody Usuario usuario) {
        if (usuarioRepository.findByEmail(usuario.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email já cadastrado");
        }
        usuario.setSenha(passwordEncoder.encode(usuario.getSenha()));
        // Se não vier tipo, define padrão PROFESSOR (segurança)
        if (usuario.getTipo() == null) usuario.setTipo(TipoUsuario.PROFESSOR);
        
        usuarioRepository.save(usuario);
        return ResponseEntity.ok().build();
    }
}