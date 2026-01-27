import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Send cookies with requests
});

// Response interceptor to handle 401s (optional but good practice)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Check if we are not already on login page to avoid loops
            if (!window.location.pathname.includes('/admin/login') && !window.location.pathname.startsWith('/project/')) {
                // Redirect to login if needed, or handle session expiry
                // For now, we let the component handle the error or redirect
            }
        }
        return Promise.reject(error);
    }
);

export default api;
