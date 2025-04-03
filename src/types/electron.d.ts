export interface ElectronAPI {
    minimize: () => void;
    close: () => void;
    sendMessage: (message: string) => void;
    onMessageResponse: (callback: (response: { success: boolean; response: { message: string } }) => void) => () => void;
    onError: (callback: (error: string) => void) => () => void;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
} 