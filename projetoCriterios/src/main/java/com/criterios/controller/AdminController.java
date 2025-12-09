package com.criterios.controller;

import com.criterios.dto.CadastroUsuarioDTO;
import com.criterios.entities.TipoUsuario;
import com.criterios.entities.Usuario;
import com.criterios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    // Listar todos os professores (Para popular os selects de turma)
    @GetMapping("/professores")
    public ResponseEntity<List<Usuario>> listarProfessores() {
        return ResponseEntity.ok(usuarioRepository.findByTipo(TipoUsuario.PROFESSOR));
    }

    // Cadastrar novo professor (Ação do Gestor)
    @PostMapping("/usuarios")
    public ResponseEntity<?> cadastrarUsuario(@RequestBody CadastroUsuarioDTO dto) {
        if (usuarioRepository.findByEmail(dto.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email já cadastrado.");
        }

        Usuario novo = new Usuario();
        novo.setNome(dto.getNome());
        novo.setEmail(dto.getEmail());
        novo.setSenha(passwordEncoder.encode(dto.getSenha()));
        // Define o tipo vindo do DTO ou padrão PROFESSOR
        novo.setTipo(dto.getTipo() != null ? dto.getTipo() : TipoUsuario.PROFESSOR);

        usuarioRepository.save(novo);
        return ResponseEntity.ok(novo);
    }
}