package com.criterios.repository;

import com.criterios.entities.Turma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TurmaRepository extends JpaRepository<Turma, Long> {
    
    // Busca turmas onde a lista de 'professores' contém o ID do usuário
    List<Turma> findAllByProfessoresId(Long professorId);
}