package com.criterios.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.criterios.entities.Capacidade;
import com.criterios.entities.Disciplina;

@Repository
public interface CapacidadeRepository extends JpaRepository<Capacidade, Long> {
    List<Capacidade> findByDisciplinaId(Long disciplinaId);
    Capacidade findByDescricaoAndDisciplina(String descricao, Disciplina disciplina);
}