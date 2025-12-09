package com.criterios.dto;

import com.criterios.entities.TipoUsuario;
import lombok.Data;

@Data
public class ProfessorResponseDTO {
    private Long id;
    private String nome;
    private String email;
    private TipoUsuario tipo;
}