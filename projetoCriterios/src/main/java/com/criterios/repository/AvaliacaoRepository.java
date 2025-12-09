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

    // CORREÇÃO: Navegação ajustada para passar por 'capacidade'
    // Antes: c.disciplina.id
    // Agora: c.capacidade.disciplina.id
    @Query("SELECT a FROM Avaliacao a JOIN a.criterio c WHERE a.aluno.id = :alunoId AND c.capacidade.disciplina.id = :disciplinaId")
    List<Avaliacao> findByAlunoAndDisciplina(@Param("alunoId") Long alunoId, @Param("disciplinaId") Long disciplinaId);
}