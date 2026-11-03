export interface HubAnalytics { track(name: string): void; stop(): void }
export interface HubOptions { projectId: string; endpoint?: string; respectDNT?: boolean; trackLocalhost?: boolean }
export function createHubAnalytics(options: HubOptions): HubAnalytics
declare global { interface Window { alexHubAnalytics?: HubAnalytics } }
