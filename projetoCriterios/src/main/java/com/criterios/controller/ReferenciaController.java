package com.criterios.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.criterios.dto.TurmaDTO; 
import com.criterios.dto.TurmaResponseDTO; // [IMPORTANTE]
import com.criterios.entities.*;
import com.criterios.repository.*;
import com.criterios.services.TurmaService; // [IMPORTANTE]

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

    // --- ESTRUTURA ---

    @GetMapping("/disciplinas/{disciplinaId}/capacidades")
    public ResponseEntity<List<Capacidade>> listarCapacidadesPorDisciplina(@PathVariable Long disciplinaId) {
        return ResponseEntity.ok(capacidadeRepository.findByDisciplinaId(disciplinaId));
    }

    @GetMapping("/disciplinas/{disciplinaId}/criterios")
    public ResponseEntity<List<Criterio>> listarCriteriosPorDisciplina(@PathVariable Long disciplinaId) {
        return ResponseEntity.ok(criterioRepository.findByDisciplinaId(disciplinaId));
    }

    @GetMapping("/disciplinas/{disciplinaId}/niveis")
    public ResponseEntity<List<NivelAvaliacao>> listarNiveis(@PathVariable Long disciplinaId) {
        return ResponseEntity.ok(nivelRepository.findByDisciplinaIdOrderByNivelDesc(disciplinaId));
    }

    // --- TURMA (LÓGICA NOVA COM SERVICE) ---

    // [CORRIGIDO] Retorna DTOs de Turma (Lista)
    @GetMapping("/turmas")
    public ResponseEntity<List<TurmaResponseDTO>> listarTurmas() {
        String emailLogado = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = usuarioRepository.findByEmail(emailLogado)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        return ResponseEntity.ok(turmaService.listarTurmasPorUsuario(usuario));
    }
    
    // [CORRIGIDO] Criação de Turma
    @PostMapping("/turmas")
    public ResponseEntity<?> criarTurma(@RequestBody TurmaDTO dto) {
        try {
            Turma turma = turmaService.criarTurma(dto);
            // Retorna o DTO da turma criada para o frontend
            return ResponseEntity.ok(TurmaService.toResponseDTO(turma));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // [CORRIGIDO] Atualização de Turma
    @PutMapping("/turmas/{id}")
    public ResponseEntity<?> atualizarTurma(@PathVariable Long id, @RequestBody TurmaDTO dto) {
        try {
            Turma turma = turmaService.atualizarTurma(id, dto);
            // Retorna o DTO da turma atualizada
            return ResponseEntity.ok(TurmaService.toResponseDTO(turma));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // [CORRIGIDO] Busca de Turma por ID
    @GetMapping("/turmas/{id}")
    public ResponseEntity<TurmaResponseDTO> buscarTurma(@PathVariable Long id) {
        return turmaRepository.findById(id)
                .map(TurmaService::toResponseDTO) // Mapeia o resultado encontrado para DTO
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // [NOVO] Exclusão de Turma por ID (com remoção em cascata garantida pelo entity)
    @DeleteMapping("/turmas/{id}")
    public ResponseEntity<Void> deletarTurma(@PathVariable Long id) {
        if (!turmaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        turmaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
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
        if(capacidade.getDisciplina() == null || capacidade.getDisciplina().getId() == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(capacidadeRepository.save(capacidade));
    }
}