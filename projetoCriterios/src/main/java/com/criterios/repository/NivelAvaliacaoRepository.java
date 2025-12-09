package com.criterios.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.criterios.entities.NivelAvaliacao;

@Repository
public interface NivelAvaliacaoRepository extends JpaRepository<NivelAvaliacao, Long> {
    List<NivelAvaliacao> findByDisciplinaIdOrderByNivelDesc(Long disciplinaId);
    
    // [NOVO] Deleta todos os níveis de uma disciplina
    void deleteByDisciplinaId(Long disciplinaId);
}