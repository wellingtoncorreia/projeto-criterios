'use client';
import Link from 'next/link';
import { BookOpen, Users, GraduationCap, LayoutDashboard, LogOut, Shield, Settings } from 'lucide-react';
import AlterarSenhaModal from '../perfil/AlterarSenhaModal';
import { useNavbar } from '@/app/hooks/useNavbar'; // Hook importado

export default function Navbar() {
  const { shouldRender, userData, modal, actions, currentPath } = useNavbar();

  if (!shouldRender) return null;

  const links = [
    { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
    { href: '/gestao/turmas', label: 'Turmas', icon: Users },
    { href: '/gestao/disciplinas', label: 'Disciplinas', icon: BookOpen },
  ];

  return (
    <>
    <nav className="bg-white border-b border-gray-200 w-full h-16 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-indigo-700 font-extrabold text-xl">
          <GraduationCap size={28} /><span>SISTEMA <span className="text-gray-800">SENAI</span></span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${currentPath === link.href ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <link.icon size={18} /> {link.label}
            </Link>
          ))}
          {userData.isGestor && (
             <Link href="/admin/professores" className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${currentPath.includes('/admin') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Shield size={18} /> Gestão Docente
             </Link>
          )}
        </div>

        <div className="flex items-center gap-4 pl-6 border-l border-gray-200">
          <button onClick={modal.open} title="Alterar Senha" className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
            <Settings size={20} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-gray-800">{userData.firstName}</p>
              <p className="text-[10px] text-gray-500">{userData.isGestor ? 'Administrador' : 'Docente'}</p>
            </div>
            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shadow-sm">
              {userData.userInitial}
            </div>
          </div>
          
          <button onClick={actions.handleLogout} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
    {modal.isOpen && <AlterarSenhaModal onClose={modal.close} />}
    </>
  );
}