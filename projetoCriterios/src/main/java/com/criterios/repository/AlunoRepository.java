package com.criterios.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints; // Importado
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.criterios.entities.Aluno;

import jakarta.persistence.QueryHint; // Importado

@Repository
public interface AlunoRepository extends JpaRepository<Aluno, Long> {
    
    // [CORREÇÃO] Adicionada dica para ignorar o cache do Hibernate
    @QueryHints(@QueryHint(name = "org.hibernate.cacheable", value = "false"))
    @Query("SELECT a FROM Aluno a WHERE a.turma.id = :turmaId ORDER BY a.nome ASC")
    List<Aluno> findByTurmaId(@Param("turmaId") Long turmaId);
}