import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
    persist(
        (set) => ({
            enterToSend: true,
            theme: 'dark', // 'dark' | 'light' | 'system'
            soundEnabled: true,
            desktopNotifications: false,

            setTheme: (theme) => {
                set({ theme });
                
                // Also apply to HTML element immediately
                const root = window.document.documentElement;
                root.classList.remove('light', 'dark');
                
                if (theme === 'system') {
                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    root.classList.add(systemTheme);
                    if (systemTheme === 'light') {
                        root.classList.remove('dark');
                    }
                } else {
                    root.classList.add(theme);
                    if (theme === 'light') {
                        root.classList.remove('dark');
                    }
                }
            },
            
            setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
            setDesktopNotifications: (enabled) => set({ desktopNotifications: enabled }),
            setEnterToSend: (enabled) => set({ enterToSend: enabled }),
        }),
        {
            name: 'beatchat-preferences',
        }
    )
);

export default useSettingsStore;
