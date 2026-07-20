const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const setToken = (token) => {
  localStorage.setItem('auth_token', token);
};

export const getToken = () => {
  return localStorage.getItem('auth_token');
};

export const removeToken = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
};

export const setUser = (user) => {
  localStorage.setItem('auth_user', JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem('auth_user');
  return user ? JSON.parse(user) : null;
};

const request = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
};

export const api = {
  // Auth
  login: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    return data;
  },

  signup: async (email, password, name) => {
    const data = await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    setToken(data.token);
    setUser(data.user);
    return data;
  },

  // Roadmaps
  getRoadmaps: () => request('/roadmaps'),
  getRoadmap: (id) => request(`/roadmaps/${id}`),
  generateRoadmap: (role, experienceLevel, context, specializations) => {
    return request('/roadmaps', {
      method: 'POST',
      body: JSON.stringify({
        role,
        experience_level: experienceLevel,
        context,
        specializations,
      }),
    });
  },

  // Quizzes & Retests
  getQuiz: (roadmapId, checkpointId) => {
    return request(`/roadmaps/${roadmapId}/checkpoints/${checkpointId}/quiz`, {
      method: 'POST',
    });
  },

  submitQuiz: (roadmapId, checkpointId, userAnswers) => {
    return request('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({
        roadmapId,
        checkpointId,
        userAnswers,
      }),
    });
  },

  takeRetest: (roadmapId, checkpointId) => {
    return request(`/roadmaps/${roadmapId}/checkpoints/${checkpointId}/retest`, {
      method: 'POST',
    });
  },
};
export default api;
