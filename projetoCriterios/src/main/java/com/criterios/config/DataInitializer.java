package com.criterios.config;

import com.criterios.entities.*;
import com.criterios.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final DisciplinaRepository disciplinaRepository;
    private final NivelAvaliacaoRepository nivelRepository;
    private final CapacidadeRepository capacidadeRepository;
    private final CriterioRepository criterioRepository;
    
    // Dependências de Usuário e Segurança
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        
        // --- 0. CRIAR USUÁRIO GESTOR PADRÃO ---
        if (usuarioRepository.count() == 0) {
            System.out.println(":: CRIANDO USUÁRIO GESTOR PADRÃO ::");
            Usuario admin = new Usuario();
            admin.setNome("Administrador Geral");
            admin.setEmail("admin@senai.br"); 
            admin.setSenha(passwordEncoder.encode("123456")); 
            
            // [CORREÇÃO IMPORTANTE] Define como GESTOR para poder cadastrar outros professores
            admin.setTipo(TipoUsuario.GESTOR); 
            
            usuarioRepository.save(admin);
            System.out.println("   -> Login: admin@senai.br / Senha: 123456 (Perfil: GESTOR)");
        }

        // --- SEED DE DADOS ACADÊMICOS ---
        if (disciplinaRepository.count() == 0) {
            System.out.println(":: INICIANDO SEED DE DADOS ACADÊMICOS ::");

            // --- 1. CRIAR DISCIPLINA ---
            Disciplina disciplina = new Disciplina();
            disciplina.setNome("Lógica de Programação e Algoritmos");
            disciplina.setSigla("LPA");
            disciplina.setPeriodicidade(Periodicidade.SEMESTRAL); 
            disciplina.setTermo(1);
            disciplina = disciplinaRepository.save(disciplina);

            // --- 2. CRIAR CAPACIDADES ---
            
            // Técnica
            Capacidade capTecnica = new Capacidade();
            capTecnica.setDisciplina(disciplina);
            capTecnica.setDescricao("Identificar a sequência lógica de passos em um algoritmo");
            capTecnica.setTipo(TipoCapacidade.TECNICA);
            capTecnica = capacidadeRepository.save(capTecnica);

            // Socioemocional
            Capacidade capSocial = new Capacidade();
            capSocial.setDisciplina(disciplina);
            capSocial.setDescricao("Demonstrar resiliência emocional frente a erros de código");
            capSocial.setTipo(TipoCapacidade.SOCIOEMOCIONAL);
            capSocial = capacidadeRepository.save(capSocial);

            // --- 3. CRIAR CRITÉRIOS ---

            // Critérios Técnicos
            Criterio c1 = new Criterio();
            c1.setCapacidade(capTecnica);
            c1.setDescricao("Identificou corretamente o início e fim do algoritmo");
            c1.setTipo(TipoCriterio.CRITICO);
            criterioRepository.save(c1);

            Criterio c2 = new Criterio();
            c2.setCapacidade(capTecnica);
            c2.setDescricao("Utilizou indentação correta no código");
            c2.setTipo(TipoCriterio.DESEJAVEL);
            criterioRepository.save(c2);

            // Critérios Socioemocionais
            Criterio c3 = new Criterio();
            c3.setCapacidade(capSocial);
            c3.setDescricao("Manteve a calma ao depurar erros de sintaxe");
            c3.setTipo(TipoCriterio.CRITICO);
            criterioRepository.save(c3);

            Criterio c4 = new Criterio();
            c4.setCapacidade(capSocial);
            c4.setDescricao("Auxiliou colegas com dificuldades na lógica");
            c4.setTipo(TipoCriterio.DESEJAVEL);
            criterioRepository.save(c4);

            // --- 4. POPULAR TABELA DE NÍVEIS (Regra Híbrida) ---
            
            long totalCriticos = 2; 
            long totalDesejaveis = 2; 

            for (int nivel = 5; nivel <= 100; nivel += 5) {
                NivelAvaliacao nivelObj = new NivelAvaliacao();
                nivelObj.setDisciplina(disciplina);
                nivelObj.setNivel(nivel);

                if (nivel <= 50) {
                    // Fase 1: Críticos (Proporcional até 50)
                    double proporcao = (double) nivel / 50.0;
                    int qtdCriticos = (int) Math.ceil(proporcao * totalCriticos);
                    if (qtdCriticos == 0 && totalCriticos > 0) qtdCriticos = 1;
                    
                    nivelObj.setMinCriticos(qtdCriticos);
                    nivelObj.setMinDesejaveis(0);
                } else {
                    // Fase 2: Críticos Totais + Desejáveis (Regressiva do 100)
                    nivelObj.setMinCriticos((int) totalCriticos);
                    
                    if (totalDesejaveis > 0) {
                        // Calcula quantos degraus de 5% estamos abaixo de 100
                        int degrausAbaixoDe100 = (100 - nivel) / 5;
                        // Subtrai do total de desejáveis
                        int qtdDesejaveis = (int) totalDesejaveis - degrausAbaixoDe100;
                        
                        // Não permite negativo
                        if (qtdDesejaveis < 0) qtdDesejaveis = 0;
                        
                        nivelObj.setMinDesejaveis(qtdDesejaveis);
                    } else {
                        nivelObj.setMinDesejaveis(0);
                    }
                }
                nivelRepository.save(nivelObj);
            }
            
            System.out.println(":: DADOS INICIAIS CARREGADOS COM SUCESSO ::");
        }
    }
}