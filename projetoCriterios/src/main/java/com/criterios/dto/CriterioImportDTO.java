package com.criterios.dto;

import com.criterios.entities.TipoCriterio;
import lombok.Data;

@Data
public class CriterioImportDTO {
    private String descricao;
    private TipoCriterio tipo; // CRITICO ou DESEJAVEL
}