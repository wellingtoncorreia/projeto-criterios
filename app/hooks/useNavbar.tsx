import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function useNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Helpers de Storage
  const getToken = () => typeof window !== 'undefined' ? (localStorage.getItem('token') || sessionStorage.getItem('token')) : null;
  const getUserInfo = (key: string) => typeof window !== 'undefined' ? (localStorage.getItem(key) || sessionStorage.getItem(key)) : null;

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if (pathname === '/login') {
        setUserName(''); setUserRole('');
      } else {
        const name = getUserInfo('user');
        const role = getUserInfo('role');
        const token = getToken();

        if (name) setUserName(name);
        if (role) setUserRole(role);
        
        if (!token && !pathname.startsWith('/login')) {
           router.push('/login');
        }
      }
    }
  }, [pathname, router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
    }
    router.push('/login');
  };

  const userInitial = userName ? userName.charAt(0).toUpperCase() : 'U';
  const firstName = userName ? userName.split(' ')[0] : 'Professor';
  const isGestor = userRole === 'GESTOR';
  const shouldRender = isMounted && pathname !== '/login' && !!getToken();

  return {
    shouldRender,
    userData: { firstName, userInitial, role: userRole, isGestor },
    modal: { isOpen: showModal, open: () => setShowModal(true), close: () => setShowModal(false) },
    actions: { handleLogout },
    currentPath: pathname
  };
}