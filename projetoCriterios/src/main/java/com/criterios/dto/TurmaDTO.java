package com.criterios.dto;

import lombok.Data;
import java.util.List;

@Data
public class TurmaDTO {
    private String nome;
    private String anoSemestre;
    private Integer termoAtual;
    private Long disciplinaTemplateId; // NOVO: ID da disciplina Template para tirar o snapshot
    private List<Long> professoresIds; // Lista de IDs (Mín 1, Máx 2)
}