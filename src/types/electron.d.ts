interface ElectronAPI {
    send: (channel: string, data: any) => void;
    receive: (channel: string, func: (response: any) => void) => void;
    onError: (callback: (error: string) => void) => void;
    onThemeUpdated: (callback: (isDark: boolean) => void) => void;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}

export {}; 