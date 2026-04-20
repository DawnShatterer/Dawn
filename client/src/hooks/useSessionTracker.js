import { useEffect, useRef } from 'react';
import { sendHeartbeat } from '../api/analyticsService';

/**
 * useSessionTracker - Custom hook to track student session duration.
 * Sends a heartbeat to the server every 2 minutes while the user is active.
 */
export const useSessionTracker = (courseId = null, lessonId = null) => {
    const intervalRef = useRef(null);

    useEffect(() => {
        const sessionId = localStorage.getItem('sessionId');
        
        if (!sessionId) return;

        sendHeartbeat(sessionId, courseId, lessonId).catch(() => {});

        intervalRef.current = setInterval(() => {
            sendHeartbeat(sessionId, courseId, lessonId).catch(() => {});
        }, 30000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [courseId, lessonId]); 
};
