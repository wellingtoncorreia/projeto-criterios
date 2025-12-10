package com.criterios.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AvaliacaoDTO {
    private Long id;
    @NotNull private Long alunoId;
    @NotNull private Long criterioId;
    @NotNull private Long estruturaDisciplinaId; // NOVO: ID da Estrutura Imutável (Snapshot)
    private Boolean atendeu;
    private String observacao;
}