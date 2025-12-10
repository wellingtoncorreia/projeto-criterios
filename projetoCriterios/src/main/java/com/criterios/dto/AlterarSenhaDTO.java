package com.criterios.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AlterarSenhaDTO {
    
    @NotBlank(message = "A senha atual é obrigatória.")
    private String senhaAtual;
    
    @NotBlank(message = "A nova senha é obrigatória.")
    private String novaSenha;
}