package com.criterios.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.criterios.dto.TurmaDTO; 
import com.criterios.dto.TurmaResponseDTO;
import com.criterios.entities.*;
import com.criterios.repository.*;
import com.criterios.services.TurmaService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReferenciaController {

    private final TurmaRepository turmaRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final AlunoRepository alunoRepository;
    private final CriterioRepository criterioRepository;
    private final NivelAvaliacaoRepository nivelRepository;
    private final CapacidadeRepository capacidadeRepository;
    private final UsuarioRepository usuarioRepository;
    private final TurmaService turmaService; 

    // --- DISCIPLINA ---

    @GetMapping("/disciplinas")
    public ResponseEntity<List<Disciplina>> listarDisciplinas() {
        return ResponseEntity.ok(disciplinaRepository.findAll());
    }

    @PostMapping("/disciplinas")
    public ResponseEntity<Disciplina> criarDisciplina(@RequestBody Disciplina disciplina) {
        return ResponseEntity.ok(disciplinaRepository.save(disciplina));
    }
    
    @GetMapping("/disciplinas/{disciplinaId}")
    public ResponseEntity<Disciplina> buscarDisciplinaPorId(@PathVariable Long disciplinaId) {
        return disciplinaRepository.findById(disciplinaId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/disciplinas/{id}")
    public ResponseEntity<Void> deletarDisciplina(@PathVariable Long id) {
        if (!disciplinaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        disciplinaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // --- ESTRUTURA (Template) ---

    @GetMapping("/disciplinas/{disciplinaId}/capacidades")
    // [CORRIGIDO] Usa findByDisciplinaTemplateId
    public ResponseEntity<List<Capacidade>> listarCapacidadesPorDisciplina(@PathVariable("disciplinaId") Long disciplinaTemplateId) {
        return ResponseEntity.ok(capacidadeRepository.findByDisciplinaTemplateId(disciplinaTemplateId));
    }

    @GetMapping("/disciplinas/{disciplinaId}/criterios")
    // [CORRIGIDO] Usa findByDisciplinaTemplateId
    public ResponseEntity<List<Criterio>> listarCriteriosPorDisciplina(@PathVariable("disciplinaId") Long disciplinaTemplateId) {
        return ResponseEntity.ok(criterioRepository.findByDisciplinaTemplateId(disciplinaTemplateId));
    }

    @GetMapping("/disciplinas/{disciplinaId}/niveis")
    // [CORRIGIDO] Usa findByDisciplinaTemplateId
    public ResponseEntity<List<NivelAvaliacao>> listarNiveis(@PathVariable("disciplinaId") Long disciplinaTemplateId) {
        return ResponseEntity.ok(nivelRepository.findByDisciplinaTemplateId(disciplinaTemplateId));
    }

    // --- TURMA ---

    @GetMapping("/turmas")
    public ResponseEntity<List<TurmaResponseDTO>> listarTurmas() {
        String emailLogado = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = usuarioRepository.findByEmail(emailLogado)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        return ResponseEntity.ok(turmaService.listarTurmasPorUsuario(usuario));
    }
    
    @PostMapping("/turmas")
    public ResponseEntity<?> criarTurma(@RequestBody TurmaDTO dto) {
        try {
            Turma turma = turmaService.criarTurma(dto);
            return ResponseEntity.ok(TurmaService.toResponseDTO(turma));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/turmas/{id}")
    public ResponseEntity<?> atualizarTurma(@PathVariable Long id, @RequestBody TurmaDTO dto) {
        try {
            Turma turma = turmaService.atualizarTurma(id, dto);
            return ResponseEntity.ok(TurmaService.toResponseDTO(turma));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/turmas/{id}")
    public ResponseEntity<Void> deletarTurma(@PathVariable Long id) {
        if (!turmaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        turmaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/turmas/{id}")
    public ResponseEntity<TurmaResponseDTO> buscarTurma(@PathVariable Long id) {
        return turmaRepository.findById(id)
                .map(TurmaService::toResponseDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/turmas/{turmaId}/disciplinas")
    public ResponseEntity<List<Disciplina>> listarDisciplinasPorTurma(@PathVariable Long turmaId) {
        return turmaRepository.findById(turmaId)
            .map(turma -> {
                Integer termo = turma.getTermoAtual();
                if (termo == null) termo = 1;
                return ResponseEntity.ok(disciplinaRepository.findByTermoOrAnual(termo));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/turmas/{turmaId}/alunos")
    public ResponseEntity<List<Aluno>> listarAlunosPorTurma(@PathVariable Long turmaId) {
        return ResponseEntity.ok(alunoRepository.findByTurmaId(turmaId));
    }
    
    // --- CAPACIDADE ---
    
    @PostMapping("/capacidades")
    public ResponseEntity<Capacidade> criarCapacidade(@RequestBody Capacidade capacidade) {
        // O ID da EstruturaDisciplina (Template) deve ser fornecido
        if(capacidade.getEstruturaDisciplina() == null || capacidade.getEstruturaDisciplina().getId() == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(capacidadeRepository.save(capacidade));
    }
    
    // --- ESTRUTURA (Snapshot) ---
    
    @GetMapping("/estrutura/{estruturaId}/capacidades") // <-- NOVO ENDPOINT
    public ResponseEntity<List<Capacidade>> listarCapacidadesPorEstrutura(@PathVariable("estruturaId") Long estruturaDisciplinaId) {
        // Usa o repositório para buscar capacidades pelo ID do Snapshot (EstruturaDisciplina)
        return ResponseEntity.ok(capacidadeRepository.findByEstruturaDisciplinaId(estruturaDisciplinaId)); 
    }
}