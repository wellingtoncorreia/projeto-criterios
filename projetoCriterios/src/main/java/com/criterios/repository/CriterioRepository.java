package com.criterios.repository;

import com.criterios.entities.Criterio;
import com.criterios.entities.TipoCriterio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CriterioRepository extends JpaRepository<Criterio, Long> {
    
    // --- MÉTODOS GERAIS ---
    
    /**
     * Busca critérios por ID de capacidade.
     * Útil para operações genéricas onde você já tem o objeto Capacidade carregado.
     */
    List<Criterio> findByCapacidadeId(Long capacidadeId);

    // --- SNAPSHOT (HISTÓRICO / AVALIAÇÃO) ---
    // Estes métodos buscam dados das cópias imutáveis (Snapshot)

    @Query("SELECT c FROM Criterio c WHERE c.capacidade.snapshotDisciplina.id = :snapshotId")
    List<Criterio> findBySnapshotDisciplinaId(@Param("snapshotId") Long snapshotId);

    @Query("SELECT COUNT(c) FROM Criterio c WHERE c.capacidade.snapshotDisciplina.id = :snapshotId AND c.tipo = :tipo")
    Long countBySnapshotDisciplinaAndTipo(@Param("snapshotId") Long snapshotId, @Param("tipo") TipoCriterio tipo);

    // --- TEMPLATE (GESTÃO / EDIÇÃO) ---
    // Estes métodos buscam dados do modelo original e DEVEM ter "snapshotDisciplina IS NULL"

    /**
     * Busca critérios de uma capacidade do TEMPLATE.
     * O filtro "IS NULL" é a trava de segurança para não trazer critérios de snapshots antigos.
     */
    @Query("SELECT c FROM Criterio c WHERE c.capacidade.id = :capId AND c.capacidade.snapshotDisciplina IS NULL")
    List<Criterio> findByCapacidadeTemplateId(@Param("capId") Long capId);

    /**
     * Busca TODOS os critérios de uma disciplina (Modo Template).
     * Usa JOINs explícitos para garantir que estamos olhando para a estrutura correta.
     */
    @Query("SELECT c FROM Criterio c JOIN c.capacidade cap JOIN cap.estruturaTemplate et " +
           "WHERE et.disciplinaTemplateId = :disciplinaId AND cap.snapshotDisciplina IS NULL")
    List<Criterio> findByDisciplinaTemplateId(@Param("disciplinaId") Long disciplinaId);

    @Query("SELECT COUNT(c) FROM Criterio c JOIN c.capacidade cap JOIN cap.estruturaTemplate et " +
           "WHERE et.disciplinaTemplateId = :disciplinaId AND cap.snapshotDisciplina IS NULL AND c.tipo = :tipo")
    Long countByDisciplinaTemplateIdAndTipo(@Param("disciplinaId") Long disciplinaId, @Param("tipo") TipoCriterio tipo);

    @Query("SELECT COUNT(c) FROM Criterio c JOIN c.capacidade cap JOIN cap.estruturaTemplate et " +
           "WHERE et.id = :templateId AND cap.snapshotDisciplina IS NULL AND c.tipo = :tipo")
    Long countByTemplateIdAndTipo(@Param("templateId") Long templateId, @Param("tipo") TipoCriterio tipo);

    // --- LIMPEZA (ESSENCIAL PARA IMPORTAÇÃO) ---

    /**
     * [NOVO] Exclui apenas critérios do TEMPLATE de uma disciplina.
     * Essencial para quando você reimporta a planilha e precisa limpar a base anterior
     * sem apagar os históricos (snapshots) das turmas já avaliadas.
     */
    @Modifying
    @Query("DELETE FROM Criterio c WHERE c.capacidade.id IN " +
           "(SELECT cap.id FROM Capacidade cap JOIN cap.estruturaTemplate et " +
           "WHERE et.disciplinaTemplateId = :disciplinaId AND cap.snapshotDisciplina IS NULL)")
    void deleteByDisciplinaTemplateId(@Param("disciplinaId") Long disciplinaId);
}