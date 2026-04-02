import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Check local storage or default to 'system'
    const [theme, setTheme] = useState(() => localStorage.getItem('dawn-theme') || 'system');

    useEffect(() => {
        const root = document.documentElement;
        
        // Function to apply the actual CSS theme
        const applyTheme = (resolvedTheme) => {
            root.setAttribute('data-bs-theme', resolvedTheme);
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

        // Save preference
        localStorage.setItem('dawn-theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
