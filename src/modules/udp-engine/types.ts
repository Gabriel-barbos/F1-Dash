import { RemoteInfo } from 'node:dgram';
import { PacketId, ParsedPacket } from '@f1-dash/telemetry-core';

export interface UdpReceiverConfig {
  port: number;
  host: string;
}

export interface UdpReceiverStats {
  totalPackets: number;
  totalBytes: number;
  packetsPerSecond: number;
  bytesPerSecond: number;
  packetCountByType: Partial<Record<PacketId, number>>;
  lastPacketTime: Date | null;
  remoteInfo: RemoteInfo | null;
}
