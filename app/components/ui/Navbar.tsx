'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, Users, GraduationCap, LayoutDashboard, LogOut, Shield, Settings } from 'lucide-react';
import AlterarSenhaModal from '../perfil/AlterarSenhaModal';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false); 

  // --- FUNÇÕES AUXILIARES DE SEGURANÇA ---
  const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  const getUserInfo = (key: string) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  };

  useEffect(() => {
    setIsMounted(true); 
    
    if (typeof window !== 'undefined') {
      // CORREÇÃO: Busca dados de qualquer storage disponível
      const storedName = getUserInfo('user');
      const storedRole = getUserInfo('role');
      const storedToken = getToken();
      
      // Se estiver na tela de login, limpa o estado visual
      if (pathname === '/login') {
          setUserName('');
          setUserRole('');
      } else {
          if (storedName) setUserName(storedName);
          if (storedRole) setUserRole(storedRole);
          
          // Se não for login e não tiver token, redireciona
          if (!storedToken && !pathname.startsWith('/login')) {
              router.push('/login');
          }
      }
    }
  }, [pathname, router]); 

  const handleLogout = () => {
    // CORREÇÃO: Limpa ambos os storages para evitar conflitos
    if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
    }
    router.push('/login');
  };

  // Evita renderização no servidor (SSR)
  if (!isMounted) return null;
    
  // Se for login ou não tiver token, não mostra a barra
  if (pathname === '/login' || !getToken()) return null;


  const links = [
    { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
    { href: '/gestao/turmas', label: 'Turmas', icon: Users },
    { href: '/gestao/disciplinas', label: 'Disciplinas', icon: BookOpen },
  ];

  const userInitial = userName ? userName.charAt(0).toUpperCase() : 'U';
  const firstName = userName ? userName.split(' ')[0] : 'Professor';


  return (
    <>
    <nav className="bg-white border-b border-gray-200  w-full h-16 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
        
        <Link href="/dashboard" className="flex items-center gap-2 text-indigo-700 font-extrabold text-xl">
          <GraduationCap size={28} />
          <span>SISTEMA <span className="text-gray-800">SENAI</span></span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <link.icon size={18} /> {link.label}
              </Link>
            );
          })}
          
          {userRole === 'GESTOR' && (
             <Link href="/admin/professores" className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${pathname.includes('/admin') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Shield size={18} /> Gestão Docente
             </Link>
          )}
        </div>

        {/* Área de Perfil */}
        <div className="flex items-center gap-4 pl-6 border-l border-gray-200">
          
          <button 
            onClick={() => setShowModal(true)} 
            title="Alterar Senha" 
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
          >
            <Settings size={20} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-gray-800">{firstName}</p>
              <p className="text-[10px] text-gray-500">{userRole === 'GESTOR' ? 'Administrador' : 'Docente'}</p>
            </div>
            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shadow-sm">
              {userInitial}
            </div>
          </div>
          
          <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
    
    {showModal && <AlterarSenhaModal onClose={() => setShowModal(false)} />}
    </>
  );
}