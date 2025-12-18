package com.criterios.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "tb_nivel_avaliacao")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NivelAvaliacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer nivel;

    @Column(nullable = false)
    private Integer minCriticos;

    @Column(nullable = false)
    private Integer minDesejaveis;

    // [CORRIGIDO] Adicionando campos necessários para o relatório e snapshot
    private String sigla;
    private String descricao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estrutura_template_id")
    private EstruturaTemplate estruturaTemplate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "snapshot_disciplina_id")
    private SnapshotDisciplina snapshotDisciplina;
}