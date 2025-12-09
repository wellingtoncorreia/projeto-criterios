package com.criterios.dto;

import com.criterios.entities.TipoCapacidade;
import lombok.Data;
import java.util.List;

@Data
public class CapacidadeImportDTO {
    private String descricao;
    private TipoCapacidade tipo; // TECNICA ou SOCIOEMOCIONAL
    private List<CriterioImportDTO> criterios;
}