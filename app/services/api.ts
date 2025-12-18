import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// --- INTERCEPTOR DE REQUISIÇÃO ---
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // CORREÇÃO CRÍTICA: Procura em ambos os storages
      // Isso resolve o problema de salvar em um lugar e buscar no outro
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- INTERCEPTOR DE RESPOSTA ---
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      console.error("API: Erro 401 detectado no interceptor global.");

      // Limpeza de sessão
      sessionStorage.removeItem('token'); 
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('role');
      localStorage.removeItem('token'); // Adicionei para garantir

      // --- COMENTEI O REDIRECT FORÇADO PARA PARAR DE "PISCAR" A TELA ---
      // Enquanto estamos debugando, isso impede que você seja expulso.
      // Quando tudo estiver estável, você pode descomentar.
      /*
      if (!window.location.pathname.includes('/login')) {
         window.location.href = '/login';
      }
      */
    }
    return Promise.reject(error);
  }
);

export default api;