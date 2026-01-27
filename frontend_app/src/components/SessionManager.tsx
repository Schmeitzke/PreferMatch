import { useEffect } from 'react';
import api from '../api';

const SessionManager = () => {
    useEffect(() => {
        // Function to refresh the token
        const refreshToken = async () => {
            // Only refresh if we are in admin section
            if (!window.location.pathname.startsWith('/admin')) return;

            try {
                // We don't need to send a body, the current token in the cookie is enough authentication
                await api.post('/api/admin/refresh');
                console.log('Session refreshed successfully');
            } catch (error) {
                // If refresh fails (e.g., token already invalid), we don't force logout here to avoid disrupting the user 
                // instantly if it's just a network blip. The usage of the token elsewhere (API calls) will handle 401s.
                console.error('Failed to refresh session:', error);
            }
        };

        // Set up the interval
        // Refresh every 10 minutes (600,000 ms)
        const intervalId = setInterval(refreshToken, 10 * 60 * 1000);

        // Run immediately on mount to ensure we have a fresh token if the user just reloaded
        // (Optional, but good if the user refreshed the page after 50 mins)
        refreshToken();

        return () => clearInterval(intervalId);
    }, []);

    // This component renders nothing, it just manages the session side-effect
    return null;
};

export default SessionManager;
