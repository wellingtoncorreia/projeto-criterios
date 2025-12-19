'use client';
import { useAutoLogout } from '@/app/hooks/useAutoLogout';

export default function AutoLogoutProvider() {
  useAutoLogout(); // A lógica inteira vive no hook agora
  return null;
}