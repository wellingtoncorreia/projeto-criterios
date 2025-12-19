// projetoCriterios/src/main/java/com/criterios/services/ArquivoService.java
package com.criterios.services;

import com.criterios.dto.CritItemDTO;
import com.criterios.dto.EstruturaImportacaoDTO;
import com.criterios.dto.CapItemDTO;
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
    private final SnapshotDisciplinaRepository snapshotDisciplinaRepository; // [CORRIGIDO] Novo repositório para Snapshot

    // --- 1. GERAÇÃO DE EXCEL (Boletim) ---
    public byte[] gerarBoletimExcel(Long alunoId, Long snapshotDisciplinaId) throws IOException { // [CORRIGIDO] Recebe snapshotDisciplinaId
        Aluno aluno = alunoRepository.findById(alunoId).orElseThrow(() -> new RuntimeException("Aluno não encontrado"));
        
        // [CORRIGIDO] Busca o Snapshot da Estrutura para pegar os metadados (Nome/Sigla)
        SnapshotDisciplina snapshot = snapshotDisciplinaRepository.findById(snapshotDisciplinaId)
            .orElseThrow(() -> new RuntimeException("Estrutura da Disciplina (Snapshot) não encontrada."));
        
        // [CORRIGIDO] Usa o método de busca por Snapshot (o repositório foi corrigido para usar o campo certo)
        List<Avaliacao> avaliacoes = avaliacaoRepository.findByAlunoAndEstruturaDisciplina(alunoId, snapshotDisciplinaId);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            // Usa metadados do Snapshot
            String nomeDisciplina = snapshot.getNomeDisciplina() != null ? snapshot.getNomeDisciplina() : "N/A";
            String siglaDisciplina = snapshot.getSiglaDisciplina() != null ? snapshot.getSiglaDisciplina() : "N_A";
            // ... (restante da lógica de criação do Excel)
            
            String safeName = (aluno.getNome() + "_" + siglaDisciplina).replaceAll("[^a-zA-Z0-9]", "_");
            if (safeName.length() > 30) safeName = safeName.substring(0, 30);
            
            Sheet sheet = workbook.createSheet(safeName);

            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Boletim: " + aluno.getNome() + " - Disciplina: " + nomeDisciplina);
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

    // ... (Métodos de importação de Alunos e Critérios permanecem inalterados, pois usam repositórios genéricos)
    @Transactional
    public String importarAlunosViaPdf(MultipartFile file, Long turmaId) throws IOException {
        Turma turma = turmaRepository.findById(turmaId)
                .orElseThrow(() -> new RuntimeException("Turma não encontrada"));
        // ... (restante da lógica de importação de alunos)
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

    // --- 4. PRÉ-PROCESSAMENTO DE ESTRUTURA COMPLETA (CSV/XLSX) ---
    public EstruturaImportacaoDTO preProcessarEstrutura(MultipartFile file, Long disciplinaId) throws IOException {
        Disciplina disciplina = disciplinaRepository.findById(disciplinaId)
                .orElseThrow(() -> new RuntimeException("Disciplina não encontrada"));
        // ... (restante da lógica de pré-processamento)
        List<CapItemDTO> capacidades = new ArrayList<>();
        
        if (file.getOriginalFilename() != null && 
            (file.getOriginalFilename().toLowerCase().endsWith(".xlsx") || file.getOriginalFilename().toLowerCase().endsWith(".xls"))) {
            capacidades = parseExcelEstruturaToDTO(file);
        } else {
            capacidades = parseCsvEstruturaToDTO(file);
        }
        
        EstruturaImportacaoDTO dto = new EstruturaImportacaoDTO();
        dto.setDisciplinaId(disciplinaId);
        dto.setNomeDisciplina(disciplina.getNome());
        dto.setCapacidades(capacidades);
        
        return dto;
    }
    
    // ... (Métodos auxiliares de parsing)
    private List<CapItemDTO> parseCsvEstruturaToDTO(MultipartFile file) throws IOException {
        List<CapItemDTO> capacidades = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;

                // Regex para splitar CSV ignorando vírgulas dentro de aspas
                String[] columns = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", -1);

                String colCapacidade = (columns.length > 0) ? columns[0].replace("\"", "").trim() : "";
                String colCriterio = (columns.length > 1) ? columns[1].replace("\"", "").trim() : "";

                processarCapacidadeCritItem(colCapacidade, colCriterio, capacidades);
            }
            return capacidades;
        }
    }

    private List<CapItemDTO> parseExcelEstruturaToDTO(MultipartFile file) throws IOException {
        List<CapItemDTO> capacidades = new ArrayList<>();
        
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter dataFormatter = new DataFormatter();

            for (Row row : sheet) {
                // Pega o valor da primeira coluna (Capacidade)
                Cell cellCapacidade = row.getCell(0);
                String colCapacidade = (cellCapacidade != null) ? dataFormatter.formatCellValue(cellCapacidade).trim() : "";
                
                // Pega o valor da segunda coluna (Critério)
                Cell cellCriterio = row.getCell(1);
                String colCriterio = (cellCriterio != null) ? dataFormatter.formatCellValue(cellCriterio).trim() : "";
                
                if (colCapacidade.isEmpty() && colCriterio.isEmpty()) continue;

                processarCapacidadeCritItem(colCapacidade, colCriterio, capacidades);
            }
            return capacidades;

        } catch (Exception e) {
            throw new IOException("Erro ao processar arquivo Excel/XLSX: " + e.getMessage(), e);
        }
    }
    
    private void processarCapacidadeCritItem(String colCapacidade, String colCriterio, List<CapItemDTO> capacidades) {
        
        CapItemDTO ultimaCapacidade = capacidades.isEmpty() ? null : capacidades.get(capacidades.size() - 1);
        
        // Regra de tipagem (usada para sugerir o tipo no frontend)
        String descLower = colCapacidade.toLowerCase();
        TipoCapacidade tipoSugerido = TipoCapacidade.TECNICA;
        
        if (descLower.contains("socio") || descLower.contains("comport") || descLower.contains("atitude") || descLower.contains("emocional") || descLower.contains("resiliênci") || descLower.contains("autonomia") || descLower.contains("equipe") || descLower.contains("criatividade")) {
            tipoSugerido = TipoCapacidade.SOCIOEMOCIONAL;
        }

        // Caso 1: Nova Capacidade e/ou Critério
        if (!colCapacidade.isEmpty()) {
            CapItemDTO nova = new CapItemDTO();
            nova.setDescricao(colCapacidade);
            nova.setTipo(tipoSugerido);
            nova.setCriterios(new ArrayList<>());
            capacidades.add(nova);
            ultimaCapacidade = nova;
            
            // Adiciona critério (se houver critério na mesma linha)
            if (!colCriterio.isEmpty()) {
                CritItemDTO crit = new CritItemDTO();
                crit.setDescricao(colCriterio);
                crit.setTipo(TipoCriterio.DESEJAVEL); // Default para CRITICO
                nova.getCriterios().add(crit);
            }
        }
        // Caso 2: Apenas Critério (usa a última Capacidade)
        else if (colCapacidade.isEmpty() && !colCriterio.isEmpty() && ultimaCapacidade != null) {
            CritItemDTO crit = new CritItemDTO();
            crit.setDescricao(colCriterio);
            crit.setTipo(TipoCriterio.DESEJAVEL); // Default para CRITICO
            ultimaCapacidade.getCriterios().add(crit);
        }
    }
    
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