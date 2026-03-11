import api from './api';

export const authService = {
  async login(email, password) {
    const { data } = await api.post('/login', { email, password });
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    return data;
  },

  async register(name, email, password, passwordConfirmation) {
    const { data } = await api.post('/register', {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    return data;
  },

  async logout() {
    try {
      await api.post('/logout');
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  },

  async me() {
    const { data } = await api.get('/me');
    return data;
  },

  async updateProfile(profileData) {
    const { data } = await api.put('/profile', profileData);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    return data;
  },

  getStoredUser() {
    const user = localStorage.getItem('auth_user');
    return user ? JSON.parse(user) : null;
  },

  getToken() {
    return localStorage.getItem('auth_token');
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};