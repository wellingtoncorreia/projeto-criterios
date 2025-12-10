package com.criterios.dto;

import com.criterios.entities.TipoCriterio;
import lombok.Data;

@Data
public class CritItemDTO {
    private String descricao;
    private TipoCriterio tipo; // CRITICO ou DESEJAVEL
}