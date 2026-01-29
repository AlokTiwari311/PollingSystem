import { useEffect, useState } from 'react';

// Ye hook poll ka timer chalane ke liye hai.
export const usePollTimer = (startTime: number | null, duration: number) => {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        // Agar startTime hi nahi hai to timer 0 kar do.
        if (!startTime) {
            setTimeLeft(0);
            return;
        }

        // Har second update karna padega time
        const interval = setInterval(() => {
            const now = Date.now();
            // Start time se ab tak kitna time bita hai wo nikalo
            const elapsed = Math.floor((now - startTime) / 1000);
            // Total duration me se elapsed minus karo to bacha hua time milega
            const remaining = Math.max(duration - elapsed, 0);

            setTimeLeft(remaining);

            // Time khatam ? Interval band karo.
            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        // Cleanup: purana interval clear karo naye render se pehle
        return () => clearInterval(interval);
    }, [startTime, duration]);

    return timeLeft;
};
