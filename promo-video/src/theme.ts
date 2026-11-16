export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const COLORS = {
  bg: '#F6F1E9',        // Creme da apresentação
  bgCard: '#FFFFFF',    // Fundo dos cards
  ink: '#111111',       // Preto principal / bordas
  muted: '#4A4640',     // Cinza escuro para textos secundários
  red: '#D92323',       // Vermelho Ferrari / destaque
  redSoft: '#FBEAEA',
  green: '#16A34A',     // Pista livre / DRS / sucesso
  amber: '#F59E0B',     // Safety Car
  cyan: '#0EA5E9',      // Chuva / pista molhada
  purple: '#9333EA',    // Boost / ERS deploy
  teal: '#0D9488',      // Overtake
  darkPanel: '#161618', // Painel HUD / terminal
};

export const FONTS = {
  mono: '"JetBrains Mono", "Consolas", "Courier New", monospace',
  sans: '"Inter", "Segoe UI", system-ui, sans-serif',
};

// Durações exatas em frames (30 fps) sincronizadas com os áudios TTS
export const SCENE_FRAMES = {
  scene1: 426, // 13.32s VO + respiro
  scene2: 345, // 10.63s VO + respiro
  scene3: 459, // 14.38s VO + respiro
  scene4: 732, // 13.49s VO + 9.46s Claudinho + respiro
  scene4ClaudinhoStart: 414, // 13.8s
  scene5: 456, // 14.21s VO + respiro (6 modos de 76 frames cada)
  scene6: 243, // 6.07s VO + hold final
};
