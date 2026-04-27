import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function useUser({ redirectTo = '', redirectIfFound = false } = {}) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch('/api/auth/me');
                const data = await res.json();

                if (data.isLoggedIn) {
                    setUser(data);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Failed to fetch user', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, []);

    useEffect(() => {
        if (!redirectTo || loading) return;

        if (
            // If redirectTo is set, redirect if the user was not found.
            (redirectTo && !redirectIfFound && !user) ||
            // If redirectIfFound is also set, redirect if the user was found
            (redirectIfFound && user)
        ) {
            router.push(redirectTo);
        }
    }, [user, loading, redirectTo, redirectIfFound, router]);

    return { user, loading };
}
