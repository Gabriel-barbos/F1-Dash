import { RemoteInfo } from 'node:dgram';
import { PacketId } from '../models/packet-ids.js';

export interface ReceiverConfig {
  port: number;
  host: string;
}

export interface ReceiverStats {
  totalPackets: number;
  totalBytes: number;
  packetsPerSecond: number;
  bytesPerSecond: number;
  packetCountByType: Partial<Record<PacketId, number>>;
  lastPacketTime: Date | null;
  remoteInfo: RemoteInfo | null;
}
