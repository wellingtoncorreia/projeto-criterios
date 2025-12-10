package com.criterios.services;

import com.criterios.dto.AvaliacaoDTO;
import com.criterios.dto.ResultadoBoletimDTO;
import com.criterios.entities.*;
import com.criterios.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvaliacaoServices {

    private final AvaliacaoRepository avaliacaoRepository;
    private final AlunoRepository alunoRepository;
    private final CriterioRepository criterioRepository;
    private final NivelAvaliacaoRepository nivelRepository;

    @Transactional(timeout = 30)
    public Avaliacao registrarAvaliacao(AvaliacaoDTO dto) {
        // Validação 1: Aluno existe e pertence à turma
        Aluno aluno = alunoRepository.findById(dto.getAlunoId())
                .orElseThrow(() -> new RuntimeException("Aluno não encontrado"));
        
        if (aluno.getTurma() == null) {
            throw new RuntimeException("Aluno não pertence a nenhuma turma");
        }

        // Validação 2: Critério existe
        Criterio criterio = criterioRepository.findById(dto.getCriterioId())
                .orElseThrow(() -> new RuntimeException("Critério não encontrado"));

        // Validação 3: Critério pertence à disciplina informada (prevenção de integração)
        if (criterio.getCapacidade() == null || criterio.getCapacidade().getDisciplina() == null) {
            throw new RuntimeException("Critério sem disciplina vinculada");
        }

        if (!criterio.getCapacidade().getDisciplina().getId().equals(dto.getDisciplinaId())) {
            throw new RuntimeException("Critério não pertence à disciplina informada");
        }

        // Busca ou cria avaliação existente
        Avaliacao avaliacao = avaliacaoRepository
                .findByAlunoIdAndCriterioId(dto.getAlunoId(), dto.getCriterioId())
                .orElse(new Avaliacao());

        // Atualiza valores
        avaliacao.setAluno(aluno);
        avaliacao.setCriterio(criterio);
        avaliacao.setAtendeu(dto.getAtendeu());
        avaliacao.setObservacao(dto.getObservacao() != null ? dto.getObservacao() : "");
        
        // Garante que se houve alteração, a avaliação não está finalizada
        avaliacao.setFinalizada(false); 
        avaliacao.setNivelFinal(null);

        return avaliacaoRepository.save(avaliacao);
    }

    @Transactional(readOnly = true)
    public ResultadoBoletimDTO calcularNivelAluno(Long alunoId, Long disciplinaId) {
        List<Avaliacao> avaliacoes = avaliacaoRepository.findByAlunoAndDisciplina(alunoId, disciplinaId);

        int criticosAtendidos = 0;
        int desejaveisAtendidos = 0;

        for (Avaliacao a : avaliacoes) {
            if (Boolean.TRUE.equals(a.getAtendeu())) {
                if (a.getCriterio().getTipo() == TipoCriterio.CRITICO) {
                    criticosAtendidos++;
                } else if (a.getCriterio().getTipo() == TipoCriterio.DESEJAVEL) {
                    desejaveisAtendidos++;
                }
            }
        }

        List<Criterio> todosCriterios = criterioRepository.findByDisciplinaId(disciplinaId);
        int totalCriticos = (int) todosCriterios.stream().filter(c -> c.getTipo() == TipoCriterio.CRITICO).count();
        int totalDesejaveis = (int) todosCriterios.stream().filter(c -> c.getTipo() == TipoCriterio.DESEJAVEL).count();
        
        String nomeDisciplina = todosCriterios.isEmpty() ? "N/A" : todosCriterios.get(0).getCapacidade().getDisciplina().getNome();
        String nomeAluno = alunoRepository.findById(alunoId).map(Aluno::getNome).orElse("N/A");

        List<NivelAvaliacao> niveis = nivelRepository.findByDisciplinaIdOrderByNivelDesc(disciplinaId);
        Integer nivelFinal = 0;

        for (NivelAvaliacao n : niveis) {
            boolean passouCriticos = criticosAtendidos >= n.getMinCriticos();
            boolean passouDesejaveis = desejaveisAtendidos >= n.getMinDesejaveis();

            if (passouCriticos && passouDesejaveis) {
                nivelFinal = n.getNivel();
                break;
            }
        }
        
        double totalItens = totalCriticos + totalDesejaveis;
        double atendidosTotal = criticosAtendidos + desejaveisAtendidos;
        double percentual = (totalItens > 0) ? (atendidosTotal / totalItens) * 100 : 0.0;

        return ResultadoBoletimDTO.builder()
                .nomeAluno(nomeAluno)
                .nomeDisciplina(nomeDisciplina)
                .qtdCriticosAtendidos(criticosAtendidos)
                .qtdDesejaveisAtendidos(desejaveisAtendidos)
                .totalCriticosDisciplina(totalCriticos)
                .totalDesejaveisDisciplina(totalDesejaveis)
                .nivelAlcancado(nivelFinal)
                .percentualConclusao(percentual)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ResultadoBoletimDTO> gerarBoletimTurma(Long turmaId, Long disciplinaId) {
        List<Aluno> alunos = alunoRepository.findByTurmaId(turmaId);
        
        return alunos.stream()
                .map(aluno -> calcularNivelAluno(aluno.getId(), disciplinaId))
                .collect(Collectors.toList());
    }
    
    // [NOVO MÉTODO] Finaliza UMA avaliação
    @Transactional
    public ResultadoBoletimDTO finalizarAvaliacao(Long alunoId, Long disciplinaId) {
        
        ResultadoBoletimDTO resultado = calcularNivelAluno(alunoId, disciplinaId);
        List<Avaliacao> avaliacoes = avaliacaoRepository.findByAlunoAndDisciplina(alunoId, disciplinaId);

        if (avaliacoes.isEmpty()) {
            throw new RuntimeException("Nenhuma nota encontrada para finalizar.");
        }

        for (Avaliacao av : avaliacoes) {
            av.setFinalizada(true);
            av.setNivelFinal(resultado.getNivelAlcancado());
            avaliacaoRepository.save(av);
        }
        
        return resultado; 
    }

    // [NOVO MÉTODO] Reabre UMA avaliação
    @Transactional
    public void reabrirAvaliacao(Long alunoId, Long disciplinaId) {
        
        List<Avaliacao> avaliacoes = avaliacaoRepository.findByAlunoAndDisciplina(alunoId, disciplinaId);

        if (avaliacoes.isEmpty()) {
            throw new RuntimeException("Nenhuma nota para reabrir.");
        }
        
        for (Avaliacao av : avaliacoes) {
            av.setFinalizada(false);
            av.setNivelFinal(null);
            avaliacaoRepository.save(av);
        }
    }
    
    // [NOVO MÉTODO] Finaliza TODAS as avaliações da turma
    @Transactional
    public List<ResultadoBoletimDTO> finalizarAvaliacaoTurma(Long turmaId, Long disciplinaId) {
        
        List<Aluno> alunos = alunoRepository.findByTurmaId(turmaId);
        
        if (alunos.isEmpty()) {
            throw new RuntimeException("Não há alunos para finalizar nesta turma.");
        }

        // Itera sobre todos os alunos e tenta finalizar a avaliação para cada um
        return alunos.stream()
                .map(aluno -> {
                    try {
                        return finalizarAvaliacao(aluno.getId(), disciplinaId);
                    } catch (RuntimeException e) {
                        // Se um aluno não tiver notas, ele é ignorado (retorna null)
                        System.err.println("Aviso: Falha ao finalizar aluno " + aluno.getNome() + ": " + e.getMessage());
                        return null; 
                    }
                })
                .filter(result -> result != null) // Retira os alunos que falharam/não tinham notas
                .collect(Collectors.toList());
    }
}