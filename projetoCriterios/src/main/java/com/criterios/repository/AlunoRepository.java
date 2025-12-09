package com.criterios.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints; // [NOVO IMPORT]
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.criterios.entities.Aluno;

import jakarta.persistence.QueryHint; // [NOVO IMPORT]

@Repository
public interface AlunoRepository extends JpaRepository<Aluno, Long> {
    
    // [ADICIONADO] Dica para não usar cache e garantir o banco atual
    @QueryHints(@QueryHint(name = "org.hibernate.cacheable", value = "false"))
    @Query("SELECT a FROM Aluno a WHERE a.turma.id = :turmaId ORDER BY a.nome ASC")
    List<Aluno> findByTurmaId(@Param("turmaId") Long turmaId);
}