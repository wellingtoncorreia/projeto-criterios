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
    private final SnapshotDisciplinaRepository snapshotDisciplinaRepository;

    /**
     * Registra ou atualiza uma avaliação de um critério específico para um aluno.
     * Valida se o critério pertence ao snapshot correto da turma.
     */
    @Transactional(timeout = 30)
    public Avaliacao registrarAvaliacao(AvaliacaoDTO dto) {
        Aluno aluno = alunoRepository.findById(dto.getAlunoId())
                .orElseThrow(() -> new RuntimeException("Aluno não encontrado"));
        
        if (aluno.getTurma() == null) {
            throw new RuntimeException("Aluno não pertence a nenhuma turma");
        }
        
        Criterio criterio = criterioRepository.findById(dto.getCriterioId())
                .orElseThrow(() -> new RuntimeException("Critério não encontrado"));

        // Validação: Garante que o critério pertence a um Snapshot e não ao Template original
        if (criterio.getCapacidade() == null || criterio.getCapacidade().getSnapshotDisciplina() == null) {
            throw new RuntimeException("Erro: Este critério pertence ao Template e não pode ser usado para avaliações.");
        }

        // Validação: Verifica se o Snapshot do critério é o mesmo informado na requisição
        if (!criterio.getCapacidade().getSnapshotDisciplina().getId().equals(dto.getEstruturaDisciplinaId())) {
            throw new RuntimeException("Critério não pertence à estrutura de avaliação desta turma.");
        }

        Avaliacao avaliacao = avaliacaoRepository
                .findByAlunoIdAndCriterioId(dto.getAlunoId(), dto.getCriterioId())
                .orElse(new Avaliacao());

        avaliacao.setAluno(aluno);
        avaliacao.setCriterio(criterio);
        avaliacao.setAtendeu(dto.getAtendeu());
        avaliacao.setObservacao(dto.getObservacao() != null ? dto.getObservacao() : "");
        
        // Sempre que uma nota é alterada, o status de finalização é resetado
        avaliacao.setFinalizada(false);
        avaliacao.setNivelFinal(null);

        return avaliacaoRepository.save(avaliacao);
    }

    /**
     * Calcula o nível alcançado pelo aluno com base nos critérios atendidos no Snapshot.
     * Regra: O aluno deve atingir o mínimo de críticos e desejáveis exigidos por cada nível.
     */
    @Transactional(readOnly = true)
    public ResultadoBoletimDTO calcularNivelAluno(Long alunoId, Long snapshotDisciplinaId) {
        // Busca apenas avaliações vinculadas ao snapshot específico
        List<Avaliacao> avaliacoes = avaliacaoRepository.findByAlunoAndEstruturaDisciplina(alunoId, snapshotDisciplinaId);

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

        // Busca a régua de níveis definida para este Snapshot específico (em ordem decrescente)
        List<NivelAvaliacao> niveis = nivelRepository.findBySnapshotDisciplinaIdOrderByNivelDesc(snapshotDisciplinaId);
        
        // Busca todos os critérios do snapshot para calcular totais e percentual
        List<Criterio> todosCriterios = criterioRepository.findBySnapshotDisciplinaId(snapshotDisciplinaId);
        int totalCriticos = (int) todosCriterios.stream().filter(c -> c.getTipo() == TipoCriterio.CRITICO).count();
        int totalDesejaveis = (int) todosCriterios.stream().filter(c -> c.getTipo() == TipoCriterio.DESEJAVEL).count();
        
        Integer nivelFinal = 0;
        for (NivelAvaliacao n : niveis) {
            // Regra de Negócio: O aluno deve ter atendido PELO MENOS o mínimo de cada tipo
            if (criticosAtendidos >= n.getMinCriticos() && desejaveisAtendidos >= n.getMinDesejaveis()) {
                nivelFinal = n.getNivel();
                break; // Encontrou o maior nível possível
            }
        }
        
        String nomeDisciplina = snapshotDisciplinaRepository.findById(snapshotDisciplinaId)
                .map(SnapshotDisciplina::getNomeDisciplina).orElse("N/A");
        String nomeAluno = alunoRepository.findById(alunoId).map(Aluno::getNome).orElse("N/A");

        double totalItens = totalCriticos + totalDesejaveis;
        double percentual = (totalItens > 0) ? ((double)(criticosAtendidos + desejaveisAtendidos) / totalItens) * 100 : 0.0;

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

    @Transactional
    public ResultadoBoletimDTO finalizarAvaliacao(Long alunoId, Long snapshotDisciplinaId) {
        ResultadoBoletimDTO resultado = calcularNivelAluno(alunoId, snapshotDisciplinaId);
        List<Avaliacao> avaliacoes = avaliacaoRepository.findByAlunoAndEstruturaDisciplina(alunoId, snapshotDisciplinaId);

        if (avaliacoes.isEmpty()) {
            throw new RuntimeException("Nenhuma avaliação encontrada para este aluno neste snapshot.");
        }

        for (Avaliacao av : avaliacoes) {
            av.setFinalizada(true);
            av.setNivelFinal(resultado.getNivelAlcancado());
            avaliacaoRepository.save(av);
        }
        return resultado;
    }

    @Transactional
    public void reabrirAvaliacao(Long alunoId, Long snapshotDisciplinaId) {
        List<Avaliacao> avaliacoes = avaliacaoRepository.findByAlunoAndEstruturaDisciplina(alunoId, snapshotDisciplinaId);
        if (avaliacoes.isEmpty()) throw new RuntimeException("Nenhuma avaliação encontrada para reabrir.");

        for (Avaliacao av : avaliacoes) {
            av.setFinalizada(false);
            av.setNivelFinal(null);
            avaliacaoRepository.save(av);
        }
    }

    @Transactional(readOnly = true)
    public List<ResultadoBoletimDTO> gerarBoletimTurma(Long turmaId, Long snapshotDisciplinaId) {
        List<Aluno> alunos = alunoRepository.findByTurmaId(turmaId);
        return alunos.stream()
                .map(aluno -> calcularNivelAluno(aluno.getId(), snapshotDisciplinaId))
                .collect(Collectors.toList());
    }

    @Transactional
    public List<ResultadoBoletimDTO> finalizarAvaliacaoTurma(Long turmaId, Long snapshotDisciplinaId) {
        List<Aluno> alunos = alunoRepository.findByTurmaId(turmaId);
        if (alunos.isEmpty()) throw new RuntimeException("Turma sem alunos.");

        return alunos.stream()
                .map(aluno -> {
                    try {
                        return finalizarAvaliacao(aluno.getId(), snapshotDisciplinaId);
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(res -> res != null)
                .collect(Collectors.toList());
    }
}