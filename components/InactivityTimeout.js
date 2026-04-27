import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export default function InactivityTimeout({ children }) {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        let timeoutId;

        const resetTimer = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                // If inactive, force logout by hitting the logout API
                fetch('/api/auth/logout', { method: 'POST' }).then(() => {
                    // Redirect to login after logout
                    if (router.pathname !== '/login' && router.pathname !== '/') {
                        router.push('/login?expired=1');
                    }
                });
            }, TIMEOUT_MS);
        };

        // Initialize the timer
        resetTimer();

        // Listen for user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach((event) => {
            window.addEventListener(event, resetTimer, { passive: true });
        });

        // Cleanup
        return () => {
            clearTimeout(timeoutId);
            events.forEach((event) => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [router.pathname]); // Re-run when route changes, but not necessarily on every render

    return children;
}
