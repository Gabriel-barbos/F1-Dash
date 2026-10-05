/**
 * Módulo de Iluminação ESP32 (Futuro)
 * Controla LEDs físicos (Shift Lights, Bandeiras FIA, DRS, Pit Limiter)
 */

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface LedStripStatus {
  connected: boolean;
  ipAddress?: string;
  totalLeds: number;
  brightness: number; // 0 a 255
}

export interface LightingTelemetryInput {
  rpmPercent: number;
  revLightsPercent: number;
  drsActive: boolean;
  pitLimiterActive: boolean;
  flagColor: 'NONE' | 'GREEN' | 'YELLOW' | 'RED' | 'BLUE';
}

export class Esp32LightingBridge {
  private status: LedStripStatus = {
    connected: false,
    totalLeds: 16,
    brightness: 120
  };

  /**
   * Conecta ao ESP32 via WebSocket ou UDP na rede local
   */
  public async connect(ip: string): Promise<boolean> {
    console.log(`[ESP32 Lighting] Conectando ao ESP32 no IP: ${ip}... (Módulo engatilhado para próxima fase)`);
    this.status.connected = true;
    this.status.ipAddress = ip;
    return true;
  }

  public updateLeds(input: LightingTelemetryInput): void {
    if (!this.status.connected) return;
    // Implementação dos pacotes de cor para o ESP32 quando o módulo for ativado
  }

  public getStatus(): LedStripStatus {
    return { ...this.status };
  }
}

export const esp32LightingBridge = new Esp32LightingBridge();
