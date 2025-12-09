package com.criterios.services;

import com.criterios.dto.TurmaDTO;
import com.criterios.dto.TurmaResponseDTO;
import com.criterios.dto.UsuarioResponseDTO;
import com.criterios.entities.TipoUsuario;
import com.criterios.entities.Turma;
import com.criterios.entities.Usuario;
import com.criterios.repository.TurmaRepository;
import com.criterios.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TurmaService {

    @Autowired
    private TurmaRepository turmaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;
    
    // --- Mapper (Entity -> DTO) ---
    public static TurmaResponseDTO toResponseDTO(Turma turma) {
        // 1. Mapeia a lista de professores para DTOs
        List<UsuarioResponseDTO> professoresDTO = turma.getProfessores().stream()
            .map(p -> {
                UsuarioResponseDTO dto = new UsuarioResponseDTO();
                dto.setId(p.getId());
                dto.setNome(p.getNome());
                dto.setEmail(p.getEmail());
                dto.setTipo(p.getTipo());
                return dto;
            })
            .collect(java.util.stream.Collectors.toList());

        // 2. Mapeia a Turma para DTO
        TurmaResponseDTO dto = new TurmaResponseDTO();
        dto.setId(turma.getId());
        dto.setNome(turma.getNome());
        dto.setAnoSemestre(turma.getAnoSemestre());
        dto.setTermoAtual(turma.getTermoAtual());
        dto.setProfessores(professoresDTO);
        dto.setTotalAlunos(turma.getAlunos() != null ? turma.getAlunos().size() : 0); 
        
        return dto;
    }
    // -------------------------------


    @Transactional
    public Turma criarTurma(TurmaDTO dto) {
        // 1. Validação da Regra: Mínimo 1, Máximo 2 professores
        if (dto.getProfessoresIds() == null || dto.getProfessoresIds().isEmpty()) {
            throw new RuntimeException("A turma deve ter no mínimo 1 professor responsável.");
        }
        if (dto.getProfessoresIds().size() > 2) {
            throw new RuntimeException("A turma pode ter no máximo 2 professores.");
        }

        // 2. Busca os professores
        List<Usuario> professores = usuarioRepository.findAllById(dto.getProfessoresIds());

        if (professores.size() != dto.getProfessoresIds().size()) {
            throw new RuntimeException("Um ou mais professores informados não existem.");
        }

        // 3. Cria a turma
        Turma turma = new Turma();
        turma.setNome(dto.getNome());
        turma.setAnoSemestre(dto.getAnoSemestre());
        turma.setTermoAtual(dto.getTermoAtual());
        turma.setProfessores(professores);

        return turmaRepository.save(turma);
    }

    @Transactional
    public Turma atualizarTurma(Long id, TurmaDTO dto) {
        Turma turma = turmaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Turma não encontrada"));

        // 1. Validação da Regra: Mínimo 1, Máximo 2 professores
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

        // 2. Atualiza dados básicos
        turma.setNome(dto.getNome());
        turma.setAnoSemestre(dto.getAnoSemestre());
        turma.setTermoAtual(dto.getTermoAtual());
        

        return turmaRepository.save(turma);
    }


    // Regra de Visibilidade (Retorna DTO)
    public List<TurmaResponseDTO> listarTurmasPorUsuario(Usuario usuario) {
        List<Turma> turmas;

        if (usuario.getTipo() == TipoUsuario.GESTOR) {
            turmas = turmaRepository.findAll();
        } else {
            turmas = turmaRepository.findAllByProfessoresId(usuario.getId());
        }
        
        // Mapeia a lista de Entities para DTOs (evita loop de serialização)
        return turmas.stream()
                .map(TurmaService::toResponseDTO)
                .collect(Collectors.toList());
    }
}