import { useEffect, useState } from 'react';

export const usePollTimer = (startTime: number | null, duration: number) => {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!startTime) {
            setTimeLeft(0);
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000);
            const remaining = Math.max(duration - elapsed, 0);

            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime, duration]);

    return timeLeft;
};
