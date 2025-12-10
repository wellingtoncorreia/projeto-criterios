package com.criterios.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

    // [ALTERADO] Adicionado cascade para apagar alunos junto com a turma
    @OneToMany(mappedBy = "turma", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Aluno> alunos;

    // [ALTERADO] Agora suporta múltiplos professores (Regra de Negócio: 1 ou 2)
    // Usamos EAGER para carregar os professores junto com a turma na listagem
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "turma_professores",
        joinColumns = @JoinColumn(name = "turma_id"),
        inverseJoinColumns = @JoinColumn(name = "usuario_id")
    )
    private List<Usuario> professores;
}