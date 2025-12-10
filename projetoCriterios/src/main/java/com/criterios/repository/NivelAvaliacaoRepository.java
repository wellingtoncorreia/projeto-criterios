package com.criterios.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Modifying; // Import NECESSÁRIO

import com.criterios.entities.NivelAvaliacao;

@Repository
public interface NivelAvaliacaoRepository extends JpaRepository<NivelAvaliacao, Long> {
    
    // [SNAPSHOT] Busca níveis de avaliação pela EstruturaDisciplina (Snapshot)
    List<NivelAvaliacao> findByEstruturaDisciplinaIdOrderByNivelDesc(Long estruturaDisciplinaId);
    
    // [TEMPLATE - GESTÃO] Deleta todos os níveis de uma Disciplina TEMPLATE
    // [CORRIGIDO] Adicionado @Modifying para permitir a execução da query DELETE.
    @Modifying 
    @Query("DELETE FROM NivelAvaliacao n WHERE n.estruturaDisciplina.disciplinaTemplateId = :disciplinaTemplateId")
    void deleteByDisciplinaTemplateId(@Param("disciplinaTemplateId") Long disciplinaTemplateId);
    
    // [SNAPSHOT] Deleta todos os níveis de uma EstruturaDisciplina (Snapshot)
    void deleteByEstruturaDisciplinaId(Long estruturaDisciplinaId);
    
    // [TEMPLATE - GESTÃO] Busca níveis de avaliação pela Disciplina TEMPLATE
    @Query("SELECT n FROM NivelAvaliacao n WHERE n.estruturaDisciplina.disciplinaTemplateId = :disciplinaTemplateId")
    List<NivelAvaliacao> findByDisciplinaTemplateId(@Param("disciplinaTemplateId") Long disciplinaTemplateId); 
}