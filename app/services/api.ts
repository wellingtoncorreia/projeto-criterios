import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// --- ADICIONE ESTE BLOCO (Interceptador de Requisição) ---
api.interceptors.request.use(
  (config) => {
    // Tenta pegar o token do localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      // Se tiver token, injeta no cabeçalho Authorization
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
// ---------------------------------------------------------

api.interceptors.response.use(
  response => response,
  error => {
    console.error('Erro na API:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      data: error.response?.data,
      url: error.config?.url
    });
    
    // Apenas deslogar se o token for inválido/expirado (401 em endpoints de autenticação)
    // Não deslogar em 403 (permissão negada) pois pode ser erro de negócio
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        // Token inválido/expirado - deslogar
        localStorage.removeItem('token'); 
        localStorage.removeItem('user');
        localStorage.removeItem('role');

        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;