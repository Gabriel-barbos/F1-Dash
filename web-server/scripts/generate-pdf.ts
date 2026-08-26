import PDFDocument from 'pdfkit';
import fs from 'node:fs';
import path from 'node:path';

const outputPath = path.resolve(process.cwd(), 'F1_Telemetry_Dashboard_Documentacao.pdf');
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  bufferPages: true
});

const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// CORES DO TEMA F1
const COLOR_RED = '#E10600';
const COLOR_DARK = '#151824';
const COLOR_TEXT = '#222B45';
const COLOR_SUBTEXT = '#5A6480';
const COLOR_ACCENT = '#00838F';
const COLOR_BG_PANEL = '#F4F6F9';

// CABEÇALHO DA CAPA
doc.rect(0, 0, doc.page.width, 160).fill(COLOR_DARK);

doc.fillColor('#FFFFFF').fontSize(26).font('Helvetica-Bold')
   .text('F1 TELEMETRY DASHBOARD', 50, 45, { align: 'left' });

doc.fillColor(COLOR_RED).fontSize(14).font('Helvetica-Bold')
   .text('DOCUMENTO TÉCNICO, CONCEITUAL E ROADMAP MOBILE', 50, 80);

doc.fillColor('#A0AEC0').fontSize(10).font('Helvetica')
   .text('EA SPORTS™ F1® 25 (PS5 / Formato 2026) | Node.js, TypeScript e React Native', 50, 105);

doc.y = 185;

function addSectionTitle(partNumber: string, title: string) {
  doc.moveDown(1);
  const y = doc.y;
  doc.rect(50, y, doc.page.width - 100, 26).fill(COLOR_BG_PANEL);
  doc.rect(50, y, 6, 26).fill(COLOR_RED);
  doc.fillColor(COLOR_DARK).fontSize(13).font('Helvetica-Bold')
     .text(`${partNumber} — ${title}`, 65, y + 6);
  doc.moveDown(0.8);
}

function addSubTitle(title: string) {
  doc.moveDown(0.6);
  doc.fillColor(COLOR_ACCENT).fontSize(11).font('Helvetica-Bold')
     .text(title);
  doc.moveDown(0.3);
}

function addParagraph(text: string) {
  doc.fillColor(COLOR_TEXT).fontSize(9.5).font('Helvetica').lineGap(3)
     .text(text, { align: 'justify' });
  doc.moveDown(0.4);
}

function addBullet(label: string, text: string) {
  doc.fillColor(COLOR_DARK).fontSize(9.5).font('Helvetica-Bold')
     .text(`• ${label}: `, { continued: true })
     .font('Helvetica').fillColor(COLOR_TEXT)
     .text(text, { align: 'justify' });
  doc.moveDown(0.2);
}

// --- PARTE 1 ---
addSectionTitle('PARTE 1', 'Proposta, Ideia do Projeto e Conceito');

addSubTitle('1.1 Visão Geral e Motivação');
addParagraph(
  'O F1 Telemetry Dashboard é um sistema pessoal de telemetria e cockpit display em tempo real projetado para o EA SPORTS™ F1® 25 no PlayStation 5. O projeto foi concebido para oferecer uma visão clara, imediata e de alto contraste das informações vitais do carro durante a corrida (como entrega de energia da bateria ERS, modo boost/reta, desgaste de pneus, danos mecânicos e tempos de volta), eliminando a necessidade de navegação nos menus internos MFD durante a pilotagem.'
);

addSubTitle('1.2 Princípios e Filosofia de Design');
addBullet('Total Autonomia e Custo Zero', 'Opera 100% dentro da rede local Wi-Fi. Não há dependência de internet durante a corrida, nem servidores na nuvem, logins ou cobranças de mensalidade.');
addBullet('Comunicação Oficial e Não Invasiva', 'Utiliza a telemetria UDP oficial disponibilizada nativamente pelo jogo, garantindo integridade sem modificações no console.');
addBullet('Primeiro Provar, Depois Construir', 'O desenvolvimento seguiu rigorosamente a comprovação da camada física/UDP no Windows antes da construção da interface móvel final.');

// --- PARTE 2 ---
addSectionTitle('PARTE 2', 'Próximos Passos e Roadmap Mobile (Android APK)');

addSubTitle('2.1 Roadmap de Evolução');
addBullet('Fase 1 (Concluída)', 'PoC no Windows comprovando recepção de pacotes UDP na porta 20777 e deserialização do formato 2026.');
addBullet('Fase 2 (Concluída)', 'Dashboard Web Pro no navegador integrando ERS/Bateria, Modo Boost, Danos e Pneus em tempo real.');
addBullet('Fase 3 (Próximo Passo)', 'Gravação de fixtures binárias (.bin) de voltas reais para testes automatizados offline sem necessidade de ligar o PS5.');
addBullet('Fase 4', 'Desenvolvimento do aplicativo mobile em React Native + Expo (Development Build para suporte a sockets UDP nativos).');
addBullet('Fase 5', 'Interface mobile dedicada otimizada para smartphones e tablets acoplados na horizontal (Landscape Mode) com renderização fluida a 60 FPS.');
addBullet('Fase 6', 'Geração do arquivo APK de produção para instalação direta no dispositivo Android sem passar pela Play Store.');

// --- PARTE 3 ---
doc.addPage();
addSectionTitle('PARTE 3', 'Descrição Técnica dos Componentes e Protocolo F1 25');

addSubTitle('3.1 Especificação do Protocolo UDP (Formato 2026)');
addParagraph(
  'No regulamento 2026 (F1 25 com Season Pack 2026), o jogo transmite dados binários compactados (packed) em Little-Endian com capacidade expandida para 24 carros no grid.'
);

addBullet('Packet Header (29 bytes)', 'Cabeçalho universal contendo packetFormat (2026), gameYear (25), packetId (0..14), sessionUID e o fundamental m_playerCarIndex (índice do jogador no grid).');
addBullet('Car Telemetry (Packet ID 6 - 1448 bytes)', '24 carros x 59 bytes (com m_engineTemperature em uint8). Contém velocidade, marcha, RPM, pedais de aceleração/freio, DRS e temperaturas de pneus/freios.');
addBullet('Car Status (Packet ID 7 - 1134 bytes)', '24 carros x 46 bytes. Responsável pela energia da bateria ERS (m_ersStoreEnergy em Joules até 4MJ), Modo de entrega ERS (0=None, 1=Medium, 2=Hotlap, 3=Overtake/Boost), combustível e bandeiras FIA.');
addBullet('Car Damage (Packet ID 10 - 1009 bytes)', 'Danos de asa dianteira esquerda/direita, asa traseira, assoalho, difusor, câmbio e desgaste dos componentes de motor (ICE, MGU-K, TC, ES, CE).');
addBullet('Lap Data (Packet ID 2 - 1306 bytes)', 'Tempos da volta atual, última volta, setores 1 e 2, posição na corrida (P1..P24) e penalidades.');

addSubTitle('3.2 Arquitetura em Camadas Desacopladas');
addBullet('Camada de Transporte (UdpReceiver)', 'Socket dgram nativo operando em alta frequência (~328 pacotes/segundo) sem gargalo.');
addBullet('Camada de Estado (TelemetryStore)', 'Centralizador de estado atômico em memória. Armazena os dados mais recentes de forma desacoplada dos disparos de rede.');
addBullet('Camada de Broadcast (TelemetryWebServer)', 'Broadcaster WebSocket operando em 30 Hz fixos (~33.3ms) para envio suave de snapshots consolidados.');
addBullet('Camada de Apresentação (UI Web / Mobile)', 'Interface com elementos estáticos no DOM, zero innerHTML e Sample-and-Hold de texto numérico a 10 Hz para leitura estável e nítida.');

// RODAPÉ COM NÚMERO DE PÁGINAS
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  doc.fillColor(COLOR_SUBTEXT).fontSize(8).font('Helvetica')
     .text(
       `F1 Telemetry Dashboard • Página ${i + 1} de ${range.count}`,
       50,
       doc.page.height - 35,
       { align: 'center', width: doc.page.width - 100 }
     );
}

doc.end();

stream.on('finish', () => {
  console.log(`\nPDF gerado com sucesso em: ${outputPath}\n`);
});
