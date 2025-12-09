package com.criterios.repository;

import com.criterios.entities.Disciplina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DisciplinaRepository extends JpaRepository<Disciplina, Long> {
    
    // [ATUALIZADO] Adicionado "ORDER BY d.nome ASC" para ordenar alfabeticamente
    @Query("SELECT d FROM Disciplina d WHERE d.periodicidade = 'ANUAL' OR d.termo = :termo ORDER BY d.nome ASC")
    List<Disciplina> findByTermoOrAnual(@Param("termo") Integer termo);
}