package com.criterios.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ResultadoBoletimDTO {
    private String nomeAluno;
    private String nomeDisciplina;
    private int qtdCriticosAtendidos;
    private int qtdDesejaveisAtendidos;
    private int totalCriticosDisciplina;
    private int totalDesejaveisDisciplina;
    private Integer nivelAlcancado; 
    private Double percentualConclusao; // Campo extra sugerido para gráficos
}