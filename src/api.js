const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('sih_auth_user_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = 'An error occurred';
    try {
      const data = await response.json();
      message = data.message || message;
    } catch (err) {}
    throw new Error(message);
  }

  return response.json();
}
