package com.criterios.repository;

import com.criterios.entities.EstruturaDisciplina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EstruturaDisciplinaRepository extends JpaRepository<EstruturaDisciplina, Long> {
    
    // Método necessário para encontrar a Estrutura que está atuando como TEMPLATE
    EstruturaDisciplina findByDisciplinaTemplateId(Long disciplinaTemplateId);
}