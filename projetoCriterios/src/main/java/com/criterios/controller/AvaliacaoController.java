package com.criterios.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.criterios.dto.AvaliacaoDTO;
import com.criterios.dto.ResultadoBoletimDTO;
import com.criterios.entities.Avaliacao;
import com.criterios.services.AvaliacaoServices;
import com.criterios.repository.AvaliacaoRepository; 
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/avaliacoes")
@RequiredArgsConstructor
public class AvaliacaoController {

    private final AvaliacaoServices avaliacaoServices;
    private final AvaliacaoRepository avaliacaoRepository;

    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody @Valid AvaliacaoDTO dto) {
        try {
            log.info("Registrando avaliação para aluno {}, critério {}", dto.getAlunoId(), dto.getCriterioId());
            Avaliacao resultado = avaliacaoServices.registrarAvaliacao(dto);
            return ResponseEntity.ok(resultado);
        } catch (RuntimeException e) {
            log.error("Erro ao registrar avaliação: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Erro inesperado ao registrar avaliação", e);
            return ResponseEntity.internalServerError().body("Erro ao salvar avaliação. Tente novamente.");
        }
    }

    @GetMapping
    public ResponseEntity<List<Avaliacao>> listarAvaliacoes(
            @RequestParam Long alunoId, 
            @RequestParam Long disciplinaId) {
        try {
            return ResponseEntity.ok(avaliacaoRepository.findByAlunoAndDisciplina(alunoId, disciplinaId));
        } catch (Exception e) {
            log.error("Erro ao listar avaliações: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/boletim")
    public ResponseEntity<?> consultarBoletim(
            @RequestParam Long alunoId, 
            @RequestParam Long disciplinaId) {
        try {
            return ResponseEntity.ok(avaliacaoServices.calcularNivelAluno(alunoId, disciplinaId));
        } catch (Exception e) {
            log.error("Erro ao calcular boletim: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/boletim/turma/{turmaId}")
    public ResponseEntity<?> consultarBoletimTurma(
            @PathVariable Long turmaId,
            @RequestParam Long disciplinaId) {
        try {
            return ResponseEntity.ok(avaliacaoServices.gerarBoletimTurma(turmaId, disciplinaId));
        } catch (Exception e) {
            log.error("Erro ao gerar boletim da turma: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
    
    // [NOVO ENDPOINT] Fechar Avaliação Individual
    @PostMapping("/fechar")
    public ResponseEntity<?> fecharAvaliacao(
            @RequestParam Long alunoId,
            @RequestParam Long disciplinaId) {
        try {
            ResultadoBoletimDTO resultado = avaliacaoServices.finalizarAvaliacao(alunoId, disciplinaId);
            return ResponseEntity.ok(resultado);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Erro ao fechar avaliação", e);
            return ResponseEntity.internalServerError().body("Erro ao fechar avaliação.");
        }
    }

    // [NOVO ENDPOINT] Fechar Avaliação da Turma INTEIRA
    @PostMapping("/fechar/turma/{turmaId}")
    public ResponseEntity<?> fecharAvaliacaoTurma(
            @PathVariable Long turmaId,
            @RequestParam Long disciplinaId) {
        try {
            List<ResultadoBoletimDTO> resultados = avaliacaoServices.finalizarAvaliacaoTurma(turmaId, disciplinaId);
            return ResponseEntity.ok(resultados);
        } catch (RuntimeException e) {
            log.error("Erro ao fechar avaliação da turma: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Erro inesperado ao fechar avaliação da turma", e);
            return ResponseEntity.internalServerError().body("Erro ao fechar avaliação da turma.");
        }
    }


    // [NOVO ENDPOINT] Reabrir Avaliação
    @PostMapping("/reabrir")
    public ResponseEntity<?> reabrirAvaliacao(
            @RequestParam Long alunoId,
            @RequestParam Long disciplinaId) {
        try {
            avaliacaoServices.reabrirAvaliacao(alunoId, disciplinaId);
            return ResponseEntity.ok("Avaliação reaberta com sucesso.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Erro ao reabrir avaliação", e);
            return ResponseEntity.internalServerError().body("Erro ao reabrir avaliação.");
        }
    }
}