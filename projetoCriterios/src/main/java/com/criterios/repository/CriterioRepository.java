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
    
    // Busca critérios pelo ID da Capacidade
    List<Criterio> findByCapacidadeId(Long capacidadeId);

    // Busca critérios pelo ID da Disciplina (navegando pela Capacidade)
    @Query("SELECT c FROM Criterio c JOIN c.capacidade cap WHERE cap.disciplina.id = :disciplinaId")
    List<Criterio> findByDisciplinaId(@Param("disciplinaId") Long disciplinaId);

    // [NOVO] Conta critérios por tipo na disciplina
    @Query("SELECT COUNT(c) FROM Criterio c JOIN c.capacidade cap WHERE cap.disciplina.id = :disciplinaId AND c.tipo = :tipo")
    Long countByDisciplinaAndTipo(@Param("disciplinaId") Long disciplinaId, @Param("tipo") TipoCriterio tipo);
}