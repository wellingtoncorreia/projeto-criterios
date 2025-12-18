package com.criterios.repository;

import com.criterios.entities.NivelAvaliacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NivelAvaliacaoRepository extends JpaRepository<NivelAvaliacao, Long> {

    // --- SNAPSHOT (HISTÓRICO / AVALIAÇÃO) ---

    // Busca níveis para o cálculo de notas (decrescente)
    List<NivelAvaliacao> findBySnapshotDisciplinaIdOrderByNivelDesc(Long snapshotDisciplinaId);

    // Busca níveis para exibição no relatório (crescente)
    List<NivelAvaliacao> findBySnapshotDisciplinaIdOrderByNivelAsc(Long snapshotDisciplinaId);

    // Limpeza de níveis de um snapshot específico
    void deleteBySnapshotDisciplinaId(Long snapshotDisciplinaId);


    // --- TEMPLATE (GESTÃO / EDIÇÃO) ---

    // Busca níveis da estrutura atual (Template)
    @Query("SELECT n FROM NivelAvaliacao n WHERE n.estruturaTemplate.disciplinaTemplateId = :disciplinaTemplateId AND n.snapshotDisciplina IS NULL ORDER BY n.nivel ASC")
    List<NivelAvaliacao> findByDisciplinaTemplateId(@Param("disciplinaTemplateId") Long disciplinaTemplateId);

    // [CORREÇÃO 1] Removemos o uso incorreto de 'disciplinaTemplate' e usamos 'estruturaTemplate.disciplinaTemplateId'
    @Modifying
    @Query("DELETE FROM NivelAvaliacao n WHERE n.estruturaTemplate.disciplinaTemplateId = :disciplinaTemplateId AND n.snapshotDisciplina IS NULL")
    void deleteByDisciplinaTemplateId(@Param("disciplinaTemplateId") Long disciplinaTemplateId);

    // [CORREÇÃO 2] Método obrigatório chamado pelo GerenciamentoCriterioService.java
    // A query deve apontar para 'n.estruturaTemplate.id'
    @Modifying
    @Query("DELETE FROM NivelAvaliacao n WHERE n.estruturaTemplate.id = :templateId AND n.snapshotDisciplina IS NULL")
    void deleteByTemplateId(@Param("templateId") Long templateId);
}