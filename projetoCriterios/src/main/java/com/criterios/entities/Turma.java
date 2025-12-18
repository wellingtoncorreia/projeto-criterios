package com.criterios.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Data
@Entity
public class Turma {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String anoSemestre;
    private Integer termoAtual;
    
    private Long disciplinaId; 

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "snapshot_disciplina_id", nullable = true) 
    private SnapshotDisciplina snapshotDisciplina; 

    @OneToMany(mappedBy = "turma", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Aluno> alunos;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "turma_professores",
        joinColumns = @JoinColumn(name = "turma_id"),
        inverseJoinColumns = @JoinColumn(name = "usuario_id")
    )
    private List<Usuario> professores;
}