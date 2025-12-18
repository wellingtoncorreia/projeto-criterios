// projetoCriterios/src/main/java/com/criterios/services/GerenciamentoCriterioService.java
package com.criterios.services;

import com.criterios.dto.CapacidadeImportDTO;
import com.criterios.dto.CriterioImportDTO;
import com.criterios.entities.*;
import com.criterios.repository.CapacidadeRepository;
import com.criterios.repository.CriterioRepository;
import com.criterios.repository.DisciplinaRepository;
import com.criterios.repository.NivelAvaliacaoRepository;
import com.criterios.repository.EstruturaTemplateRepository; 
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.lang.Math;

@Service
@RequiredArgsConstructor
public class GerenciamentoCriterioService {

    private final CriterioRepository criterioRepository;
    private final CapacidadeRepository capacidadeRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final NivelAvaliacaoRepository nivelRepository;
    private final EstruturaTemplateRepository estruturaTemplateRepository; 
    private final EstruturaTemplateService estruturaTemplateService; 

    @Transactional
    public Criterio criarCriterio(Long capacidadeId, String descricao, TipoCriterio tipo) {
        Capacidade capacidade = capacidadeRepository.findById(capacidadeId)
                .orElseThrow(() -> new RuntimeException("Capacidade não encontrada"));

        Criterio criterio = new Criterio();
        criterio.setCapacidade(capacidade);
        criterio.setDescricao(descricao);
        criterio.setTipo(tipo);

        return criterioRepository.save(criterio);
    }

    public boolean validarRegraMinimoCritico(Long disciplinaTemplateId) {
        List<Capacidade> capacidades = capacidadeRepository.findByDisciplinaTemplateId(disciplinaTemplateId);
        
        for (Capacidade cap : capacidades) {
            List<Criterio> criteriosDaCap = criterioRepository.findByCapacidadeId(cap.getId());
            boolean temCritico = criteriosDaCap.stream()
                    .anyMatch(c -> c.getTipo() == TipoCriterio.CRITICO);
            
            if (!temCritico) {
                throw new RuntimeException("A capacidade '" + cap.getDescricao() + "' não possui nenhum critério CRÍTICO. Regra violada.");
            }
        }
        return true;
    }

    @Transactional
    public void salvarImportacaoEmMassa(Long disciplinaTemplateId, List<CapacidadeImportDTO> dados) {
        Disciplina disciplinaTemplate = disciplinaRepository.findById(disciplinaTemplateId)
                .orElseThrow(() -> new RuntimeException("Disciplina (Template) não encontrada"));

        // 1. [LIMPEZA] Encontra e Deleta TODA a estrutura TEMPLATE antiga.
        EstruturaTemplate estruturaAntiga = estruturaTemplateRepository.findByDisciplinaTemplateId(disciplinaTemplateId);
        if (estruturaAntiga != null) {
            estruturaTemplateRepository.delete(estruturaAntiga);
        }
        
        // 2. RECRIAR O NOVO TEMPLATE DA ESTRUTURA 
        EstruturaTemplate novaEstruturaTemplate = estruturaTemplateService.criarTemplateInicial(disciplinaTemplateId, disciplinaTemplate);
        
        // 3. Salva a nova estrutura de Capacidades e Critérios
        for (CapacidadeImportDTO capDTO : dados) {
            Capacidade cap = new Capacidade();
            // Liga a Capacidade ao novo objeto Template
            cap.setEstruturaTemplate(novaEstruturaTemplate); 
            
            cap.setDescricao(capDTO.getDescricao());
            cap.setTipo(capDTO.getTipo());
            
            cap = capacidadeRepository.save(cap);

            if (capDTO.getCriterios() != null) {
                for (CriterioImportDTO critDTO : capDTO.getCriterios()) {
                    Criterio crit = new Criterio();
                    crit.setCapacidade(cap);
                    crit.setDescricao(critDTO.getDescricao());
                    crit.setTipo(critDTO.getTipo());
                    criterioRepository.save(crit);
                }
            }
        }
        
        // 4. Gera os Níveis para a nova Estrutura (usando o novo ID)
        gerarNiveisAutomaticos(novaEstruturaTemplate.getId());
    }

    @Transactional
    public void gerarNiveisAutomaticos(Long estruturaTemplateId) { 
        
        // 1. Limpa níveis antigos
        nivelRepository.deleteByTemplateId(estruturaTemplateId); 

        // 2. Conta totais 
        long totalCriticos = criterioRepository.countByTemplateIdAndTipo(estruturaTemplateId, TipoCriterio.CRITICO);
        long totalDesejaveis = criterioRepository.countByTemplateIdAndTipo(estruturaTemplateId, TipoCriterio.DESEJAVEL);

        if (totalCriticos == 0) return;

        EstruturaTemplate templatePlaceholder = new EstruturaTemplate();
        templatePlaceholder.setId(estruturaTemplateId);
        
        // 3. Gera de 5 a 100
        for (int nivel = 5; nivel <= 100; nivel += 5) {
            NivelAvaliacao novoNivel = new NivelAvaliacao();
            // Liga ao Template
            novoNivel.setEstruturaTemplate(templatePlaceholder); 
            novoNivel.setNivel(nivel);
            
            if (nivel <= 50) {
                double proporcao = (double) nivel / 50.0;
                int qtdCriticos = (int) Math.ceil(proporcao * totalCriticos);
                
                if (qtdCriticos == 0 && totalCriticos > 0) qtdCriticos = 1;
                
                novoNivel.setMinCriticos(qtdCriticos);
                novoNivel.setMinDesejaveis(0);
            } else {
                novoNivel.setMinCriticos((int) totalCriticos); 

                if (totalDesejaveis > 0) {
                    int degrausAbaixoDe100 = (100 - nivel) / 5;
                    int qtdDesejaveis = (int) totalDesejaveis - degrausAbaixoDe100;

                    if (qtdDesejaveis < 0) qtdDesejaveis = 0;
                    
                    novoNivel.setMinDesejaveis(qtdDesejaveis);
                } else {
                    novoNivel.setMinDesejaveis(0);
                }
            }

            nivelRepository.save(novoNivel);
        }
    }
}