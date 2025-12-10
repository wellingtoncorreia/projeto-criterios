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

    // [REMOVIDO] links para Capacidades e Níveis, pois agora eles pertencem à EstruturaDisciplina (Snapshot)
    // Para manter a tela de gestão (GerenciadorCapacidades), a busca será feita indiretamente
}