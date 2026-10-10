import fs from 'fs';
import path from 'path';
import { processRadioVoice, base64ToBytes } from '../mobile-app/src/services/radio-dsp';

const API_KEY = 'AQ.Ab8RN6LgIEBTDjoOU0k7dj_BYMD9Slh6fjVUuZWpuS82HOCyyA';
const TTS_MODELS = [
  'gemini-3.8-flash-lite-tts',
  'gemini-3.1-flash-tts-preview',
  'gemini-2.5-flash-preview-tts',
  'gemini-3.8-flash-tts'
];

interface ClipDef {
  id: string;
  scenario: string;
  text: string;
}

const CLIPS_TO_GENERATE: ClipDef[] = [
  // DAMAGE
  { id: 'damage_1', scenario: 'DAMAGE', text: 'Puta que pariu, bateu onde?! Segura esse carro na pista, porra!' },
  { id: 'damage_2', scenario: 'DAMAGE', text: 'Cuidado com a asa dianteira, caralho! Me avisa se o volante tá torto!' },
  { id: 'damage_3', scenario: 'DAMAGE', text: 'Merda, danificou o carro! Não arrisca agora, traz ele inteiro!' },

  // OVERTAKE
  { id: 'overtake_1', scenario: 'OVERTAKE', text: 'CARALHO, QUE PASSADA! É disso que eu tô falando, Gabriel, porra!' },
  { id: 'overtake_2', scenario: 'OVERTAKE', text: 'Moleque doido, passou voando! Mantém essa porra de ritmo!' },
  { id: 'overtake_3', scenario: 'OVERTAKE', text: 'Boa, Gabriel! O cara nem viu a cor do carro, caralho!' },

  // POSITION_LOST
  { id: 'pos_lost_1', scenario: 'POSITION_LOST', text: 'Puta que pariu, tomou passada! Foco na retomada, Gabriel, vai pra cima!' },
  { id: 'pos_lost_2', scenario: 'POSITION_LOST', text: 'Perdeu posição, caralho! Não deixa ele abrir, cola na asa dele!' },

  // GAP_BEHIND
  { id: 'gap_behind_1', scenario: 'GAP_BEHIND', text: 'Atenção Gabriel, o cara de trás tá com asa aberta e colando! Fecha a porta!' },
  { id: 'gap_behind_2', scenario: 'GAP_BEHIND', text: 'Olha o retrovisor, ele tá a menos de um segundo! Traciona forte nessa saída!' },
  { id: 'gap_behind_3', scenario: 'GAP_BEHIND', text: 'O cara de trás tá babando no seu câmbio, porra! Mantém a linha interna!' },

  // GAP_UPDATE
  { id: 'gap_front_1', scenario: 'GAP_UPDATE', text: 'O cara da frente tá logo ali, Gabriel! Tira essa diferença, caralho!' },
  { id: 'gap_front_2', scenario: 'GAP_UPDATE', text: 'Cola na asa dele, porra! Tá a menos de dois segundos, bota pressão!' },
  { id: 'gap_front_3', scenario: 'GAP_UPDATE', text: 'Diferença pro carro da frente caindo, Gabriel! Mantém o pé que você engole ele!' },

  // SAFETY_CAR
  { id: 'safety_car_1', scenario: 'SAFETY_CAR', text: 'Safety car na pista, porra! Segura o delta positivo e não faz cagada!' },
  { id: 'safety_car_2', scenario: 'SAFETY_CAR', text: 'Bandeira amarela, safety car! Respira, economiza pneu e foca no delta!' },

  // VSC
  { id: 'vsc_1', scenario: 'VSC', text: 'Virtual Safety Car na pista! Olha o delta no visor e segura o pé!' },
  { id: 'vsc_2', scenario: 'VSC', text: 'VSC acionado! Mantém o delta positivo, não toma punição à toa!' },

  // RED_FLAG
  { id: 'red_flag_1', scenario: 'RED_FLAG', text: 'Bandeira vermelha, caralho! Sessão suspensa, traz o carro pro box devagar!' },
  { id: 'red_flag_2', scenario: 'RED_FLAG', text: 'Red flag na pista, porra! Reduz o ritmo e entra direto no pit lane!' },

  // PIT_LANE
  { id: 'pit_lane_1', scenario: 'PIT_LANE', text: 'Box agora, box agora! Aciona a porra do limitador na linha!' },
  { id: 'pit_lane_2', scenario: 'PIT_LANE', text: 'Entrando no pit, não esquece o limitador! Parada rápida agora!' },

  // FASTEST_LAP
  { id: 'fastest_lap_1', scenario: 'FASTEST_LAP', text: 'VOLTA MAIS RÁPIDA! É o Goat da F1, caralho! Que volta absurda!' },
  { id: 'fastest_lap_2', scenario: 'FASTEST_LAP', text: 'Roxo em todos os setores! Você tá voando baixo hoje, porra!' },

  // TYRE_WEAR
  { id: 'tyre_wear_1', scenario: 'TYRE_WEAR', text: 'Esses pneus tão no osso, porra! Mais de 70% de desgaste, segura na curva!' },
  { id: 'tyre_wear_2', scenario: 'TYRE_WEAR', text: 'Cuidado com a tração, caralho, os pneus tão só o farelo!' },

  // CALM_RACE
  { id: 'calm_1', scenario: 'CALM_RACE', text: 'Tá tão calmo que parece passeio de domingo, Gabriel! Anda logo com essa lata velha!' },
  { id: 'calm_2', scenario: 'CALM_RACE', text: 'Tudo sussa por aqui, Gabriel. Só não vai dormir no volante, caralho!' },
  { id: 'calm_3', scenario: 'CALM_RACE', text: 'Pista limpa na sua frente, hein? Vê se não inventa moda e mantém o ritmo, moleque!' },
  { id: 'calm_4', scenario: 'CALM_RACE', text: 'A resenha tá boa mas acelera essa porra, Gabriel! O chefe tá olhando!' },
  { id: 'calm_5', scenario: 'CALM_RACE', text: 'Ótimo ritmo, moleque! Continua virando volta limpa e foca na corrida!' },

  // START
  { id: 'start_1', scenario: 'START', text: 'Luzes apagadas, acelera essa porra! Pra cima deles, Gabriel!' },
  { id: 'start_2', scenario: 'START', text: 'Bora Gabriel, largada perfeita! Traciona e fecha a porta na um!' }
];

async function fetchAudioBase64(text: string): Promise<string> {
  const body = JSON.stringify({
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
    }
  });

  for (const model of TTS_MODELS) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      if (res.status === 200) {
        const json = await res.json();
        const data = json?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
        if (data) return data;
      } else {
        console.warn(`[TTS] ${model} retornou status ${res.status}`);
      }
    } catch (e: any) {
      console.warn(`[TTS] Falha com ${model}:`, e.message);
    }
  }
  throw new Error(`Falha ao gerar áudio para: "${text}" em todos os modelos.`);
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const outDir = path.resolve('./mobile-app/assets/engineer/audio');
  fs.mkdirSync(outDir, { recursive: true });

  const generatedManifest: any[] = [];

  console.log(`Iniciando geração de ${CLIPS_TO_GENERATE.length} áudios oficiais do Claudinho Ronaldo...`);

  for (let i = 0; i < CLIPS_TO_GENERATE.length; i++) {
    const clip = CLIPS_TO_GENERATE[i];
    const wavPath = path.join(outDir, `${clip.id}.wav`);

    // Se o arquivo WAV já foi gerado e existe em disco, reaproveita sem gastar cota da API
    if (fs.existsSync(wavPath) && fs.statSync(wavPath).size > 1000) {
      console.log(`[${i + 1}/${CLIPS_TO_GENERATE.length}] Clip "${clip.id}" já existe em disco, reaproveitando.`);
      const existingBytes = fs.readFileSync(wavPath);
      const b64 = existingBytes.toString('base64');
      const processed = processRadioVoice(b64);
      generatedManifest.push({
        id: clip.id,
        scenario: clip.scenario,
        text: clip.text,
        filename: `${clip.id}.wav`,
        durationMs: processed.durationMs,
        envelope: processed.envelope
      });
      continue;
    }

    console.log(`[${i + 1}/${CLIPS_TO_GENERATE.length}] Gerando "${clip.id}" (${clip.scenario}): "${clip.text}"`);

    let rawBase64 = '';
    let attempts = 0;
    while (!rawBase64 && attempts < 6) {
      attempts++;
      try {
        rawBase64 = await fetchAudioBase64(clip.text);
      } catch (err: any) {
        console.warn(`Tentativa ${attempts} falhou, aguardando 15s para renovar cota...`);
        await sleep(15000);
      }
    }

    if (!rawBase64) {
      throw new Error(`Abortando: não foi possível gerar o áudio ${clip.id}`);
    }

    const processed = processRadioVoice(rawBase64);
    const wavBytes = base64ToBytes(processed.wavBase64);
    fs.writeFileSync(wavPath, Buffer.from(wavBytes));

    generatedManifest.push({
      id: clip.id,
      scenario: clip.scenario,
      text: clip.text,
      filename: `${clip.id}.wav`,
      durationMs: processed.durationMs,
      envelope: processed.envelope
    });

    console.log(`  -> Salvo ${clip.id}.wav (${wavBytes.length} bytes, ${processed.durationMs}ms, ${processed.envelope.length} env points)`);
    await sleep(400); // pequeno intervalo para respeitar taxa da API
  }

  // Gera o arquivo TypeScript de manifesto e exports
  const tsContent = `// Gerado automaticamente por scripts/generate-claudinho-audio.ts
export interface ClaudinhoClip {
  id: string;
  scenario: string;
  text: string;
  asset: any;
  durationMs: number;
  envelope: number[];
}

export const CLAUDINHO_AUDIO_ASSETS: Record<string, any> = {
${generatedManifest.map((c) => `  ${JSON.stringify(c.id)}: require('../../assets/engineer/audio/${c.filename}'),`).join('\n')}
};

export const CLAUDINHO_CLIPS: ClaudinhoClip[] = [
${generatedManifest
  .map(
    (c) => `  {
    id: ${JSON.stringify(c.id)},
    scenario: ${JSON.stringify(c.scenario)},
    text: ${JSON.stringify(c.text)},
    asset: CLAUDINHO_AUDIO_ASSETS[${JSON.stringify(c.id)}],
    durationMs: ${c.durationMs},
    envelope: ${JSON.stringify(c.envelope)}
  },`
  )
  .join('\n')}
];

const lastPlayedByScenario: Map<string, string> = new Map();

/**
 * Retorna um clipe de áudio autêntico pré-carregado para o cenário solicitado,
 * garantindo rotação sem repetição imediata da mesma frase.
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

  const manifestPath = path.resolve('./mobile-app/src/services/claudinho-clips.ts');
  fs.writeFileSync(manifestPath, tsContent);
  console.log(`Manifesto exportado com sucesso para ${manifestPath}!`);
}

main().catch((err) => {
  console.error('Erro na execução principal:', err);
  process.exit(1);
});
