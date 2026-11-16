import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ESP32_MDNS_HOST,
  discoverLightingDeviceWithDetails,
  extractSubnetPrefix,
  isValidIpv4
} from '../mobile-app/src/services/esp32-discovery.js';

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

test('ESP32 Auto-Discovery — valida IPv4 e extrai prefixo da sub-rede', () => {
  assert.equal(isValidIpv4('192.168.1.103'), true);
  assert.equal(isValidIpv4('0.0.0.0'), false);
  assert.equal(isValidIpv4('999.168.1.1'), false);
  assert.equal(extractSubnetPrefix('192.168.1.45'), '192.168.1');
  assert.equal(extractSubnetPrefix('127.0.0.1'), null);
});

test('ESP32 Auto-Discovery — Prioridade 1: Fast Path usa IP em cache sem chamar mDNS ou varredura', async () => {
  const calledUrls: string[] = [];
  let savedIp: string | null = null;

  const mockFetch: typeof fetch = async (input) => {
    const url = String(input);
    calledUrls.push(url);
    if (url === 'http://192.168.1.103/json/info') {
      return createJsonResponse({
        name: 'G7 Desk F1',
        brand: 'WLED',
        udpport: 4210,
        ip: '192.168.1.103'
      });
    }
    throw new Error('Unexpected URL');
  };

  const result = await discoverLightingDeviceWithDetails({
    fetchFn: mockFetch,
    getLastSavedIp: async () => '192.168.1.103',
    saveLastIp: async (ip) => {
      savedIp = ip;
    },
    getLocalIpv4: async () => '192.168.1.50'
  });

  assert.equal(result.ip, '192.168.1.103');
  assert.equal(result.port, 4210);
  assert.equal(result.method, 'CACHE');
  assert.deepEqual(calledUrls, ['http://192.168.1.103/json/info']);
  assert.equal(savedIp, null);
});

test('ESP32 Auto-Discovery — Prioridade 2: Fallback para mDNS quando cache falha e salva novo IP', async () => {
  const calledUrls: string[] = [];
  let savedIp: string | null = null;
  let savedPort: number | null = null;

  const mockFetch: typeof fetch = async (input) => {
    const url = String(input);
    calledUrls.push(url);
    if (url === `http://${ESP32_MDNS_HOST}/json/info`) {
      return createJsonResponse({
        name: 'G7 Desk F1',
        brand: 'WLED',
        udpport: 4210,
        ip: '192.168.1.142'
      });
    }
    throw new Error('Connection refused');
  };

  const result = await discoverLightingDeviceWithDetails({
    fetchFn: mockFetch,
    getLastSavedIp: async () => '192.168.1.103',
    saveLastIp: async (ip, port) => {
      savedIp = ip;
      savedPort = port;
    },
    getLocalIpv4: async () => '192.168.1.50'
  });

  assert.equal(result.ip, '192.168.1.142');
  assert.equal(result.port, 4210);
  assert.equal(result.method, 'MDNS');
  assert.equal(savedIp, '192.168.1.142');
  assert.equal(savedPort, 4210);
  assert.deepEqual(calledUrls, [
    'http://192.168.1.103/json/info',
    `http://${ESP32_MDNS_HOST}/json/info`
  ]);
});

test('ESP32 Auto-Discovery — Prioridade 3: Varredura paralela da sub-rede encontra dispositivo e cancela pendentes', async () => {
  let savedIp: string | null = null;
  let abortedCount = 0;

  const mockFetch: typeof fetch = async (input, init) => {
    const url = String(input);

    // Roteador ou outro dispositivo que responde 200 mas não é G7 Desk F1
    if (url === 'http://192.168.1.1/json/info') {
      return createJsonResponse({ name: 'Router Admin', udpport: 80 });
    }

    // Novo IP DHCP do ESP32
    if (url === 'http://192.168.1.27/json/info') {
      return createJsonResponse({
        name: 'G7 Desk F1',
        brand: 'WLED',
        udpport: 4210,
        ip: '192.168.1.27'
      });
    }

    // Simula IPs sem resposta que ficam pendentes até timeout/abort
    return new Promise<Response>((_resolve, reject) => {
      const onAbort = () => {
        abortedCount++;
        reject(new DOMException('Aborted', 'AbortError'));
      };
      if (init?.signal?.aborted) {
        onAbort();
        return;
      }
      init?.signal?.addEventListener('abort', onAbort, { once: true });
    });
  };

  const result = await discoverLightingDeviceWithDetails({
    fetchFn: mockFetch,
    getLastSavedIp: async () => '192.168.1.103',
    saveLastIp: async (ip) => {
      savedIp = ip;
    },
    getLocalIpv4: async () => '192.168.1.50',
    cacheTimeoutMs: 50,
    mdnsTimeoutMs: 50,
    scanTimeoutMs: 150,
    scanConcurrency: 40
  });

  assert.equal(result.ip, '192.168.1.27');
  assert.equal(result.port, 4210);
  assert.equal(result.method, 'SUBNET_SCAN');
  assert.equal(savedIp, '192.168.1.27');
  assert.ok(abortedCount > 0, 'Deve abortar requisições pendentes ao encontrar o ESP32');
});

test('ESP32 Auto-Discovery — Retorna null quando dispositivo não é encontrado na rede', async () => {
  const mockFetch: typeof fetch = async () => {
    throw new Error('ECONNREFUSED');
  };

  const result = await discoverLightingDeviceWithDetails({
    fetchFn: mockFetch,
    getLastSavedIp: async () => '192.168.1.103',
    saveLastIp: async () => {},
    getLocalIpv4: async () => '192.168.1.50',
    cacheTimeoutMs: 30,
    mdnsTimeoutMs: 30,
    scanTimeoutMs: 30,
    scanConcurrency: 40
  });

  assert.equal(result.ip, null);
  assert.equal(result.method, null);
});
