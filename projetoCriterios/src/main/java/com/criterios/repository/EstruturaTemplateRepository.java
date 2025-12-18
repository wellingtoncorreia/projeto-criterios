package com.criterios.repository;

import com.criterios.entities.EstruturaTemplate; 
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
// Renomeie o arquivo de EstruturaDisciplinaRepository.java para EstruturaTemplateRepository.java
public interface EstruturaTemplateRepository extends JpaRepository<EstruturaTemplate, Long> {
    
    // Encontra o Template (o único) que está ativo para uma disciplina.
    EstruturaTemplate findByDisciplinaTemplateId(Long disciplinaTemplateId); 
    
    // Para exclusão em massa (durante a importação):
    void deleteByDisciplinaTemplateId(Long disciplinaTemplateId);
}