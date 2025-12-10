package com.criterios.repository;

import com.criterios.entities.Criterio;
import com.criterios.entities.TipoCriterio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CriterioRepository extends JpaRepository<Criterio, Long> {
    
    // Busca critérios pelo ID da Capacidade (Snapshot/Template)
    List<Criterio> findByCapacidadeId(Long capacidadeId);
    
 // Adicionar este método em CriterioRepository.java:
    @Query("SELECT COUNT(c) FROM Criterio c JOIN c.capacidade cap WHERE cap.estruturaDisciplina.id = :estruturaDisciplinaId AND c.tipo = :tipo")
    Long countByEstruturaDisciplinaAndTipo(@Param("estruturaDisciplinaId") Long estruturaDisciplinaId, @Param("tipo") TipoCriterio tipo);

    // [SNAPSHOT] Busca critérios pelo ID da EstruturaDisciplina (navegando pela Capacidade)
    @Query("SELECT c FROM Criterio c JOIN c.capacidade cap WHERE cap.estruturaDisciplina.id = :estruturaDisciplinaId")
    List<Criterio> findByEstruturaDisciplinaId(@Param("estruturaDisciplinaId") Long estruturaDisciplinaId);

    // [TEMPLATE] Busca critérios pelo ID da Disciplina TEMPLATE
    @Query("SELECT c FROM Criterio c JOIN c.capacidade cap WHERE cap.estruturaDisciplina.disciplinaTemplateId = :disciplinaTemplateId")
    List<Criterio> findByDisciplinaTemplateId(@Param("disciplinaTemplateId") Long disciplinaTemplateId);

    // [TEMPLATE] Conta critérios por tipo na Disciplina TEMPLATE
    @Query("SELECT COUNT(c) FROM Criterio c JOIN c.capacidade cap WHERE cap.estruturaDisciplina.disciplinaTemplateId = :disciplinaTemplateId AND c.tipo = :tipo")
    Long countByDisciplinaTemplateIdAndTipo(@Param("disciplinaTemplateId") Long disciplinaTemplateId, @Param("tipo") TipoCriterio tipo);
    
    // [TEMPLATE] Método para buscar Critérios de uma Capacidade TEMPLATE (para o EstruturaService)
    @Query("SELECT c FROM Criterio c WHERE c.capacidade.id = :capacidadeTemplateId")
    List<Criterio> findByCapacidadeTemplateId(@Param("capacidadeTemplateId") Long capacidadeTemplateId);
}