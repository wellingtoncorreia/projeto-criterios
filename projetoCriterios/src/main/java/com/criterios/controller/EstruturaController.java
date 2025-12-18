package com.criterios.controller;

import com.criterios.entities.Capacidade;
import com.criterios.repository.CapacidadeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/estrutura") // Corresponde à chamada do Frontend
@RequiredArgsConstructor
public class EstruturaController {

    private final CapacidadeRepository capacidadeRepository;

    @GetMapping("/{snapshotId}/capacidades")
    public ResponseEntity<List<Capacidade>> listarCapacidadesSnapshot(@PathVariable Long snapshotId) {
        // Usa o método que já traz os critérios juntos (JOIN FETCH)
        // Isso é essencial para evitar erro de "LazyInitialization" e garantir que a árvore venha completa.
        List<Capacidade> capacidades = capacidadeRepository.findBySnapshotDisciplinaIdFetchCriterios(snapshotId);
        
        if (capacidades.isEmpty()) {
            // Opcional: Tenta buscar sem o fetch se a lista estiver vazia, ou retorna vazio mesmo
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        
        return ResponseEntity.ok(capacidades);
    }
}