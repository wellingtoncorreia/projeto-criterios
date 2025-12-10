package com.criterios.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
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

    // [NOVO] Campo para status de fechamento (usaremos no service)
    @Column(nullable = false, columnDefinition = "boolean default false")
    private Boolean finalizada = false; 
    
    // [NOVO] Nível calculado na hora do fechamento
    private Integer nivelFinal; 

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aluno_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
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