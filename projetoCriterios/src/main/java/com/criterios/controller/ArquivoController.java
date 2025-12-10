package com.criterios.controller;

import com.criterios.dto.EstruturaImportacaoDTO;
import com.criterios.services.ArquivoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/arquivos")
@RequiredArgsConstructor
public class ArquivoController {

    private final ArquivoService arquivoService;

    // 1. Download do Boletim em Excel
    @GetMapping("/boletim/download")
    public ResponseEntity<byte[]> downloadBoletim(
            @RequestParam Long alunoId, 
            @RequestParam Long disciplinaId) throws IOException {
        
        byte[] excelBytes = arquivoService.gerarBoletimExcel(alunoId, disciplinaId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=boletim_aluno.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(excelBytes);
    }

    // 2. Importação de Alunos (PDF da Chamada)
    @PostMapping("/importar-alunos")
    public ResponseEntity<String> uploadRemessaAlunos(
            @RequestParam("file") MultipartFile file, 
            @RequestParam("turmaId") Long turmaId) {
        try {
            String resultado = arquivoService.importarAlunosViaPdf(file, turmaId);
            return ResponseEntity.ok(resultado);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Erro ao ler PDF: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro interno: " + e.getMessage());
        }
    }

    // 3. Importação de Critérios Individuais (TXT/CSV para uma Capacidade Específica)
    @PostMapping("/importar-criterios")
    public ResponseEntity<String> uploadRemessaCriterios(
            @RequestParam("file") MultipartFile file, 
            @RequestParam("capacidadeId") Long capacidadeId) {
        try {
            String resultado = arquivoService.importarCriteriosViaArquivo(file, capacidadeId);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro ao importar critérios: " + e.getMessage());
        }
    }

    // 4. [ATUALIZADO] Pré-processamento de Estrutura Completa (Planilha Mestre: Capacidades + Critérios)
    // Retorna a estrutura em JSON para o frontend editar/confirmar.
    @PostMapping("/importar-estrutura-completa")
    public ResponseEntity<?> uploadEstruturaCompleta(
            @RequestParam("file") MultipartFile file, 
            @RequestParam("disciplinaId") Long disciplinaId) {
        try {
            // Chama o pré-processamento que faz o parse do Excel/CSV
            EstruturaImportacaoDTO dto = arquivoService.preProcessarEstrutura(file, disciplinaId);
            // Retorna o DTO com a estrutura para a tela de revisão
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro ao processar arquivo: " + e.getMessage());
        }
    }
}