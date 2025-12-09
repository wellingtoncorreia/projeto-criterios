package com.criterios.controller;

import com.criterios.entities.Aluno;
import com.criterios.entities.Turma;
import com.criterios.repository.AlunoRepository;
import com.criterios.repository.TurmaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// REMOVIDO: import java.util.List;

@RestController
@RequestMapping("/api/alunos")
@RequiredArgsConstructor
public class AlunoController {
    // ... restante do código permanece igual
    
    private final AlunoRepository alunoRepository;
    private final TurmaRepository turmaRepository;

    @PostMapping
    public ResponseEntity<Aluno> criarAluno(@RequestBody Aluno aluno) {
        if (aluno.getTurma() == null || aluno.getTurma().getId() == null) {
            return ResponseEntity.badRequest().build();
        }
        
        Turma turma = turmaRepository.findById(aluno.getTurma().getId())
                .orElseThrow(() -> new RuntimeException("Turma não encontrada"));
        
        aluno.setTurma(turma);
        return ResponseEntity.ok(alunoRepository.save(aluno));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Aluno> atualizarAluno(@PathVariable Long id, @RequestBody Aluno dadosAtualizados) {
        return alunoRepository.findById(id).map(aluno -> {
            aluno.setNome(dadosAtualizados.getNome());
            return ResponseEntity.ok(alunoRepository.save(aluno));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarAluno(@PathVariable Long id) {
        if (!alunoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        alunoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Aluno> buscarPorId(@PathVariable Long id) {
        return alunoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}