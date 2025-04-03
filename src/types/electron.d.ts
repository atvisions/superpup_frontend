interface IElectron {
    send: (channel: string, data: any) => void;
    receive: (channel: string, callback: (data: any) => void) => void;
    onError: (callback: (error: string) => void) => void;
}

declare global {
    interface Window {
        electron: IElectron;
    }
}

export {}; 