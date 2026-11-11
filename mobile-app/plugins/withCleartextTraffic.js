const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin:
 * 1. android:usesCleartextTraffic="true" no AndroidManifest.xml
 * 2. Filtra no nativo apenas os pacotes pesados inúteis (Motion 0, Participants 4, SessionHistory 11)
 *    SEM limitar a taxa de CarTelemetry (60Hz total garantido).
 */
module.exports = function withCleartextTraffic(config) {
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application?.[0];
    if (mainApplication) {
      mainApplication.$ = mainApplication.$ || {};
      mainApplication.$['android:usesCleartextTraffic'] = 'true';
    }
    return config;
  });

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      try {
        const candidates = [
          path.join(
            config.modRequest.projectRoot,
            'node_modules',
            '@isvend',
            'expo-udp',
            'android',
            'src',
            'main',
            'java',
            'expo',
            'modules',
            'udp',
            'ExpoUdpModule.kt'
          ),
          path.join(
            config.modRequest.projectRoot,
            '..',
            'node_modules',
            '@isvend',
            'expo-udp',
            'android',
            'src',
            'main',
            'java',
            'expo',
            'modules',
            'udp',
            'ExpoUdpModule.kt'
          )
        ];

        for (const ktPath of candidates) {
          if (fs.existsSync(ktPath)) {
            let content = fs.readFileSync(ktPath, 'utf8');

            // Filtro seguro: descarta apenas pacotes desnecessários na porta 20777 sem nenhum rate-limiting
            if (!content.includes('// F1_CLEAN_PACKET_FILTER')) {
              content = content.replace(
                /state\.socket\.receive\(packet\)[\s\S]*?val bytes = packet\.data\.copyOfRange\(packet\.offset, packet\.offset \+ packet\.length\)/,
                `state.socket.receive(packet)
          // F1_CLEAN_PACKET_FILTER: Descarta Motion e históricos sem limitar a taxa de 60Hz da telemetria
          if (state.socket.localPort == 20777 && packet.length >= 7) {
            val pktId = packet.data[packet.offset + 6].toInt() and 0xFF
            if (pktId != 1 && pktId != 2 && pktId != 3 && pktId != 6 && pktId != 7 && pktId != 10 && pktId != 16) {
              continue
            }
          }
          val bytes = packet.data.copyOfRange(packet.offset, packet.offset + packet.length)`
              );
            }

            fs.writeFileSync(ktPath, content, 'utf8');
          }
        }
      } catch (err) {
        console.warn('[withCleartextTraffic] Erro:', err);
      }
      return config;
    }
  ]);

  return config;
};
