package com.criterios.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

/**
 * Entidade que representa uma Versão IMUTÁVEL (Snapshot) da estrutura de uma disciplina.
 * Uma Turma é vinculada a uma EstruturaDisciplina, garantindo que alterações futuras 
 * no template original não afetem o histórico daquela turma.
 */
@Entity
@Table(name = "tb_estrutura_disciplina")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EstruturaDisciplina {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Metadados da disciplina original para referência
    private Long disciplinaTemplateId;
    private String nomeDisciplina;
    private String siglaDisciplina;

    // [NOVO] Links de gerência para Capacidades, Critérios e Níveis (Eles são os componentes do Snapshot)
    @OneToMany(mappedBy = "estruturaDisciplina", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Capacidade> capacidades;

    @OneToMany(mappedBy = "estruturaDisciplina", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<NivelAvaliacao> niveis;
}