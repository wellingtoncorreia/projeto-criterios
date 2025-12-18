package com.criterios.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Entidade que representa um Snapshot (Versão IMUTÁVEL) da estrutura de uma disciplina,
 * usada para avaliações históricas em uma turma.
 */
@Entity
@Table(name = "tb_snapshot_disciplina")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SnapshotDisciplina {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Metadados da disciplina original (copiados do Template)
    private Long disciplinaTemplateId;
    private String nomeDisciplina;
    private String siglaDisciplina;
    
    private java.time.LocalDateTime dataCriacao;
    
    @PrePersist
    public void prePersist() {
        this.dataCriacao = java.time.LocalDateTime.now();
    }
}