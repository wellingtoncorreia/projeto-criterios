package com.criterios.services;

import com.criterios.dto.CapacidadeImportDTO;
import com.criterios.dto.CriterioImportDTO;
import com.criterios.entities.*;
import com.criterios.repository.CapacidadeRepository;
import com.criterios.repository.CriterioRepository;
import com.criterios.repository.DisciplinaRepository;
import com.criterios.repository.NivelAvaliacaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GerenciamentoCriterioService {

    private final CriterioRepository criterioRepository;
    private final CapacidadeRepository capacidadeRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final NivelAvaliacaoRepository nivelRepository;

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

    public boolean validarRegraMinimoCritico(Long disciplinaId) {
        List<Capacidade> capacidades = capacidadeRepository.findByDisciplinaId(disciplinaId);
        
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
    public void salvarImportacaoEmMassa(Long disciplinaId, List<CapacidadeImportDTO> dados) {
        Disciplina disciplina = disciplinaRepository.findById(disciplinaId)
                .orElseThrow(() -> new RuntimeException("Disciplina não encontrada"));

        for (CapacidadeImportDTO capDTO : dados) {
            Capacidade cap = new Capacidade();
            cap.setDisciplina(disciplina);
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
    }

    // [CORRIGIDO] Lógica Híbrida:
    // Fase 1 (5-50): Proporcional para Críticos.
    // Fase 2 (55-100): Regressiva para Desejáveis (Garante escadinha no final).
    @Transactional
    public void gerarNiveisAutomaticos(Long disciplinaId) {
        Disciplina disciplina = disciplinaRepository.findById(disciplinaId)
                .orElseThrow(() -> new RuntimeException("Disciplina não encontrada"));

        // 1. Limpa níveis antigos
        nivelRepository.deleteByDisciplinaId(disciplinaId);

        // 2. Conta totais
        long totalCriticos = criterioRepository.countByDisciplinaAndTipo(disciplinaId, TipoCriterio.CRITICO);
        long totalDesejaveis = criterioRepository.countByDisciplinaAndTipo(disciplinaId, TipoCriterio.DESEJAVEL);

        if (totalCriticos == 0) return;

        // 3. Gera de 5 a 100
        for (int nivel = 5; nivel <= 100; nivel += 5) {
            NivelAvaliacao novoNivel = new NivelAvaliacao();
            novoNivel.setDisciplina(disciplina);
            novoNivel.setNivel(nivel);

            if (nivel <= 50) {
                // FASE 1: Críticos (Proporcional)
                // Exige 100% dos críticos ao chegar no nível 50
                double proporcao = (double) nivel / 50.0;
                int qtdCriticos = (int) Math.ceil(proporcao * totalCriticos);
                
                // Garante pelo menos 1
                if (qtdCriticos == 0 && totalCriticos > 0) qtdCriticos = 1;
                
                novoNivel.setMinCriticos(qtdCriticos);
                novoNivel.setMinDesejaveis(0);
            } else {
                // FASE 2: Críticos Completos + Desejáveis (Regressiva do Topo)
                novoNivel.setMinCriticos((int) totalCriticos); 

                if (totalDesejaveis > 0) {
                    // Lógica Regressiva:
                    // Nível 100 = Total
                    // Nível 95 = Total - 1
                    // Nível 90 = Total - 2 ...
                    
                    // Cada 5 pontos abaixo de 100 reduz 1 critério desejável
                    int degrausAbaixoDe100 = (100 - nivel) / 5;
                    int qtdDesejaveis = (int) totalDesejaveis - degrausAbaixoDe100;

                    // Não permite negativo
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