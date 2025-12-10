package com.criterios.controller;

import com.criterios.dto.CapacidadeImportDTO;
import com.criterios.entities.*;
import com.criterios.repository.CapacidadeRepository;
import com.criterios.services.GerenciamentoCriterioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gestao")
@RequiredArgsConstructor
public class GestaoController {

    private final GerenciamentoCriterioService gestaoService;
    private final CapacidadeRepository capacidadeRepository;

    @PostMapping("/criterios")
    public ResponseEntity<Criterio> adicionarCriterio(
            @RequestParam Long capacidadeId,
            @RequestParam String descricao,
            @RequestParam TipoCriterio tipo) {
        return ResponseEntity.ok(gestaoService.criarCriterio(capacidadeId, descricao, tipo));
    }

    @GetMapping("/disciplinas/{disciplinaId}/validar")
    public ResponseEntity<String> validarDisciplina(@PathVariable("disciplinaId") Long disciplinaTemplateId) {
        try {
            gestaoService.validarRegraMinimoCritico(disciplinaTemplateId);
            return ResponseEntity.ok("Disciplina válida. Todas as capacidades possuem critérios críticos.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/disciplinas/{disciplinaId}/capacidades")
    // [CORRIGIDO] Usa findByDisciplinaTemplateId
    public ResponseEntity<List<Capacidade>> listarCapacidades(@PathVariable("disciplinaId") Long disciplinaTemplateId) {
        return ResponseEntity.ok(capacidadeRepository.findByDisciplinaTemplateId(disciplinaTemplateId));
    }

    @PostMapping("/disciplinas/{disciplinaId}/importar-lote")
    public ResponseEntity<String> importarLote(
            @PathVariable("disciplinaId") Long disciplinaTemplateId,
            @RequestBody List<CapacidadeImportDTO> dados) {
        gestaoService.salvarImportacaoEmMassa(disciplinaTemplateId, dados);
        return ResponseEntity.ok("Importação realizada com sucesso!");
    }

    @PostMapping("/disciplinas/{disciplinaId}/gerar-niveis")
    public ResponseEntity<String> gerarNiveis(@PathVariable("disciplinaId") Long disciplinaTemplateId) {
        try {
            gestaoService.gerarNiveisAutomaticos(disciplinaTemplateId);
            return ResponseEntity.ok("Níveis gerados com sucesso!");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro ao gerar níveis: " + e.getMessage());
        }
    }
}