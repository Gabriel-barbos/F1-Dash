# 🏎️ F1 25 Cockpit Telemetry Dashboard

Projeto dividido em duas frentes completas:

`	ext
F1 Dash/
├── web-server/     # Servidor Node.js de UDP + WebSocket + Preview Web (Vite)
└── mobile-app/     # Aplicativo React Native (Expo) com Cockpit Display
`

---

## 1. 🌐 Web Server & Simulador de Testes (web-server/)

Ideal para receber os dados do PS5/PC e inspecionar a telemetria no navegador.

### Como rodar:
`ash
cd web-server
npm install
npm run dev
`
* **Dashboard Web**: http://localhost:5173 ou http://IP_DO_PC:5173
* **Socket UDP**: Escutando na porta 20777

### Testar sem o videogame ligado (Mock Simulator):
Em um segundo terminal dentro de web-server:
`ash
npm run mock
`

---

## 2. 📱 App Mobile React Native (mobile-app/)

Aplicativo nativo para smartphone Android/iOS com layout Landscape (celular deitado), contendo:
- **Modo Realista (Cockpit)** e **Modo Moderno** (com contagiros curvo).
- LEDs de RPM / RevLights (15 LEDs de troca de marcha).
- Marcha gigante, velocidade em km/h e badges dinâmicos de DRS e Overtake.
- Cronômetro de voltas, setores, posições (P1..P24) e deltas.
- Indicador térmico de 4 pneus (temperaturas, pressões em PSI, desgaste e compostos).
- Painel de alerta com faixas animadas para **Safety Car (SC)**, **VSC**, **Bandeira Vermelha** e **Pit Lane**.
- **Mapa Térmico de Danos do Carro (Damage Heatmap)** em SVG.
- Simulador interno embutido com seletor de cenários para testes imediatos no celular.

### Como rodar no celular com Expo:
`ash
cd mobile-app
npm install
npx expo start
`
* Abra o app **Expo Go** no seu celular Android e leia o QR Code gerado no terminal.
* Você terá **Fast Refresh e Hot Reloading** em tempo real a cada alteração de design!
