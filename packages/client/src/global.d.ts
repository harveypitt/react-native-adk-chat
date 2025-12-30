// Global types for web environment
declare global {
  interface Window {
    alert(message?: any): void;
    confirm(message?: string): boolean;
  }

  var window: Window;
}

export {};
