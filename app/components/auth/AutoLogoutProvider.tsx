'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

// --- CONFIGURAÇÕES DE TEMPO ---
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutos
const WARNING_DURATION_MS = 30 * 1000; // 30 segundos
const CHECK_INTERVAL_MS = 1000; 

const STORAGE_KEY = 'lastActiveTime';

export default function AutoLogoutProvider() {
  const pathname = usePathname();
  const router = useRouter();
  
  const isWarningOpenRef = useRef(false);

  // Função Final de Logout
  const performLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
        // CORREÇÃO: Limpa TUDO para garantir
        sessionStorage.clear();
        localStorage.clear();
        
        router.push('/login');
        
        setTimeout(() => {
            Swal.fire({
                icon: 'warning',
                title: 'Sessão Expirada',
                text: 'Você foi desconectado por inatividade.',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Ok'
            });
        }, 500);
    }
  }, [router]);

  // Atualiza o carimbo de tempo
  const resetTimer = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }
  }, []);

  // Mostra o Aviso
  const showWarning = useCallback(() => {
    isWarningOpenRef.current = true;
    let timerInterval: NodeJS.Timeout;

    Swal.fire({
      title: 'Você ainda está aí?',
      text: 'Sua sessão será encerrada em breve por inatividade.',
      icon: 'question',
      timer: WARNING_DURATION_MS,
      timerProgressBar: true,
      showCancelButton: true,
      confirmButtonText: `Continuar Logado`,
      cancelButtonText: 'Sair Agora',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        const b = Swal.getConfirmButton();
        if (b) {
            timerInterval = setInterval(() => {
                const timeLeft = Swal.getTimerLeft();
                if (timeLeft !== undefined) {
                    b.textContent = `Continuar Logado (${Math.ceil(timeLeft / 1000)}s)`;
                }
            }, 1000);
        }
      },
      willClose: () => {
        clearInterval(timerInterval);
        isWarningOpenRef.current = false;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        resetTimer();
      } 
      else if (result.dismiss === Swal.DismissReason.timer || result.dismiss === Swal.DismissReason.cancel) {
        performLogout();
      }
    });
  }, [performLogout, resetTimer]);

  useEffect(() => {
    if (pathname === '/login') return;

    // CORREÇÃO: Verifica ambos os storages
    const token = typeof window !== 'undefined' 
        ? (localStorage.getItem('token') || sessionStorage.getItem('token')) 
        : null;
    
    // Se não tem token, não monitora
    if (!token) return;

    // Inicializa timer se vazio
    if (!localStorage.getItem(STORAGE_KEY)) {
        resetTimer();
    }

    const intervalId = setInterval(() => {
      const lastActive = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
      const now = Date.now();
      const diff = now - lastActive;

      // Se o tempo é absurdo, reseta
      if (lastActive === 0) {
        resetTimer();
        return;
      }

      // 1. Estourou tempo total
      if (diff > (INACTIVITY_LIMIT_MS + WARNING_DURATION_MS + 2000)) {
         performLogout();
         return;
      }

      // 2. Abrir Aviso
      if (diff > INACTIVITY_LIMIT_MS && !isWarningOpenRef.current) {
         showWarning();
      }

      // 3. Fechar aviso se usuário mexeu em outra aba
      if (diff < INACTIVITY_LIMIT_MS && isWarningOpenRef.current) {
         Swal.close();
         isWarningOpenRef.current = false;
      }

    }, CHECK_INTERVAL_MS);

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => {
        if (!isWarningOpenRef.current) {
            resetTimer();
        }
    };

    events.forEach(event => window.addEventListener(event, handleActivity));

    return () => {
      clearInterval(intervalId);
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [pathname, performLogout, resetTimer, showWarning]);

  return null;
}