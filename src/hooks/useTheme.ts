import { useState, useEffect } from 'react';

export const useTheme = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (window.electron) {
            window.electron.receive('theme-updated', (isDark: boolean) => {
                setIsDark(isDark);
                document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
            });
        }
    }, []);

    return isDark;
}; 