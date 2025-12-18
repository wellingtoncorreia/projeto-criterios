package com.criterios.services;

import com.criterios.entities.Disciplina;
import com.criterios.entities.EstruturaTemplate;
import com.criterios.repository.EstruturaTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EstruturaTemplateService {

    private final EstruturaTemplateRepository estruturaTemplateRepository; 

    /**
     * Método auxiliar para criar o Template Inicial na importação em massa.
     * Removeu-se a dependência não utilizada 'disciplinaRepository' para limpar avisos do VS Code.
     */
    @Transactional
    public EstruturaTemplate criarTemplateInicial(Long disciplinaId, Disciplina disciplina) {
        EstruturaTemplate template = new EstruturaTemplate();
        
        // Define os campos conforme a entidade EstruturaTemplate
        template.setDisciplinaTemplateId(disciplinaId);
        template.setNomeDisciplina(disciplina.getNome());
        template.setSiglaDisciplina(disciplina.getSigla());
        
        return estruturaTemplateRepository.save(template);
    }
    
    /**
     * Busca a estrutura ativa de uma disciplina template.
     */
    @Transactional(readOnly = true)
    public EstruturaTemplate buscarTemplateAtivo(Long disciplinaTemplateId) {
        return estruturaTemplateRepository.findByDisciplinaTemplateId(disciplinaTemplateId);
    }
}