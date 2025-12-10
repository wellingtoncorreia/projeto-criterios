package com.criterios.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.criterios.entities.Capacidade;
import com.criterios.entities.Disciplina;
import com.criterios.entities.EstruturaDisciplina;

@Repository
public interface CapacidadeRepository extends JpaRepository<Capacidade, Long> {
    
    // [GESTÃO/TEMPLATE] Busca capacidades pelo ID da Disciplina TEMPLATE
    @Query("SELECT c FROM Capacidade c WHERE c.estruturaDisciplina.disciplinaTemplateId = :disciplinaTemplateId")
    List<Capacidade> findByDisciplinaTemplateId(@Param("disciplinaTemplateId") Long disciplinaTemplateId);
    
    // [NOVO - SNAPSHOT] Busca capacidades pelo ID da EstruturaDisciplina (Snapshot) <-- ADICIONADO
    List<Capacidade> findByEstruturaDisciplinaId(Long estruturaDisciplinaId); 
    
    // [CORRIGIDO] O método findByDescricaoAndDisciplina foi removido para evitar o erro de 'No property disciplina found'.
}