package com.criterios.services;

import com.criterios.dto.AlterarSenhaDTO; 
import com.criterios.entities.Usuario; // [IMPORTADO]
import com.criterios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthorizationService implements UserDetailsService {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return repository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));
    }

    @Transactional
    public void alterarSenha(String emailUsuario, AlterarSenhaDTO dto) {
        
        // 1. Busca o usuário
        // O método loadUserByUsername retorna UserDetails, que é implementado por Usuario
        Usuario usuario = (Usuario) loadUserByUsername(emailUsuario); 
        
        // 2. Valida a senha atual
        if (!passwordEncoder.matches(dto.getSenhaAtual(), usuario.getSenha())) {
            throw new RuntimeException("Senha atual incorreta.");
        }
        
        // 3. Valida a nova senha (regra simples de 6 caracteres)
        if (dto.getNovaSenha().length() < 6) {
             throw new RuntimeException("A nova senha deve ter pelo menos 6 caracteres.");
        }
        
        // 4. Criptografa e salva
        usuario.setSenha(passwordEncoder.encode(dto.getNovaSenha()));
        repository.save(usuario);
    }
}