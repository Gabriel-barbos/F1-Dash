export const ESP32_MDNS_HOST = 'g7-desk-lighting.local';
export const ESP32_DEVICE_NAME = 'G7 Desk F1';
export const ESP32_UDP_PORT = 4210;

export const CACHE_HEALTH_TIMEOUT_MS = 400;
export const MDNS_TIMEOUT_MS = 800;
export const SUBNET_SCAN_TIMEOUT_MS = 350;
export const SUBNET_SCAN_CONCURRENCY = 40;

export type DiscoveryMethod = 'CACHE' | 'MDNS' | 'SUBNET_SCAN';

export interface Esp32JsonInfo {
  name?: string;
  brand?: string;
  udpport?: number;
  ip?: string;
}

export interface DiscoveryResult {
  ip: string | null;
  port: number;
  method: DiscoveryMethod | null;
  elapsedMs: number;
}

export interface DiscoveryDependencies {
  fetchFn?: typeof fetch;
  getLastSavedIp: () => Promise<string | null>;
  saveLastIp: (ip: string, port: number) => Promise<void>;
  getLocalIpv4: () => Promise<string | null>;
  fallbackPrefixIp?: string;
  cacheTimeoutMs?: number;
  mdnsTimeoutMs?: number;
  scanTimeoutMs?: number;
  scanConcurrency?: number;
}

const IPV4_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function isValidIpv4(ip: string | null | undefined): ip is string {
  if (!ip) return false;
  const match = IPV4_REGEX.exec(ip.trim());
  if (!match) return false;
  for (let i = 1; i <= 4; i++) {
    const octet = Number(match[i]);
    if (octet < 0 || octet > 255) return false;
  }
  return ip.trim() !== '0.0.0.0';
}

export function extractSubnetPrefix(ipv4: string | null | undefined): string | null {
  if (!isValidIpv4(ipv4)) return null;
  const trimmed = ipv4.trim();
  if (trimmed.startsWith('127.')) return null;
  const parts = trimmed.split('.');
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

export async function probeJsonInfo(
  hostOrIp: string,
  timeoutMs: number,
  options?: {
    fetchFn?: typeof fetch;
    requireUdpPort?: boolean;
    externalSignal?: AbortSignal;
  }
): Promise<Esp32JsonInfo | null> {
  const fetchImpl = options?.fetchFn ?? fetch;
  const externalSignal = options?.externalSignal;

  if (externalSignal?.aborted) {
    return null;
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const onExternalAbort = () => {
    controller?.abort();
  };

  if (controller && externalSignal) {
    externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  if (controller) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  try {
    const res = await fetchImpl(`http://${hostOrIp}/json/info`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller ? controller.signal : undefined
    });

    if (!res.ok) return null;

    const json = (await res.json()) as Esp32JsonInfo;
    if (!json || json.name !== ESP32_DEVICE_NAME) {
      return null;
    }

    if (options?.requireUdpPort && json.udpport !== ESP32_UDP_PORT) {
      return null;
    }

    return json;
  } catch {
    return null;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    if (controller && externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}

export async function scanSubnetForDevice(
  prefix: string,
  options?: {
    fetchFn?: typeof fetch;
    timeoutMs?: number;
    concurrency?: number;
    skipIps?: Set<string>;
  }
): Promise<Esp32JsonInfo & { resolvedIp: string } | null> {
  const fetchImpl = options?.fetchFn ?? fetch;
  const timeoutMs = options?.timeoutMs ?? SUBNET_SCAN_TIMEOUT_MS;
  const concurrency = Math.max(1, Math.min(64, options?.concurrency ?? SUBNET_SCAN_CONCURRENCY));
  const skipIps = options?.skipIps;

  const candidates: string[] = [];
  for (let host = 1; host <= 254; host++) {
    const ip = `${prefix}.${host}`;
    if (skipIps?.has(ip)) continue;
    candidates.push(ip);
  }

  if (candidates.length === 0) return null;

  const scanAbortController = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let nextIndex = 0;
  let found: (Esp32JsonInfo & { resolvedIp: string }) | null = null;

  const worker = async () => {
    while (!found && !scanAbortController?.signal.aborted) {
      const idx = nextIndex++;
      if (idx >= candidates.length) break;

      const candidateIp = candidates[idx];
      const info = await probeJsonInfo(candidateIp, timeoutMs, {
        fetchFn: fetchImpl,
        requireUdpPort: true,
        externalSignal: scanAbortController?.signal
      });

      if (info && !found) {
        const resolvedIp = isValidIpv4(info.ip) ? info.ip.trim() : candidateIp;
        found = { ...info, resolvedIp };
        scanAbortController?.abort();
        break;
      }
    }
  };

  const workerCount = Math.min(concurrency, candidates.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return found;
}

/**
 * Executa a descoberta automática do controlador ESP32 (G7 Desk F1):
 * 1. Fast Path: último IP salvo em cache (~400 ms)
 * 2. mDNS: http://g7-desk-lighting.local/json/info (~800 ms)
 * 3. Varredura paralela da sub-rede local .1..254 (~350 ms/IP em lotes paralelos)
 */
export async function discoverLightingDeviceWithDetails(
  deps: DiscoveryDependencies
): Promise<DiscoveryResult> {
  const startTime = Date.now();
  const fetchFn = deps.fetchFn ?? fetch;
  const cacheTimeoutMs = deps.cacheTimeoutMs ?? CACHE_HEALTH_TIMEOUT_MS;
  const mdnsTimeoutMs = deps.mdnsTimeoutMs ?? MDNS_TIMEOUT_MS;
  const scanTimeoutMs = deps.scanTimeoutMs ?? SUBNET_SCAN_TIMEOUT_MS;
  const scanConcurrency = deps.scanConcurrency ?? SUBNET_SCAN_CONCURRENCY;

  // 1. Fast Path: último IP salvo em cache
  const lastSavedIp = await deps.getLastSavedIp();
  if (isValidIpv4(lastSavedIp)) {
    const cachedInfo = await probeJsonInfo(lastSavedIp.trim(), cacheTimeoutMs, { fetchFn });
    if (cachedInfo) {
      const validIp = isValidIpv4(cachedInfo.ip) ? cachedInfo.ip.trim() : lastSavedIp.trim();
      const port = typeof cachedInfo.udpport === 'number' ? cachedInfo.udpport : ESP32_UDP_PORT;
      if (validIp !== lastSavedIp.trim()) {
        await deps.saveLastIp(validIp, port);
      }
      return {
        ip: validIp,
        port,
        method: 'CACHE',
        elapsedMs: Date.now() - startTime
      };
    }
  }

  // 2. Resolução via mDNS
  const mdnsInfo = await probeJsonInfo(ESP32_MDNS_HOST, mdnsTimeoutMs, { fetchFn });
  if (mdnsInfo && isValidIpv4(mdnsInfo.ip)) {
    const resolvedIp = mdnsInfo.ip.trim();
    const port = typeof mdnsInfo.udpport === 'number' ? mdnsInfo.udpport : ESP32_UDP_PORT;
    await deps.saveLastIp(resolvedIp, port);
    return {
      ip: resolvedIp,
      port,
      method: 'MDNS',
      elapsedMs: Date.now() - startTime
    };
  }

  // 3. Varredura paralela da sub-rede local
  const localIpv4 = await deps.getLocalIpv4();
  const prefix =
    extractSubnetPrefix(localIpv4) ??
    extractSubnetPrefix(lastSavedIp) ??
    extractSubnetPrefix(deps.fallbackPrefixIp);

  if (!prefix) {
    return {
      ip: null,
      port: ESP32_UDP_PORT,
      method: null,
      elapsedMs: Date.now() - startTime
    };
  }

  const skipIps = new Set<string>();
  if (isValidIpv4(localIpv4)) skipIps.add(localIpv4.trim());
  if (isValidIpv4(lastSavedIp)) skipIps.add(lastSavedIp.trim());

  const scanResult = await scanSubnetForDevice(prefix, {
    fetchFn,
    timeoutMs: scanTimeoutMs,
    concurrency: scanConcurrency,
    skipIps
  });

  if (scanResult) {
    const port = typeof scanResult.udpport === 'number' ? scanResult.udpport : ESP32_UDP_PORT;
    await deps.saveLastIp(scanResult.resolvedIp, port);
    return {
      ip: scanResult.resolvedIp,
      port,
      method: 'SUBNET_SCAN',
      elapsedMs: Date.now() - startTime
    };
  }

  return {
    ip: null,
    port: ESP32_UDP_PORT,
    method: null,
    elapsedMs: Date.now() - startTime
  };
}
