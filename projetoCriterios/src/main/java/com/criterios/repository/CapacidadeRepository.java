package com.criterios.repository;

import com.criterios.entities.Capacidade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CapacidadeRepository extends JpaRepository<Capacidade, Long> {
    
    // [CORRIGIDO] Busca apenas as capacidades do TEMPLATE original (Gestão).
    // O filtro 'AND c.snapshotDisciplina IS NULL' é essencial para não trazer capacidades de snapshots (Histórico).
    @Query("SELECT c FROM Capacidade c JOIN c.estruturaTemplate et WHERE et.disciplinaTemplateId = :id AND c.snapshotDisciplina IS NULL")
    List<Capacidade> findByDisciplinaTemplateId(@Param("id") Long id);

    // [SNAPSHOT] Busca capacidades vinculadas a um snapshot específico (sem os critérios)
    List<Capacidade> findBySnapshotDisciplinaId(Long snapshotId);

    // [SNAPSHOT + FETCH] Busca capacidades e já carrega os critérios (evita LazyInitializationException)
    // Usado na tela de Avaliação e Relatórios
    @Query("SELECT c FROM Capacidade c LEFT JOIN FETCH c.criterios WHERE c.snapshotDisciplina.id = :id")
    List<Capacidade> findBySnapshotDisciplinaIdFetchCriterios(@Param("id") Long id);
}