package com.criterios.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
public class Disciplina {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String sigla;

    @Enumerated(EnumType.STRING)
    private Periodicidade periodicidade;

    private Integer termo;

    // [ATUALIZADO] Apaga todas as capacidades (e seus critérios)
    @OneToMany(mappedBy = "disciplina", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Capacidade> capacidades;

    // [ATUALIZADO] Apaga todos os níveis de avaliação
    @OneToMany(mappedBy = "disciplina", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<NivelAvaliacao> niveis;
}