// projetoCriterios/src/main/java/com/criterios/repository/AvaliacaoRepository.java
package com.criterios.repository;

import com.criterios.entities.Avaliacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long> {
    
    Optional<Avaliacao> findByAlunoIdAndCriterioId(Long alunoId, Long criterioId);

    // [CORREÇÃO CRÍTICA] Usa cap.snapshotDisciplina.id para buscar avaliações (o novo link imutável)
    @Query("SELECT a FROM Avaliacao a JOIN a.criterio c JOIN c.capacidade cap WHERE a.aluno.id = :alunoId AND cap.snapshotDisciplina.id = :estruturaDisciplinaId")
    List<Avaliacao> findByAlunoAndEstruturaDisciplina(@Param("alunoId") Long alunoId, @Param("estruturaDisciplinaId") Long estruturaDisciplinaId);
}