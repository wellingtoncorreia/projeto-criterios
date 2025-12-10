package com.criterios.dto;

import lombok.Data;
import java.util.List;

@Data
public class EstruturaImportacaoDTO {
    private String nomeDisciplina;
    private Long disciplinaId;
    private List<CapItemDTO> capacidades;
}