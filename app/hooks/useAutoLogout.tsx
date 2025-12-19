import { useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Swal from 'sweetalert2';

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; 
const WARNING_DURATION_MS = 30 * 1000;
const CHECK_INTERVAL_MS = 1000; 
const STORAGE_KEY = 'lastActiveTime';

export function useAutoLogout() {
  const router = useRouter();
  const pathname = usePathname();
  const isWarningOpenRef = useRef(false);

  const resetTimer = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, Date.now().toString());
  }, []);

  const performLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
        sessionStorage.clear();
        localStorage.clear();
        router.push('/login');
        setTimeout(() => {
            Swal.fire({ icon: 'warning', title: 'Sessão Expirada', text: 'Você foi desconectado por inatividade.', confirmButtonColor: '#3085d6' });
        }, 500);
    }
  }, [router]);

  const showWarning = useCallback(() => {
    isWarningOpenRef.current = true;
    let timerInterval: NodeJS.Timeout;

    Swal.fire({
      title: 'Você ainda está aí?',
      text: 'Sua sessão será encerrada em breve.',
      icon: 'question',
      timer: WARNING_DURATION_MS,
      timerProgressBar: true,
      showCancelButton: true,
      confirmButtonText: `Continuar Logado`,
      cancelButtonText: 'Sair',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      allowOutsideClick: false,
      didOpen: () => {
        const b = Swal.getConfirmButton();
        if (b) {
            timerInterval = setInterval(() => {
                const timeLeft = Swal.getTimerLeft();
                if (timeLeft !== undefined) b.textContent = `Continuar (${Math.ceil(timeLeft / 1000)}s)`;
            }, 1000);
        }
      },
      willClose: () => { clearInterval(timerInterval); isWarningOpenRef.current = false; }
    }).then((result) => {
      if (result.isConfirmed) resetTimer();
      else if (result.dismiss === Swal.DismissReason.timer || result.dismiss === Swal.DismissReason.cancel) performLogout();
    });
  }, [performLogout, resetTimer]);

  useEffect(() => {
    if (pathname === '/login') return;
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || sessionStorage.getItem('token')) : null;
    if (!token) return;

    if (!localStorage.getItem(STORAGE_KEY)) resetTimer();

    const intervalId = setInterval(() => {
      const lastActive = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
      const diff = Date.now() - lastActive;

      if (lastActive === 0) { resetTimer(); return; }
      if (diff > (INACTIVITY_LIMIT_MS + WARNING_DURATION_MS + 2000)) { performLogout(); return; }
      if (diff > INACTIVITY_LIMIT_MS && !isWarningOpenRef.current) showWarning();
      if (diff < INACTIVITY_LIMIT_MS && isWarningOpenRef.current) { Swal.close(); isWarningOpenRef.current = false; }
    }, CHECK_INTERVAL_MS);

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => { if (!isWarningOpenRef.current) resetTimer(); };
    events.forEach(event => window.addEventListener(event, handleActivity));

    return () => {
      clearInterval(intervalId);
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [pathname, performLogout, resetTimer, showWarning]);
}