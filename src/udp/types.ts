import { RemoteInfo } from 'node:dgram';
import { PacketId } from '@f1-dash/telemetry-core';

export interface ReceiverConfig {
  port: number;
  host: string;
}

export interface ReceiverStats {
  totalPackets: number;
  totalBytes: number;
  packetsPerSecond: number;
  bytesPerSecond: number;
  packetCountByType: Partial<Record<PacketId | string, number>>;
  lastPacketTime: Date | null;
  remoteInfo: RemoteInfo | null;
}
