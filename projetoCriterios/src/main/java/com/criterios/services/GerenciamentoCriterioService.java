package com.criterios.services;

import com.criterios.dto.CapacidadeImportDTO;
import com.criterios.dto.CriterioImportDTO;
import com.criterios.entities.*;
import com.criterios.repository.CapacidadeRepository;
import com.criterios.repository.CriterioRepository;
import com.criterios.repository.DisciplinaRepository;
import com.criterios.repository.NivelAvaliacaoRepository;
import com.criterios.repository.EstruturaDisciplinaRepository; // Necessário
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
    private final EstruturaDisciplinaRepository estruturaDisciplinaRepository; // Repositório adicionado

    @Transactional
    public Criterio criarCriterio(Long capacidadeId, String descricao, TipoCriterio tipo) {
        // Este é um método de "adição manual" ao template da Capacidade
        Capacidade capacidade = capacidadeRepository.findById(capacidadeId)
                .orElseThrow(() -> new RuntimeException("Capacidade não encontrada"));

        Criterio criterio = new Criterio();
        criterio.setCapacidade(capacidade);
        criterio.setDescricao(descricao);
        criterio.setTipo(tipo);

        return criterioRepository.save(criterio);
    }

    // [AJUSTE DE VERSIONAMENTO] A validação é feita no TEMPLATE
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
        // 1. Busca a disciplina (Template)
        Disciplina disciplinaTemplate = disciplinaRepository.findById(disciplinaTemplateId)
                .orElseThrow(() -> new RuntimeException("Disciplina (Template) não encontrada"));

        // 2. [REPLACE] Encontra e Deleta TODA a estrutura TEMPLATE antiga.
        EstruturaDisciplina estruturaAntiga = estruturaDisciplinaRepository.findByDisciplinaTemplateId(disciplinaTemplateId);
        if (estruturaAntiga != null) {
            // Remove a estrutura antiga e seus filhos (Capacidades, Critérios, Níveis) via cascade
            estruturaDisciplinaRepository.delete(estruturaAntiga);
        }
        
        // 3. RECRIAR O NOVO TEMPLATE DA ESTRUTURA (Com novo ID gerenciado)
        EstruturaDisciplina novaEstruturaTemplate = new EstruturaDisciplina();
        // Vincula a nova estrutura ao ID do Template para que seja a única ativa
        novaEstruturaTemplate.setDisciplinaTemplateId(disciplinaTemplateId);
        novaEstruturaTemplate.setNomeDisciplina(disciplinaTemplate.getNome());
        novaEstruturaTemplate.setSiglaDisciplina(disciplinaTemplate.getSigla());

        // [CORREÇÃO CRÍTICA] Salva o novo objeto EstruturaDisciplina para que o JPA o gerencie e atribua um novo ID.
        novaEstruturaTemplate = estruturaDisciplinaRepository.save(novaEstruturaTemplate); 
        
        // 4. Salva a nova estrutura de Capacidades e Critérios
        for (CapacidadeImportDTO capDTO : dados) {
            Capacidade cap = new Capacidade();
            // [CORREÇÃO] Liga a Capacidade ao novo objeto gerenciado
            cap.setEstruturaDisciplina(novaEstruturaTemplate); 
            
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
        
        // 5. Gera os Níveis para a nova Estrutura (usando o novo ID)
        // Isso é crucial para que a validação de níveis do front-end funcione imediatamente.
        gerarNiveisAutomaticos(novaEstruturaTemplate.getId());
    }

    // [AJUSTE DE VERSIONAMENTO] Gera Níveis para o Template
    @Transactional
    public void gerarNiveisAutomaticos(Long estruturaDisciplinaId) { // Recebe ID da Estrutura (Snapshot ou Template)
        
        // 1. Limpa níveis antigos
        nivelRepository.deleteByEstruturaDisciplinaId(estruturaDisciplinaId); 

        // 2. Conta totais (Usando o método que agora existe no CriterioRepository)
        long totalCriticos = criterioRepository.countByEstruturaDisciplinaAndTipo(estruturaDisciplinaId, TipoCriterio.CRITICO);
        long totalDesejaveis = criterioRepository.countByEstruturaDisciplinaAndTipo(estruturaDisciplinaId, TipoCriterio.DESEJAVEL);

        if (totalCriticos == 0) return;

        // Placeholder para o link correto (o objeto que acabou de ser criado)
        EstruturaDisciplina estruturaPlaceholder = new EstruturaDisciplina();
        estruturaPlaceholder.setId(estruturaDisciplinaId);
        
        // 3. Gera de 5 a 100
        for (int nivel = 5; nivel <= 100; nivel += 5) {
            NivelAvaliacao novoNivel = new NivelAvaliacao();
            novoNivel.setEstruturaDisciplina(estruturaPlaceholder); 
            novoNivel.setNivel(nivel);
            
            if (nivel <= 50) {
                // FASE 1: Críticos (Proporcional)
                double proporcao = (double) nivel / 50.0;
                int qtdCriticos = (int) Math.ceil(proporcao * totalCriticos);
                
                if (qtdCriticos == 0 && totalCriticos > 0) qtdCriticos = 1;
                
                novoNivel.setMinCriticos(qtdCriticos);
                novoNivel.setMinDesejaveis(0);
            } else {
                // FASE 2: Críticos Completos + Desejáveis
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