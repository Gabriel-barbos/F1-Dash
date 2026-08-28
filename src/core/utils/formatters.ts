import { SafetyCarStatus, Weather } from '../models/session';
import { PitStatus } from '../models/lap-data';
import { VisualTyreCompound, VehicleFiaFlag, ERSDeployMode } from '../models/car-status';

export class Formatters {
  /**
   * Formata milissegundos no formato M:SS.mmm (ex: 1:24.382)
   */
  public static formatLapTime(ms: number): string {
    if (!ms || ms <= 0 || ms > 3600000 || isNaN(ms)) return '--:--.---';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = ms % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
  }

  /**
   * Formata delta de tempo (ex: +1.240s ou -0.350s)
   */
  public static formatDelta(ms: number): string {
    if (ms === 0) return '0.000s';
    const sign = ms > 0 ? '+' : '-';
    const absMs = Math.abs(ms);
    const seconds = (absMs / 1000).toFixed(3);
    return `${sign}${seconds}s`;
  }

  /**
   * Retorna texto e cor para o status do Safety Car
   */
  public static getSafetyCarInfo(status: SafetyCarStatus): { label: string; active: boolean; color: string } {
    switch (status) {
      case SafetyCarStatus.Full:
        return { label: 'SAFETY CAR', active: true, color: '#eab308' }; // Amarelo
      case SafetyCarStatus.Virtual:
        return { label: 'VIRTUAL SAFETY CAR (VSC)', active: true, color: '#f59e0b' }; // Laranja
      case SafetyCarStatus.FormationLap:
        return { label: 'FORMATION LAP', active: true, color: '#3b82f6' }; // Azul
      default:
        return { label: 'TRACK CLEAR', active: false, color: '#22c55e' };
    }
  }

  /**
   * Retorna descrição e cor da bandeira FIA do carro
   */
  public static getFiaFlagInfo(flag: VehicleFiaFlag): { label: string; active: boolean; color: string } {
    switch (flag) {
      case VehicleFiaFlag.Green:
        return { label: 'GREEN FLAG', active: true, color: '#22c55e' };
      case VehicleFiaFlag.Blue:
        return { label: 'BLUE FLAG', active: true, color: '#3b82f6' };
      case VehicleFiaFlag.Yellow:
        return { label: 'YELLOW FLAG', active: true, color: '#eab308' };
      case VehicleFiaFlag.Red:
        return { label: 'RED FLAG', active: true, color: '#ef4444' };
      default:
        return { label: '', active: false, color: 'transparent' };
    }
  }

  /**
   * Retorna label do status do box
   */
  public static getPitStatusLabel(status: PitStatus, limiterActive: boolean): { label: string; active: boolean; color: string } {
    if (limiterActive) {
      return { label: 'PIT LIMITER ON', active: true, color: '#ec4899' };
    }
    switch (status) {
      case PitStatus.Pitting:
        return { label: 'IN PIT LANE', active: true, color: '#3b82f6' };
      case PitStatus.InPitArea:
        return { label: 'PIT STOP (BOX)', active: true, color: '#f97316' };
      default:
        return { label: 'ON TRACK', active: false, color: '#6b7280' };
    }
  }

  /**
   * Nome do composto de pneu e sua cor de exibição
   */
  public static getTyreCompoundInfo(compound: VisualTyreCompound): { name: string; short: string; color: string; textColor: string } {
    switch (compound) {
      case VisualTyreCompound.F1_Soft:
      case VisualTyreCompound.F2_SuperSoft:
        return { name: 'SOFT', short: 'S', color: '#ef4444', textColor: '#ffffff' };
      case VisualTyreCompound.F1_Medium:
      case VisualTyreCompound.F2_Medium:
        return { name: 'MEDIUM', short: 'M', color: '#eab308', textColor: '#000000' };
      case VisualTyreCompound.F1_Hard:
      case VisualTyreCompound.F2_Hard:
        return { name: 'HARD', short: 'H', color: '#ffffff', textColor: '#000000' };
      case VisualTyreCompound.F1_Inter:
        return { name: 'INTER', short: 'I', color: '#22c55e', textColor: '#ffffff' };
      case VisualTyreCompound.F1_Wet:
      case VisualTyreCompound.F2_Wet:
        return { name: 'WET', short: 'W', color: '#3b82f6', textColor: '#ffffff' };
      default:
        return { name: 'DRY', short: 'D', color: '#9ca3af', textColor: '#000000' };
    }
  }

  /**
   * Nome do modo ERS
   */
  public static getErsModeName(mode: ERSDeployMode): string {
    switch (mode) {
      case ERSDeployMode.None:
        return 'NONE';
      case ERSDeployMode.Medium:
        return 'MEDIUM';
      case ERSDeployMode.Hotlap:
        return 'HOTLAP';
      case ERSDeployMode.Overtake:
        return 'OVERTAKE';
      default:
        return 'UNKNOWN';
    }
  }
}
