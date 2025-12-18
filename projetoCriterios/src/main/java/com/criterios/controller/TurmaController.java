package com.criterios.controller;

import com.criterios.dto.TurmaDTO;
import com.criterios.dto.TurmaResponseDTO;
import com.criterios.entities.Aluno;
import com.criterios.entities.Disciplina;
import com.criterios.entities.Turma;
import com.criterios.entities.Usuario;
import com.criterios.repository.AlunoRepository;
import com.criterios.repository.DisciplinaRepository;
import com.criterios.repository.TurmaRepository;
import com.criterios.repository.UsuarioRepository;
import com.criterios.services.TurmaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/turmas")
@RequiredArgsConstructor
public class TurmaController {

    private final TurmaService turmaService;
    private final TurmaRepository turmaRepository;
    private final UsuarioRepository usuarioRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final AlunoRepository alunoRepository;

    // --- ENDPOINTS BÁSICOS (CRUD) ---

    @GetMapping
    public ResponseEntity<List<TurmaResponseDTO>> listarTurmas() {
        String emailLogado = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = usuarioRepository.findByEmail(emailLogado)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        return ResponseEntity.ok(turmaService.listarTurmasPorUsuario(usuario));
    }

    @PostMapping
    public ResponseEntity<?> criarTurma(@RequestBody TurmaDTO dto) {
        try {
            Turma turma = turmaService.criarTurma(dto);
            return ResponseEntity.ok(TurmaService.toResponseDTO(turma));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<TurmaResponseDTO> buscarTurma(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(turmaService.buscarTurmaPorId(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // [ADICIONADO] Endpoint PUT para atualizar dados da turma (nome, semestre, professores)
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarTurma(@PathVariable Long id, @RequestBody TurmaDTO dto) {
        try {
            Turma turma = turmaService.atualizarTurma(id, dto);
            return ResponseEntity.ok(TurmaService.toResponseDTO(turma));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarTurma(@PathVariable Long id) {
        if (!turmaRepository.existsById(id)) return ResponseEntity.notFound().build();
        turmaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // --- ENDPOINTS DE RECURSOS DA TURMA (Disciplinas e Alunos) ---

    @GetMapping("/{id}/disciplinas")
    public ResponseEntity<List<Disciplina>> listarDisciplinasPorTurma(@PathVariable Long id) {
        Turma turma = turmaRepository.findById(id).orElse(null);
        
        if (turma == null) {
            return ResponseEntity.notFound().build();
        }

        Integer termo = turma.getTermoAtual();
        if (termo == null) termo = 1;

        // Busca disciplinas baseadas no termo da turma
        List<Disciplina> disciplinas = disciplinaRepository.findByTermoOrAnual(termo);
        return ResponseEntity.ok(disciplinas);
    }

    @GetMapping("/{id}/alunos")
    public ResponseEntity<List<Aluno>> listarAlunosPorTurma(@PathVariable Long id) {
        return ResponseEntity.ok(alunoRepository.findByTurmaId(id));
    }

    // --- ENDPOINTS DE SNAPSHOT (Gerar e Excluir) ---
    
    @PostMapping("/{id}/snapshot/{templateId}")
    public ResponseEntity<TurmaResponseDTO> gerarSnapshot(
            @PathVariable Long id, 
            @PathVariable Long templateId) {
        
        Turma turmaAtualizada = turmaService.gerarSnapshotManual(id, templateId);
        return ResponseEntity.ok(TurmaService.toResponseDTO(turmaAtualizada));
    }

    // [ADICIONADO] Endpoint DELETE para remover o snapshot e permitir trocar a disciplina
    // Corrige o bug de ficar preso numa disciplina errada selecionada.
    @DeleteMapping("/{id}/snapshot")
    public ResponseEntity<Void> excluirSnapshotTurma(@PathVariable Long id) {
        Turma turma = turmaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Turma não encontrada"));
        
        // Remove as referências para permitir nova vinculação
        turma.setSnapshotDisciplina(null);
        turma.setDisciplinaId(null); 
        turmaRepository.save(turma);
        
        return ResponseEntity.noContent().build();
    }
}