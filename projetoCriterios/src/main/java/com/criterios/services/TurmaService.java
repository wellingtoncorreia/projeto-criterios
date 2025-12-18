package com.criterios.services;

import com.criterios.dto.TurmaDTO;
import com.criterios.dto.TurmaResponseDTO;
import com.criterios.dto.UsuarioResponseDTO;
import com.criterios.entities.SnapshotDisciplina; 
import com.criterios.entities.TipoUsuario;
import com.criterios.entities.Turma;
import com.criterios.entities.Usuario;
import com.criterios.repository.TurmaRepository;
import com.criterios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TurmaService {

    private final TurmaRepository turmaRepository;
    private final UsuarioRepository usuarioRepository;
    private final SnapshotService snapshotService; 

    public static TurmaResponseDTO toResponseDTO(Turma turma) {
        List<UsuarioResponseDTO> professoresDTO = turma.getProfessores().stream()
            .map(p -> {
                UsuarioResponseDTO dto = new UsuarioResponseDTO();
                dto.setId(p.getId());
                dto.setNome(p.getNome());
                dto.setEmail(p.getEmail());
                dto.setTipo(p.getTipo());
                return dto;
            })
            .collect(Collectors.toList());

        TurmaResponseDTO dto = new TurmaResponseDTO();
        dto.setId(turma.getId());
        dto.setNome(turma.getNome());
        dto.setAnoSemestre(turma.getAnoSemestre());
        dto.setTermoAtual(turma.getTermoAtual());
        dto.setProfessores(professoresDTO);
        dto.setTotalAlunos(turma.getAlunos() != null ? turma.getAlunos().size() : 0);
        
        dto.setDisciplinaId(turma.getDisciplinaId());
        
        if (turma.getSnapshotDisciplina() != null) {
             dto.setEstruturaSnapshotId(turma.getSnapshotDisciplina().getId()); 
             dto.setNomeDisciplina(turma.getSnapshotDisciplina().getNomeDisciplina());
        }
        
        return dto;
    }

    @Transactional
    public Turma criarTurma(TurmaDTO dto) {
        if (dto.getProfessoresIds() == null || dto.getProfessoresIds().isEmpty()) {
            throw new RuntimeException("A turma deve ter no mínimo 1 professor responsável.");
        }
        if (dto.getProfessoresIds().size() > 2) {
            throw new RuntimeException("A turma pode ter no máximo 2 professores.");
        }

        List<Usuario> professores = usuarioRepository.findAllById(dto.getProfessoresIds());
        if (professores.size() != dto.getProfessoresIds().size()) {
            throw new RuntimeException("Um ou mais professores informados não existem.");
        }
        
        // Permite criar turma sem disciplina inicialmente (dto.getDisciplinaTemplateId() pode ser nulo)
        
        Turma turma = new Turma();
        turma.setNome(dto.getNome());
        turma.setAnoSemestre(dto.getAnoSemestre());
        turma.setTermoAtual(dto.getTermoAtual());
        turma.setProfessores(professores);
        
        // Se a disciplina vier preenchida, já gera o snapshot e vincula
        if (dto.getDisciplinaTemplateId() != null) {
            SnapshotDisciplina snapshot = snapshotService.criarSnapshot(dto.getDisciplinaTemplateId());
            turma.setDisciplinaId(dto.getDisciplinaTemplateId());
            turma.setSnapshotDisciplina(snapshot);
        } else {
            turma.setDisciplinaId(null);
            turma.setSnapshotDisciplina(null);
        }

        return turmaRepository.save(turma);
    }
    
    @Transactional
    public Turma atualizarTurma(Long id, TurmaDTO dto) {
        Turma turma = turmaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Turma não encontrada"));

        if (dto.getProfessoresIds() != null && !dto.getProfessoresIds().isEmpty()) {
            if (dto.getProfessoresIds().size() > 2) {
                throw new RuntimeException("A turma pode ter no máximo 2 professores.");
            }

            List<Usuario> professores = usuarioRepository.findAllById(dto.getProfessoresIds());
            if (professores.size() != dto.getProfessoresIds().size()) {
                throw new RuntimeException("Um ou mais professores informados não existem.");
            }
            turma.setProfessores(professores);
        }
        
        turma.setNome(dto.getNome());
        turma.setAnoSemestre(dto.getAnoSemestre());
        turma.setTermoAtual(dto.getTermoAtual());
        
        return turmaRepository.save(turma);
    }

    @Transactional(readOnly = true)
    public List<TurmaResponseDTO> listarTurmasPorUsuario(Usuario usuario) {
        List<Turma> turmas;

        if (usuario.getTipo() == TipoUsuario.GESTOR) {
            turmas = turmaRepository.findAll();
        } else {
            turmas = turmaRepository.findAllByProfessoresId(usuario.getId());
        }
        
        return turmas.stream()
                .map(TurmaService::toResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Gera um snapshot manualmente para uma turma existente.
     * [CORRIGIDO] Agora atualiza também o ID da disciplina na turma.
     */
    @Transactional
    public Turma gerarSnapshotManual(Long turmaId, Long templateId) {
        Turma turma = turmaRepository.findById(turmaId)
                .orElseThrow(() -> new RuntimeException("Turma não encontrada"));

        // 1. Gera o snapshot profundo
        SnapshotDisciplina novoSnapshot = snapshotService.criarSnapshot(templateId);

        // 2. Atualiza a referência do snapshot
        turma.setSnapshotDisciplina(novoSnapshot);
        
        // 3. [IMPORTANTE] Atualiza o ID da disciplina para que a turma deixe de ser "órfã"
        // Isso corrige o erro onde o snapshot não aparecia se a turma fosse criada sem disciplina
        turma.setDisciplinaId(templateId); 

        return turmaRepository.save(turma);
    }

    @Transactional(readOnly = true)
    public TurmaResponseDTO buscarTurmaPorId(Long id) {
         Turma turma = turmaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Turma não encontrada"));
         return toResponseDTO(turma);
    }
}