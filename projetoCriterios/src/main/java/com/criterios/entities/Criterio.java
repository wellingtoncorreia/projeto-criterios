package com.criterios.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "tb_criterio")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Criterio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoCriterio tipo; // CRITICO ou DESEJAVEL

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capacidade_id", nullable = false)
    private Capacidade capacidade;
    
    // Método auxiliar para pegar o ID da EstruturaDisciplina (o novo "dono")
    public Long getEstruturaDisciplinaId() {
        return capacidade != null && capacidade.getEstruturaDisciplina() != null 
               ? capacidade.getEstruturaDisciplina().getId() 
               : null;
    }
}