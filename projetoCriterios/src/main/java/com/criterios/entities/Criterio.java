// projetoCriterios/src/main/java/com/criterios/entities/Criterio.java
package com.criterios.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "tb_criterio")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Criterio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoCriterio tipo; 

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capacidade_id", nullable = false)
    private Capacidade capacidade;
    
    // Método auxiliar para pegar o ID do Snapshot (o novo "dono")
    public Long getSnapshotDisciplinaId() {
        return capacidade != null && capacidade.getSnapshotDisciplina() != null 
               ? capacidade.getSnapshotDisciplina().getId() 
               : null;
    }
}