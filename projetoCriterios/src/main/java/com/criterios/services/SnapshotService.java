package com.criterios.services;

import com.criterios.entities.*;
import com.criterios.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SnapshotService {

    private final DisciplinaRepository disciplinaRepository;
    private final CapacidadeRepository capacidadeRepository;
    private final CriterioRepository criterioRepository;
    private final NivelAvaliacaoRepository nivelRepository;
    private final SnapshotDisciplinaRepository snapshotDisciplinaRepository;
    private final EstruturaTemplateRepository estruturaTemplateRepository; 

    @Transactional
    public SnapshotDisciplina criarSnapshot(Long disciplinaTemplateId) {
        Disciplina template = disciplinaRepository.findById(disciplinaTemplateId)
                .orElseThrow(() -> new RuntimeException("Disciplina (Template) não encontrada."));

        // [CORREÇÃO] O Repositório retorna o objeto direto, então removemos o .orElse(null)
        EstruturaTemplate estruturaTemplate = estruturaTemplateRepository.findByDisciplinaTemplateId(disciplinaTemplateId);
        
        if (estruturaTemplate == null) {
            throw new RuntimeException("A disciplina Template não possui Estrutura ATIVA. Importe critérios primeiro.");
        }
        
        // 2. Cria o SnapshotDisciplina
        SnapshotDisciplina snapshot = new SnapshotDisciplina();
        snapshot.setDisciplinaTemplateId(template.getId());
        snapshot.setNomeDisciplina(template.getNome());
        snapshot.setSiglaDisciplina(template.getSigla());
        
        snapshot = snapshotDisciplinaRepository.save(snapshot); 

        // 3. Busca Capacidades do TEMPLATE
        List<Capacidade> capacidadesTemplate = capacidadeRepository.findByDisciplinaTemplateId(disciplinaTemplateId);
        
        if (capacidadesTemplate.isEmpty()) {
            throw new RuntimeException("A estrutura Template não possui Capacidades/Critérios para gerar o Snapshot.");
        }

        for (Capacidade capTemplate : capacidadesTemplate) {
            Capacidade capSnapshot = new Capacidade();
            capSnapshot.setDescricao(capTemplate.getDescricao());
            capSnapshot.setTipo(capTemplate.getTipo());
            
            capSnapshot.setSnapshotDisciplina(snapshot); 
            capSnapshot.setEstruturaTemplate(estruturaTemplate);
            
            capSnapshot = capacidadeRepository.save(capSnapshot);

            // 4. Busca Critérios do TEMPLATE
            List<Criterio> criteriosTemplate = criterioRepository.findByCapacidadeTemplateId(capTemplate.getId());
            
            for (Criterio critTemplate : criteriosTemplate) {
                Criterio critSnapshot = new Criterio();
                critSnapshot.setDescricao(critTemplate.getDescricao());
                critSnapshot.setTipo(critTemplate.getTipo());
                
                critSnapshot.setCapacidade(capSnapshot); 
                criterioRepository.save(critSnapshot);
            }
        }
        
        // 5. Busca e copia Níveis de Avaliação
        List<NivelAvaliacao> niveisTemplate = nivelRepository.findByDisciplinaTemplateId(disciplinaTemplateId);
        
        for (NivelAvaliacao nivelTemplate : niveisTemplate) {
            NivelAvaliacao nivelSnapshot = new NivelAvaliacao();
            nivelSnapshot.setNivel(nivelTemplate.getNivel());
            nivelSnapshot.setMinCriticos(nivelTemplate.getMinCriticos());
            nivelSnapshot.setMinDesejaveis(nivelTemplate.getMinDesejaveis());
            
            nivelSnapshot.setSigla(nivelTemplate.getSigla());
            nivelSnapshot.setDescricao(nivelTemplate.getDescricao());
            
            nivelSnapshot.setSnapshotDisciplina(snapshot); 
            nivelSnapshot.setEstruturaTemplate(estruturaTemplate);
            nivelRepository.save(nivelSnapshot);
        }

        return snapshot;
    }
    
    @Transactional(readOnly = true)
    public SnapshotDisciplina buscarSnapshotPorDisciplinaTemplateId(Long disciplinaTemplateId) {
        return snapshotDisciplinaRepository.findTopByDisciplinaTemplateIdOrderByIdDesc(disciplinaTemplateId);
    }
}