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
}