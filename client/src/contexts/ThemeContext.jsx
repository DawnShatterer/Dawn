import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => localStorage.getItem('dawn-theme') || 'system');
    const [resolvedTheme, setResolvedTheme] = useState('light');

    useEffect(() => {
        const root = document.documentElement;
        
        const applyTheme = (rTheme) => {
            root.setAttribute('data-bs-theme', rTheme);
            setResolvedTheme(rTheme);
        };

        if (theme === 'system') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');
            applyTheme(systemPrefersDark.matches ? 'dark' : 'light');
            
            const listener = (e) => applyTheme(e.matches ? 'dark' : 'light');
            systemPrefersDark.addEventListener('change', listener);
            
            return () => systemPrefersDark.removeEventListener('change', listener);
        } else {
            applyTheme(theme);
        }

        localStorage.setItem('dawn-theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
