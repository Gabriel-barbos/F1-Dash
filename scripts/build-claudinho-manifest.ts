import fs from 'fs';
import path from 'path';
import { processRadioVoice } from '../mobile-app/src/services/radio-dsp';

const AUDIO_DIR = path.resolve('./mobile-app/assets/engineer/audio');
const OUTPUT_TS = path.resolve('./mobile-app/src/services/claudinho-clips.ts');

interface ClipMeta {
  id: string;
  scenario: string;
  filename: string;
  text: string;
}

const CLIP_METAS: ClipMeta[] = [
  // DAMAGE
  { id: 'damage_1', scenario: 'DAMAGE', filename: 'damage_1.wav', text: 'Puta que pariu, bateu onde?! Segura esse carro na pista, porra!' },
  { id: 'damage_2', scenario: 'DAMAGE', filename: 'damage_2.wav', text: 'Cuidado com a asa dianteira, caralho! Me avisa se o volante tá torto!' },
  { id: 'damage_3', scenario: 'DAMAGE', filename: 'damage_3.wav', text: 'Merda, danificou o carro! Não arrisca agora, traz ele inteiro!' },

  // OVERTAKE
  { id: 'overtake_1', scenario: 'OVERTAKE', filename: 'overtake_1.wav', text: 'CARALHO, QUE PASSADA! É disso que eu tô falando, Gabriel, porra!' },
  { id: 'overtake_2', scenario: 'OVERTAKE', filename: 'overtake_2.wav', text: 'Moleque doido, passou voando! Mantém essa porra de ritmo!' },
  { id: 'overtake_3', scenario: 'OVERTAKE', filename: 'overtake_3.wav', text: 'Boa, Gabriel! O cara nem viu a cor do carro, caralho!' },

  // POSITION_LOST
  { id: 'pos_lost_1', scenario: 'POSITION_LOST', filename: 'pos_lost_1.wav', text: 'Puta que pariu, tomou passada! Foco na retomada, Gabriel, vai pra cima!' },
  { id: 'pos_lost_2', scenario: 'POSITION_LOST', filename: 'pos_lost_2.wav', text: 'Perdeu posição, caralho! Não deixa ele abrir, cola na asa dele!' },

  // GAP_BEHIND
  { id: 'gap_behind_1', scenario: 'GAP_BEHIND', filename: 'gap_behind_1.wav', text: 'Atenção Gabriel, o cara de trás tá com asa aberta e colando! Fecha a porta!' },
  { id: 'gap_behind_2', scenario: 'GAP_BEHIND', filename: 'gap_behind_2.wav', text: 'Olha o retrovisor, ele tá a menos de um segundo! Traciona forte nessa saída!' },
  { id: 'gap_behind_3', scenario: 'GAP_BEHIND', filename: 'gap_behind_3.wav', text: 'O cara de trás tá babando no seu câmbio, porra! Mantém a linha interna!' },

  // GAP_UPDATE
  { id: 'gap_front_1', scenario: 'GAP_UPDATE', filename: 'gap_front_1.wav', text: 'O cara da frente tá logo ali, Gabriel! Tira essa diferença, caralho!' },
  { id: 'gap_front_2', scenario: 'GAP_UPDATE', filename: 'gap_front_2.wav', text: 'Cola na asa dele, porra! Tá a menos de dois segundos, bota pressão!' },
  { id: 'gap_front_3', scenario: 'GAP_UPDATE', filename: 'gap_front_3.wav', text: 'Diferença pro carro da frente caindo, Gabriel! Mantém o pé que você engole ele!' },

  // SAFETY_CAR
  { id: 'safety_car_1', scenario: 'SAFETY_CAR', filename: 'safety_car_1.wav', text: 'Safety car na pista, porra! Segura o delta positivo e não faz cagada!' },
  { id: 'safety_car_2', scenario: 'SAFETY_CAR', filename: 'safety_car_2.wav', text: 'Bandeira amarela, safety car! Respira, economiza pneu e foca no delta!' },

  // VSC
  { id: 'vsc_1', scenario: 'VSC', filename: 'vsc_1.wav', text: 'Virtual Safety Car na pista! Olha o delta no visor e segura o pé!' },
  { id: 'vsc_2', scenario: 'VSC', filename: 'vsc_2.wav', text: 'VSC acionado! Mantém o delta positivo, não toma punição à toa!' },

  // RED_FLAG
  { id: 'red_flag_1', scenario: 'RED_FLAG', filename: 'red_flag_1.wav', text: 'Bandeira vermelha, caralho! Sessão suspensa, traz o carro pro box devagar!' },
  { id: 'red_flag_2', scenario: 'RED_FLAG', filename: 'red_flag_2.wav', text: 'Red flag na pista, porra! Reduz o ritmo e entra direto no pit lane!' },

  // PIT_LANE
  { id: 'pit_lane_1', scenario: 'PIT_LANE', filename: 'pit_lane_1.wav', text: 'Box agora, box agora! Aciona a porra do limitador na linha!' },
  { id: 'pit_lane_2', scenario: 'PIT_LANE', filename: 'pit_lane_2.wav', text: 'Entrando no pit, não esquece o limitador! Parada rápida agora!' },

  // FASTEST_LAP
  { id: 'fastest_lap_1', scenario: 'FASTEST_LAP', filename: 'fastest_lap_1.wav', text: 'VOLTA MAIS RÁPIDA! É o Goat da F1, caralho! Que volta absurda!' },
  { id: 'fastest_lap_2', scenario: 'FASTEST_LAP', filename: 'fastest_lap_2.wav', text: 'Roxo em todos os setores! Você tá voando baixo hoje, porra!' },

  // TYRE_WEAR
  { id: 'tyre_wear_1', scenario: 'TYRE_WEAR', filename: 'tyre_wear_1.wav', text: 'Esses pneus tão no osso, porra! Mais de 70% de desgaste, segura na curva!' },
  { id: 'tyre_wear_2', scenario: 'TYRE_WEAR', filename: 'tyre_wear_2.wav', text: 'Cuidado com a tração, caralho, os pneus tão só o farelo!' },

  // CALM_RACE
  { id: 'calm_1', scenario: 'CALM_RACE', filename: 'calm_1.wav', text: 'Tá tão calmo que parece passeio de domingo, Gabriel! Anda logo com essa lata velha!' },

  // START
  { id: 'start_1', scenario: 'START', filename: 'overtake_2.wav', text: 'Moleque doido, passou voando! Mantém essa porra de ritmo!' }
];

function main() {
  console.log('Construindo manifesto com envelopes dos áudios...');

  const manifestItems: any[] = [];

  for (const meta of CLIP_METAS) {
    const filePath = path.join(AUDIO_DIR, meta.filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`Arquivo não encontrado: ${filePath}`);
      continue;
    }

    const bytes = fs.readFileSync(filePath);
    const b64 = bytes.toString('base64');
    const processed = processRadioVoice(b64);

    manifestItems.push({
      id: meta.id,
      scenario: meta.scenario,
      filename: meta.filename,
      text: meta.text,
      durationMs: processed.durationMs,
      // Reduz resolução do envelope para manter o bundle ultra compacto (~30 pontos por áudio)
      envelope: processed.envelope.filter((_, idx) => idx % 2 === 0).map((v) => Number(v.toFixed(3)))
    });

    console.log(`✓ ${meta.id} (${meta.scenario}) — ${processed.durationMs}ms`);
  }

  // Gera o arquivo TypeScript
  const tsContent = `// Gerado automaticamente com os áudios oficiais do Claudinho Ronaldo
export interface ClaudinhoClip {
  id: string;
  scenario: string;
  text: string;
  asset: any;
  durationMs: number;
  envelope: number[];
}

export const CLAUDINHO_AUDIO_ASSETS: Record<string, any> = {
${Array.from(new Set(manifestItems.map((m) => m.filename)))
  .map((fn) => `  ${JSON.stringify(fn)}: require('../../assets/engineer/audio/${fn}'),`)
  .join('\n')}
};

export const CLAUDINHO_CLIPS: ClaudinhoClip[] = [
${manifestItems
  .map(
    (m) => `  {
    id: ${JSON.stringify(m.id)},
    scenario: ${JSON.stringify(m.scenario)},
    text: ${JSON.stringify(m.text)},
    asset: CLAUDINHO_AUDIO_ASSETS[${JSON.stringify(m.filename)}],
    durationMs: ${m.durationMs},
    envelope: ${JSON.stringify(m.envelope)}
  },`
  )
  .join('\n')}
];

const lastPlayedByScenario: Map<string, string> = new Map();

/**
 * Retorna um clipe autêntico do Claudinho Ronaldo com 0ms de latência e sem dependência de rede.
 * Garante rotação sem repetição imediata para o mesmo cenário.
 */
export function getClaudinhoClip(scenario: string, driverName: string = 'Gabriel'): ClaudinhoClip {
  const matches = CLAUDINHO_CLIPS.filter((c) => c.scenario === scenario);
  const pool = matches.length > 0 ? matches : CLAUDINHO_CLIPS.filter((c) => c.scenario === 'OVERTAKE');

  const lastId = lastPlayedByScenario.get(scenario);
  const filtered = pool.filter((c) => c.id !== lastId);
  const candidates = filtered.length > 0 ? filtered : pool;

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  lastPlayedByScenario.set(scenario, chosen.id);

  if (driverName !== 'Gabriel') {
    return {
      ...chosen,
      text: chosen.text.replace(/Gabriel/g, driverName)
    };
  }
  return chosen;
}
`;

  fs.writeFileSync(OUTPUT_TS, tsContent);
  console.log(`Manifesto salvo com sucesso em: ${OUTPUT_TS}`);
}

main();
