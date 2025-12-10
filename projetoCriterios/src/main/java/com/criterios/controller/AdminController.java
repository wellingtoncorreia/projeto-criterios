package com.criterios.controller;

import com.criterios.dto.AlterarSenhaDTO;
import com.criterios.dto.CadastroUsuarioDTO;
import com.criterios.entities.TipoUsuario;
import com.criterios.entities.Usuario;
import com.criterios.repository.UsuarioRepository;
import com.criterios.services.AuthorizationService; // Serviço de Autenticação para Alterar Senha
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid; // Necessário para @Valid no DTO
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthorizationService authorizationService;

    // 1. Listar todos os professores (Para popular os selects de turma/admin)
    @GetMapping("/professores")
    public ResponseEntity<List<Usuario>> listarProfessores() {
        return ResponseEntity.ok(usuarioRepository.findByTipo(TipoUsuario.PROFESSOR));
    }

    // 2. Cadastrar novo usuário (Professor ou Gestor)
    @PostMapping("/usuarios")
    public ResponseEntity<?> cadastrarUsuario(@RequestBody @Valid CadastroUsuarioDTO dto) {
        
        // [VALIDAÇÃO DE NEGÓCIO] Garante que apenas usuários logados podem usar este endpoint
        String emailLogado = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario admin = usuarioRepository.findByEmail(emailLogado)
                .orElseThrow(() -> new RuntimeException("Gestor não encontrado no contexto de segurança."));

        if (admin.getTipo() != TipoUsuario.GESTOR) {
            return ResponseEntity.status(403).body("Apenas Gestores podem cadastrar novos usuários.");
        }
        
        if (usuarioRepository.findByEmail(dto.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email já cadastrado.");
        }

        Usuario novo = new Usuario();
        novo.setNome(dto.getNome());
        novo.setEmail(dto.getEmail());
        novo.setSenha(passwordEncoder.encode(dto.getSenha()));
        // Define o tipo vindo do DTO (Gestor escolhe) ou padrão PROFESSOR
        novo.setTipo(dto.getTipo() != null ? dto.getTipo() : TipoUsuario.PROFESSOR); 

        usuarioRepository.save(novo);
        return ResponseEntity.ok(novo);
    }
    
    // 3. Alterar Senha do Perfil Logado
    @PostMapping("/perfil/alterar-senha")
    public ResponseEntity<?> alterarSenha(@RequestBody @Valid AlterarSenhaDTO dto) {
        try {
            // Obtém o e-mail do usuário logado (pode ser Gestor ou Professor)
            String emailLogado = SecurityContextHolder.getContext().getAuthentication().getName();
            
            // O Service executa a validação da senha atual e a troca
            authorizationService.alterarSenha(emailLogado, dto);
            
            return ResponseEntity.ok("Senha alterada com sucesso.");
        } catch (RuntimeException e) {
            // Retorna erro de senha incorreta ou regra de negócio
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro ao alterar senha.");
        }
    }
}