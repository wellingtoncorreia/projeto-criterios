package com.criterios.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

/**
 * Entidade que representa a estrutura do TEMPLATE (Mutável) de uma disciplina, usada para gerenciamento.
 */
@Entity
@Table(name = "tb_estrutura_template")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EstruturaTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ID da disciplina original (link 1:1)
    private Long disciplinaTemplateId; 
    private String nomeDisciplina;
    private String siglaDisciplina;

    // Links de gerência para Capacidades e Níveis (componentes do Template)
    @OneToMany(mappedBy = "estruturaTemplate", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Capacidade> capacidades;

    @OneToMany(mappedBy = "estruturaTemplate", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<NivelAvaliacao> niveis;
}