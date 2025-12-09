package com.criterios.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
@Entity
@Table(name = "tb_avaliacao", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"aluno_id", "criterio_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Avaliacao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true)
    private Boolean atendeu; 

    @Column(columnDefinition = "TEXT")
    private String observacao;

    private LocalDateTime dataAvaliacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aluno_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    // [CORREÇÃO] Adicionado @JsonIgnore para quebrar o loop
    @JsonIgnore 
    private Aluno aluno;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "criterio_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE) 
    private Criterio criterio;

    @PrePersist
    @PreUpdate
    public void prePersist() {
        this.dataAvaliacao = LocalDateTime.now();
    }
}