package com.criterios.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estrutura_template_id")
    private EstruturaTemplate estruturaTemplate;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "snapshot_disciplina_id")
    private SnapshotDisciplina snapshotDisciplina;
}