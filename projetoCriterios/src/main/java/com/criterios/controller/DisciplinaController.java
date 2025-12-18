package com.criterios.controller;

import com.criterios.entities.*;
import com.criterios.repository.*;
import com.criterios.services.SnapshotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/disciplinas")
@RequiredArgsConstructor
public class DisciplinaController {

    private final DisciplinaRepository disciplinaRepository;
    private final CapacidadeRepository capacidadeRepository;
    private final CriterioRepository criterioRepository;
    private final NivelAvaliacaoRepository nivelRepository;
    private final SnapshotService snapshotService;

    // --- CRUD ---

    @GetMapping
    public ResponseEntity<List<Disciplina>> listarDisciplinas() {
        return ResponseEntity.ok(disciplinaRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Disciplina> criarDisciplina(@RequestBody Disciplina disciplina) {
        return ResponseEntity.ok(disciplinaRepository.save(disciplina));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Disciplina> buscarDisciplinaPorId(@PathVariable Long id) {
        return disciplinaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarDisciplina(@PathVariable Long id) {
        if (!disciplinaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        disciplinaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // --- ESTRUTURA (Lógica Híbrida: Tenta Snapshot, senão Template) ---

    @GetMapping("/{id}/capacidades")
    public ResponseEntity<List<Capacidade>> listarCapacidades(@PathVariable("id") Long id) {
        List<Capacidade> capacidades = capacidadeRepository.findByDisciplinaTemplateId(id);
        return ResponseEntity.ok(capacidades);
    }

    @GetMapping("/{id}/criterios")
    public ResponseEntity<List<Criterio>> listarCriterios(@PathVariable("id") Long id) {
        List<Criterio> criterios = criterioRepository.findByDisciplinaTemplateId(id);
        return ResponseEntity.ok(criterios);
    }

    @GetMapping("/{id}/niveis")
    public ResponseEntity<List<NivelAvaliacao>> listarNiveis(@PathVariable("id") Long id) {
        List<NivelAvaliacao> niveis = nivelRepository.findByDisciplinaTemplateId(id);
        return ResponseEntity.ok(niveis);
    }
    
    @GetMapping("/{id}/snapshot-status")
    public ResponseEntity<Long> buscarSnapshotIdPorTemplate(@PathVariable("id") Long disciplinaTemplateId) {
        SnapshotDisciplina snapshot = snapshotService.buscarSnapshotPorDisciplinaTemplateId(disciplinaTemplateId);
        if (snapshot != null) {
            return ResponseEntity.ok(snapshot.getId());
        }
        return ResponseEntity.notFound().build(); 
    }

    @GetMapping("/niveis/snapshot/{snapshotId}")
    public ResponseEntity<List<NivelAvaliacao>> listarNiveisPorSnapshotDesc(@PathVariable Long snapshotId) {
        // ALTERADO: De 'OrderByNivelAsc' para 'OrderByNivelDesc'
        List<NivelAvaliacao> niveis = nivelRepository.findBySnapshotDisciplinaIdOrderByNivelDesc(snapshotId);
        return ResponseEntity.ok(niveis != null ? niveis : new ArrayList<>());
    }
}