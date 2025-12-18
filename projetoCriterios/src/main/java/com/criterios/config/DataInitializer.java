package com.criterios.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.criterios.entities.TipoUsuario;
import com.criterios.entities.Usuario;
import com.criterios.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        
        // --- 0. CRIAR USUÁRIO GESTOR PADRÃO ---
        // Mantemos apenas a criação do administrador para permitir o primeiro acesso ao sistema.
        if (usuarioRepository.count() == 0) {
            System.out.println(":: CRIANDO USUÁRIO GESTOR PADRÃO ::");
            Usuario admin = new Usuario();
            admin.setNome("Administrador Geral");
            admin.setEmail("admin@senai.br"); 
            admin.setSenha(passwordEncoder.encode("123456")); 
            
            // Define como GESTOR para ter permissão total no sistema
            admin.setTipo(TipoUsuario.GESTOR); 
            
            usuarioRepository.save(admin);
            System.out.println("   -> Login: admin@senai.br / Senha: 123456 (Perfil: GESTOR)");
            System.out.println(":: SISTEMA PRONTO PARA USO ::");
        }
    }
}