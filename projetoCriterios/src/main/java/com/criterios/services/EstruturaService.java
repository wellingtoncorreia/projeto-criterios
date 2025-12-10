package com.criterios.services;

import com.criterios.entities.*;
import com.criterios.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EstruturaService {

    private final DisciplinaRepository disciplinaRepository;
    private final CapacidadeRepository capacidadeRepository;
    private final CriterioRepository criterioRepository;
    private final NivelAvaliacaoRepository nivelRepository;
    private final EstruturaDisciplinaRepository estruturaDisciplinaRepository;

    /**
     * Copia a estrutura atual de Capacidades, Critérios e Níveis de uma Disciplina (Template)
     * para criar uma EstruturaDisciplina IMUTÁVEL (Snapshot) e a retorna.
     * @param disciplinaTemplateId ID da disciplina (Template).
     * @return EstruturaDisciplina (Snapshot).
     */
    @Transactional
    public EstruturaDisciplina criarSnapshotEstrutura(Long disciplinaTemplateId) {
        Disciplina template = disciplinaRepository.findById(disciplinaTemplateId)
                .orElseThrow(() -> new RuntimeException("Disciplina (Template) não encontrada."));

        // 1. Cria a EstruturaDisciplina (o novo container)
        EstruturaDisciplina estrutura = new EstruturaDisciplina();
        estrutura.setDisciplinaTemplateId(template.getId());
        estrutura.setNomeDisciplina(template.getNome());
        estrutura.setSiglaDisciplina(template.getSigla());
        estrutura = estruturaDisciplinaRepository.save(estrutura);

        // 2. Copia as Capacidades
        List<Capacidade> capacidadesTemplate = capacidadeRepository.findByDisciplinaTemplateId(disciplinaTemplateId);
        
        for (Capacidade capTemplate : capacidadesTemplate) {
            // Cria nova Capacidade (Snapshot)
            Capacidade capSnapshot = new Capacidade();
            capSnapshot.setDescricao(capTemplate.getDescricao());
            capSnapshot.setTipo(capTemplate.getTipo());
            capSnapshot.setEstruturaDisciplina(estrutura); // Liga ao novo container
            capSnapshot = capacidadeRepository.save(capSnapshot);

            // 3. Copia os Critérios
            List<Criterio> criteriosTemplate = criterioRepository.findByCapacidadeTemplateId(capTemplate.getId());
            for (Criterio critTemplate : criteriosTemplate) {
                Criterio critSnapshot = new Criterio();
                critSnapshot.setDescricao(critTemplate.getDescricao());
                critSnapshot.setTipo(critTemplate.getTipo());
                critSnapshot.setCapacidade(capSnapshot); // Liga à nova Capacidade (Snapshot)
                criterioRepository.save(critSnapshot);
            }
        }
        
        // 4. Copia os Níveis de Avaliação
        List<NivelAvaliacao> niveisTemplate = nivelRepository.findByDisciplinaTemplateId(disciplinaTemplateId);
        for (NivelAvaliacao nivelTemplate : niveisTemplate) {
            NivelAvaliacao nivelSnapshot = new NivelAvaliacao();
            nivelSnapshot.setNivel(nivelTemplate.getNivel());
            nivelSnapshot.setMinCriticos(nivelTemplate.getMinCriticos());
            nivelSnapshot.setMinDesejaveis(nivelTemplate.getMinDesejaveis());
            nivelSnapshot.setEstruturaDisciplina(estrutura); // Liga ao novo container
            nivelRepository.save(nivelSnapshot);
        }

        return estrutura;
    }
}