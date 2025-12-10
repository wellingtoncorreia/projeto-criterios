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

    // [SNAPSHOT] Busca avaliações pelo Aluno e pelo ID da EstruturaDisciplina (Snapshot)
    @Query("SELECT a FROM Avaliacao a JOIN a.criterio c JOIN c.capacidade cap WHERE a.aluno.id = :alunoId AND cap.estruturaDisciplina.id = :estruturaDisciplinaId")
    List<Avaliacao> findByAlunoAndEstruturaDisciplina(@Param("alunoId") Long alunoId, @Param("estruturaDisciplinaId") Long estruturaDisciplinaId);
}