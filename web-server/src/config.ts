import os from 'node:os';

export interface AppConfig {
  udpPort: number;
  udpHost: string;
  webPort: number;
  renderFps: number;
}

export const config: AppConfig = {
  udpPort: Number(process.env.F1_UDP_PORT || 20777),
  udpHost: process.env.F1_UDP_HOST || '0.0.0.0',
  webPort: Number(process.env.F1_WEB_PORT || 3000),
  renderFps: 60 // Adaptado para 60 FPS / 60Hz
};

/**
 * Retorna os endereços IPv4 locais desta máquina para facilitar a configuração no PS5.
 */
export function getLocalIPv4Addresses(): string[] {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];

  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name];
    if (!ifaceList) continue;

    for (const iface of ifaceList) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }

  return addresses;
}
