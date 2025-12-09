package com.criterios.services;

import com.criterios.entities.*;
import com.criterios.repository.*;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ArquivoService {

    private final AlunoRepository alunoRepository;
    private final TurmaRepository turmaRepository;
    private final AvaliacaoRepository avaliacaoRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final CapacidadeRepository capacidadeRepository;
    private final CriterioRepository criterioRepository;

    // --- 1. GERAÇÃO DE EXCEL (Boletim) ---
    public byte[] gerarBoletimExcel(Long alunoId, Long disciplinaId) throws IOException {
        Aluno aluno = alunoRepository.findById(alunoId).orElseThrow(() -> new RuntimeException("Aluno não encontrado"));
        Disciplina disciplina = disciplinaRepository.findById(disciplinaId).orElseThrow(() -> new RuntimeException("Disciplina não encontrada"));
        List<Avaliacao> avaliacoes = avaliacaoRepository.findByAlunoAndDisciplina(alunoId, disciplinaId);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            String safeName = (aluno.getNome() + "_" + disciplina.getSigla()).replaceAll("[^a-zA-Z0-9]", "_");
            if (safeName.length() > 30) safeName = safeName.substring(0, 30);
            
            Sheet sheet = workbook.createSheet(safeName);

            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Boletim: " + aluno.getNome() + " - Disciplina: " + disciplina.getNome());
            titleCell.setCellStyle(headerStyle);

            Row headerRow = sheet.createRow(2);
            String[] colunas = {"Capacidade", "Tipo Capacidade", "Critério", "Tipo Critério", "Atendeu?", "Observação"};
            
            for (int i = 0; i < colunas.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(colunas[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 3;
            for (Avaliacao av : avaliacoes) {
                Row row = sheet.createRow(rowIdx++);
                Criterio crit = av.getCriterio();
                Capacidade cap = crit.getCapacidade();

                row.createCell(0).setCellValue(cap.getDescricao());
                row.createCell(1).setCellValue(cap.getTipo().toString());
                row.createCell(2).setCellValue(crit.getDescricao());
                row.createCell(3).setCellValue(crit.getTipo().toString());
                
                String status = av.getAtendeu() == null ? "N/A" : (av.getAtendeu() ? "SIM" : "NÃO");
                row.createCell(4).setCellValue(status);
                row.createCell(5).setCellValue(av.getObservacao() != null ? av.getObservacao() : "");
            }
            
            for(int i = 0; i < colunas.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    // --- 2. IMPORTAÇÃO DE ALUNOS (PDF) ---
    @Transactional
    public String importarAlunosViaPdf(MultipartFile file, Long turmaId) throws IOException {
        Turma turma = turmaRepository.findById(turmaId)
                .orElseThrow(() -> new RuntimeException("Turma não encontrada"));

        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true); 
            String text = stripper.getText(document);

            int count = 0;
            Pattern pattern = Pattern.compile("(?m)^[\\s\"]*(\\d{8})[\\s\"]*[,|]?[\\s\"]*([^\"|\\n]+)");
            Matcher matcher = pattern.matcher(text);

            while (matcher.find()) {
                String nomeBruto = matcher.group(2);
                if (nomeBruto == null || nomeBruto.trim().isEmpty()) continue;

                String nomeLimpo = nomeBruto.trim().toUpperCase();
                if (eCabecalho(nomeLimpo)) continue;

                salvarAlunoSeNaoExistir(nomeLimpo, turma);
                count++;
            }
            
            if (count == 0) return "Nenhum aluno identificado.";
            return "Processamento concluído. " + count + " alunos importados para a turma " + turma.getNome();
        }
    }

    private boolean eCabecalho(String texto) {
        String t = texto.toUpperCase();
        return t.contains("SENAI") || t.contains("CURSO") || t.contains("DOCENTE") || 
               t.contains("TURMA") || t.contains("MATRÍCULA") || t.contains("NOME DO ALUNO");
    }

    private void salvarAlunoSeNaoExistir(String nomeAluno, Turma turma) {
        String nomeFinal = nomeAluno.replace("\"", "").trim();
        boolean existe = false;
        if(turma.getAlunos() != null) {
            existe = turma.getAlunos().stream()
                .anyMatch(a -> a.getNome().equalsIgnoreCase(nomeFinal));
        }
        
        if (!existe && !nomeFinal.isEmpty()) {
            Aluno novoAluno = new Aluno();
            novoAluno.setNome(nomeFinal);
            novoAluno.setTurma(turma);
            alunoRepository.save(novoAluno);
        }
    }

    // --- 3. IMPORTAÇÃO DE CRITÉRIOS (Lista Simples) ---
    @Transactional
    public String importarCriteriosViaArquivo(MultipartFile file, Long capacidadeId) throws IOException {
        Capacidade capacidade = capacidadeRepository.findById(capacidadeId)
                .orElseThrow(() -> new RuntimeException("Capacidade não encontrada"));

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            
            String line;
            int count = 0;

            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;

                String descricao = line;
                TipoCriterio tipo = TipoCriterio.CRITICO;

                if (line.contains(";")) {
                    String[] parts = line.split(";");
                    descricao = parts[0].trim();
                    if (parts.length > 1 && parts[1].toUpperCase().contains("DESEJ")) {
                        tipo = TipoCriterio.DESEJAVEL;
                    }
                }

                if (salvarCriterioSeNaoExistir(descricao, tipo, capacidade)) {
                    count++;
                }
            }
            return "Importação concluída! " + count + " critérios adicionados.";
        }
    }

 // --- 4. IMPORTAÇÃO DE ESTRUTURA COMPLETA (CSV: Capacidade, Critério) ---
    @Transactional
    public String importarEstruturaCompleta(MultipartFile file, Long disciplinaId) throws IOException {
        Disciplina disciplina = disciplinaRepository.findById(disciplinaId)
                .orElseThrow(() -> new RuntimeException("Disciplina não encontrada"));

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            
            // BUSCA TODAS AS CAPACIDADES EXISTENTES DA DISCIPLINA NO INÍCIO
            List<Capacidade> capacidadesExistentes = capacidadeRepository.findByDisciplinaId(disciplinaId);
            java.util.Map<String, Capacidade> capacidadesMap = new java.util.HashMap<>();
            
            // Popula o mapa com capacidades já existentes
            for (Capacidade cap : capacidadesExistentes) {
                capacidadesMap.put(cap.getDescricao(), cap);
            }
            
            String line;
            int capsCount = 0;
            int critCount = 0;
            Capacidade ultimaCapacidade = null;

            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;

                String[] columns = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", -1);

                String colCapacidade = (columns.length > 0) ? columns[0].replace("\"", "").trim() : "";
                String colCriterio = (columns.length > 1) ? columns[1].replace("\"", "").trim() : "";

                // Caso 1: Ambas colunas preenchidas
                if (!colCapacidade.isEmpty() && !colCriterio.isEmpty()) {
                    // Verifica no mapa (não toca no banco durante o loop)
                    if (!capacidadesMap.containsKey(colCapacidade)) {
                        // Não existe, cria nova
                        Capacidade nova = new Capacidade();
                        nova.setDisciplina(disciplina);
                        nova.setDescricao(colCapacidade);
                        
                        if (colCapacidade.toLowerCase().contains("socio") || 
                            colCapacidade.toLowerCase().contains("comport") || 
                            colCapacidade.toLowerCase().contains("atitude")) {
                            nova.setTipo(TipoCapacidade.SOCIOEMOCIONAL);
                        } else {
                            nova.setTipo(TipoCapacidade.TECNICA);
                        }
                        
                        nova.setCriterios(new ArrayList<>());
                        ultimaCapacidade = capacidadeRepository.save(nova);
                        capacidadesMap.put(colCapacidade, ultimaCapacidade);
                        capsCount++;
                    } else {
                        // Já existe no mapa, reutiliza
                        ultimaCapacidade = capacidadesMap.get(colCapacidade);
                    }
                    
                    // Adiciona critério
                    if (salvarCriterioSeNaoExistir(colCriterio, TipoCriterio.CRITICO, ultimaCapacidade)) {
                        critCount++;
                    }
                }
                // Caso 2: Apenas primeira coluna preenchida
                else if (!colCapacidade.isEmpty() && colCriterio.isEmpty()) {
                    if (!capacidadesMap.containsKey(colCapacidade)) {
                        Capacidade nova = new Capacidade();
                        nova.setDisciplina(disciplina);
                        nova.setDescricao(colCapacidade);
                        
                        if (colCapacidade.toLowerCase().contains("socio") || 
                            colCapacidade.toLowerCase().contains("comport") || 
                            colCapacidade.toLowerCase().contains("atitude")) {
                            nova.setTipo(TipoCapacidade.SOCIOEMOCIONAL);
                        } else {
                            nova.setTipo(TipoCapacidade.TECNICA);
                        }
                        
                        nova.setCriterios(new ArrayList<>());
                        ultimaCapacidade = capacidadeRepository.save(nova);
                        capacidadesMap.put(colCapacidade, ultimaCapacidade);
                        capsCount++;
                    } else {
                        ultimaCapacidade = capacidadesMap.get(colCapacidade);
                    }
                }
                // Caso 3: Apenas segunda coluna preenchida
                else if (colCapacidade.isEmpty() && !colCriterio.isEmpty() && ultimaCapacidade != null) {
                    if (salvarCriterioSeNaoExistir(colCriterio, TipoCriterio.CRITICO, ultimaCapacidade)) {
                        critCount++;
                    }
                }
            }
            return "Sucesso! Criadas " + capsCount + " capacidades e " + critCount + " critérios.";
        }
    }
    // Método corrigido: retorna boolean para contar critérios adicionados
    private boolean salvarCriterioSeNaoExistir(String descricao, TipoCriterio tipo, Capacidade capacidade) {
        boolean existe = false;
        
        if (capacidade.getCriterios() != null) {
            existe = capacidade.getCriterios().stream()
                    .anyMatch(c -> c.getDescricao().equalsIgnoreCase(descricao));
        }

        if (!existe && !descricao.isEmpty()) {
            Criterio novo = new Criterio();
            novo.setCapacidade(capacidade);
            novo.setDescricao(descricao);
            novo.setTipo(tipo);
            criterioRepository.save(novo);
            
            // Atualiza a lista em memória se formos usar o objeto capacidade de novo
            if (capacidade.getCriterios() != null) {
                capacidade.getCriterios().add(novo);
            }
            return true;
        }
        return false;
    }
}