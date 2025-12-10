package com.criterios.dto;

import lombok.Data;
import java.util.List;

@Data
public class TurmaResponseDTO {
    private Long id;
    private String nome;
    private String anoSemestre;
    private Integer termoAtual;
    private List<UsuarioResponseDTO> professores;
    private int totalAlunos;
    // [NOVO] Adicionados campos da disciplina Snapshot
    private Long disciplinaId; // ID da Disciplina (Template)
    private Long estruturaSnapshotId; // ID da Estrutura Imutável (Snapshot) <-- ADICIONADO
    private String nomeDisciplina; // Nome da Disciplina (Template)
}