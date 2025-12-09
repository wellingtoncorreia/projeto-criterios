package com.criterios.dto;

import com.criterios.entities.TipoUsuario;
import lombok.Data;

@Data
public class CadastroUsuarioDTO {
    private String nome;
    private String email;
    private String senha;
    private TipoUsuario tipo;
}