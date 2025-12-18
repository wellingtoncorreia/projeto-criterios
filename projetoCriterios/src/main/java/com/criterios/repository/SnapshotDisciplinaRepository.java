package com.criterios.repository;

import com.criterios.entities.SnapshotDisciplina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SnapshotDisciplinaRepository extends JpaRepository<SnapshotDisciplina, Long> {
    
    // Busca o Snapshot mais recente para um dado Template ID (ordenado pelo ID decrescente)
    // Retorna o objeto direto (pode ser null se não existir)
    SnapshotDisciplina findTopByDisciplinaTemplateIdOrderByIdDesc(Long disciplinaTemplateId);
}