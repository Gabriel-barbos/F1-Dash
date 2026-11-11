#include "ambient_server.h"
#include <ArduinoJson.h>
#include "mode_manager.h"
#include "../leds/led_controller.h"
#include "../communication/f1_udp_receiver.h"

namespace Modes {

AmbientServer* AmbientServer::instance_ = nullptr;

// Página HTML da interface Web embutida (Dark Mode de Alta Performance para celular e desktop)
static const char INDEX_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>G7 Desk F1 — Laboratório de Efeitos</title>
  <style>
    :root {
      --bg: #0a0d13;
      --card: #141822;
      --card-sub: #1b212e;
      --border: #262e3d;
      --red: #e10600;
      --cyan: #00d2be;
      --gold: #ff9f1c;
      --purple: #9d4edd;
      --green: #06d6a0;
      --blue: #3a86ff;
      --text: #f0f4f8;
      --muted: #8b99a8;
      --radius: 12px;
    }
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body {
      margin: 0; padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg); color: var(--text); display: flex; flex-direction: column; align-items: center;
    }
    .container { width: 100%; max-width: 520px; }
    
    /* Header & Status Pill */
    header { text-align: center; margin-bottom: 12px; padding-top: 6px; }
    h1 { margin: 0; font-size: 1.45rem; letter-spacing: 1px; color: var(--text); font-weight: 800; }
    h1 span { color: var(--red); }
    .subtitle { font-size: 0.78rem; color: var(--muted); text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px; }
    
    .status-pill {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 700;
      background: #1b212e; border: 1px solid var(--border); margin-top: 10px;
    }
    .status-pill .dot {
      width: 9px; height: 9px; border-radius: 50%; background: var(--green);
      box-shadow: 0 0 8px var(--green); animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    
    /* Toast Notification */
    #toast {
      position: fixed; top: 12px; left: 50%; transform: translateX(-50%) translateY(-100px);
      background: #232a38; border: 1px solid var(--cyan); color: var(--text);
      padding: 10px 20px; border-radius: 25px; font-size: 0.85rem; font-weight: 600;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6); z-index: 1000;
      transition: transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28), opacity 0.3s;
      opacity: 0; pointer-events: none; text-align: center; white-space: nowrap;
    }
    #toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }

    /* Cards */
    .card {
      background: var(--card); border: 1px solid var(--border); border-radius: var(--radius);
      padding: 14px; margin-bottom: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    }
    .card-title {
      display: flex; justify-content: space-between; align-items: center;
      margin: 0 0 10px 0; font-size: 0.88rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700;
    }
    .card-title span.badge-info {
      font-size: 0.75rem; text-transform: none; color: var(--cyan); font-weight: 600;
    }
    .subgroup-title {
      font-size: 0.74rem; font-weight: 700; color: #a0aec0; text-transform: uppercase;
      letter-spacing: 0.6px; margin: 12px 0 6px 0; padding-bottom: 3px; border-bottom: 1px solid #1e2635;
    }
    .subgroup-title:first-of-type { margin-top: 0; }

    /* Quick Bar */
    .quick-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 6px; }
    .quick-btn {
      padding: 10px 4px; border: 1px solid var(--border); border-radius: 8px; font-size: 0.76rem;
      font-weight: 700; background: var(--card-sub); color: var(--text); cursor: pointer; text-align: center;
      transition: all 0.15s;
    }
    .quick-btn:active { transform: scale(0.95); }
    .quick-btn.active { border-color: var(--cyan); background: rgba(0,210,190,0.15); color: var(--cyan); }
    .quick-btn.red-btn { border-color: rgba(225,6,0,0.4); }
    .quick-btn.red-btn:active { background: var(--red); color: #fff; }

    /* Grids & Buttons */
    .btn-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .btn-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
    .btn-grid-6 { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }

    button.fx-btn {
      display: flex; flex-direction: column; align-items: flex-start; justify-content: center;
      padding: 10px 11px; border: 1px solid var(--border); border-radius: 9px;
      background: var(--card-sub); color: var(--text); cursor: pointer; text-align: left;
      transition: all 0.15s; min-height: 52px;
    }
    button.fx-btn:active { transform: scale(0.97); }
    button.fx-btn.active {
      border-color: var(--cyan); background: rgba(0, 210, 190, 0.15);
      box-shadow: 0 0 12px rgba(0, 210, 190, 0.25);
    }
    button.fx-btn .title { font-size: 0.84rem; font-weight: 700; display: flex; align-items: center; gap: 5px; }
    button.fx-btn .desc { font-size: 0.68rem; color: var(--muted); margin-top: 3px; line-height: 1.15; }

    /* Theme Accents */
    button.btn-overtake { border-left: 3px solid var(--cyan); }
    button.btn-aero { border-left: 3px solid var(--purple); }
    button.btn-rain { border-left: 3px solid #00b4d8; }
    button.btn-storm { border-left: 3px solid #7209b7; }
    button.btn-sc { border-left: 3px solid var(--gold); }
    button.btn-vsc { border-left: 3px solid #f77f00; }
    button.btn-red { border-left: 3px solid var(--red); }
    button.btn-green { border-left: 3px solid var(--green); }
    button.btn-crash { border-left: 3px solid #ff0054; }
    button.btn-victory { border-left: 3px solid #ffd166; }
    button.btn-pit { border-left: 3px solid #f72585; }

    /* Ambient Buttons */
    .amb-btn {
      padding: 10px 6px; border: none; border-radius: 8px; font-size: 0.8rem; font-weight: 700;
      color: #fff; cursor: pointer; text-align: center; transition: all 0.15s;
    }
    .amb-btn:active { transform: scale(0.96); }
    .amb-warm   { background: linear-gradient(135deg, #d97706, #b45309); }
    .amb-cold   { background: linear-gradient(135deg, #0284c7, #0369a1); }
    .amb-nat    { background: linear-gradient(135deg, #64748b, #475569); }
    .amb-sunset { background: linear-gradient(135deg, #ea580c, #c2410c); }
    .amb-cyan   { background: linear-gradient(135deg, #0d9488, #0f766e); }
    .amb-purple { background: linear-gradient(135deg, #7c3aed, #6d28d9); }
    .amb-off    { background: #27272a; color: #a1a1aa; border: 1px solid #3f3f46; }

    /* Color dots */
    .color-dot {
      height: 38px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15);
      cursor: pointer; transition: transform 0.15s;
    }
    .color-dot:active { transform: scale(0.92); }

    /* Slider */
    .slider-box { display: flex; align-items: center; gap: 14px; }
    input[type=range] {
      flex: 1; accent-color: var(--cyan); height: 8px; border-radius: 4px;
      background: #252d3d; outline: none; cursor: pointer;
    }
    .slider-val { font-size: 0.95rem; font-weight: 800; min-width: 44px; text-align: right; color: var(--cyan); }
    input[type=color] {
      width: 100%; height: 42px; border: 1px solid var(--border); border-radius: 8px;
      background: var(--card-sub); cursor: pointer;
    }

    /* Diagnostics Table */
    .diag-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.78rem; }
    .diag-item {
      background: var(--card-sub); padding: 8px 10px; border-radius: 8px; border: 1px solid #1f2735;
    }
    .diag-item .label { color: var(--muted); font-size: 0.7rem; text-transform: uppercase; }
    .diag-item .val { font-size: 0.86rem; font-weight: 700; color: var(--text); margin-top: 2px; }
  </style>
</head>
<body>
  <div id="toast">Efeito ativado!</div>

  <div class="container">
    <header>
      <h1>G7 DESK <span>F1</span></h1>
      <div class="subtitle">Laboratório de Iluminação & Efeitos</div>
      <div class="status-pill" id="statusPill">
        <span class="dot" id="statusDot"></span>
        <span id="statusMode">MODO: CARREGANDO...</span>
      </div>
    </header>

    <!-- Barra Rápida de Modos -->
    <div class="card" style="padding: 10px;">
      <div class="quick-grid">
        <button class="quick-btn" id="btnModeAmb" onclick="setMode('ambient')">🏠 Ambiente</button>
        <button class="quick-btn" id="btnModeF1" onclick="setMode('f1')">🏎️ Modo F1</button>
        <button class="quick-btn" id="btnModeDemo" onclick="triggerEffect('demo', '🔁 Demo Show')">🔁 Demo Show</button>
        <button class="quick-btn red-btn" onclick="setPreset('off')">🌑 Desligar</button>
      </div>
    </div>

    <!-- Brilho Mestre -->
    <div class="card">
      <div class="card-title">
        <span>Brilho Geral dos LEDs</span>
        <span class="badge-info">Todas as Fitas</span>
      </div>
      <div class="slider-box">
        <input type="range" id="briSlider" min="0" max="255" value="200" oninput="onBrightnessInput(this.value)" onchange="onBrightnessCommit(this.value)">
        <span class="slider-val" id="briVal">78%</span>
      </div>
    </div>

    <!-- Laboratório de Efeitos F1 -->
    <div class="card">
      <div class="card-title">
        <span>Laboratório de Efeitos F1 (Live Test)</span>
        <span class="badge-info">Toque para ver no setup</span>
      </div>

      <!-- Desempenho -->
      <div class="subgroup-title">🏎️ Desempenho & Aceleração</div>
      <div class="btn-grid-2">
        <button class="fx-btn btn-overtake" onclick="triggerEffect('overtake', '⚡ Overtake / Boost')">
          <div class="title">⚡ Overtake / Boost</div>
          <div class="desc">Fluxo suave &lt;&lt;&lt;&gt;&gt;&gt; ciano/azul</div>
        </button>
        <button class="fx-btn btn-aero" onclick="triggerEffect('aero', '🚀 Active Aero (DRS)')">
          <div class="title">🚀 Active Aero (DRS)</div>
          <div class="desc">Ondas roxas suaves e contínuas</div>
        </button>
        <button class="fx-btn btn-overtake" onclick="triggerEffect('shiftflash', '✨ Shift Flash')">
          <div class="title">✨ Shift Flash</div>
          <div class="desc">Subida de giro F1 + pulso de troca</div>
        </button>
        <button class="fx-btn btn-red" onclick="triggerEffect('engine', '🔥 Falha de Motor')">
          <div class="title">🔥 Falha de Motor</div>
          <div class="desc">Pulso lento vermelho de alerta crítico</div>
        </button>
      </div>

      <!-- Clima -->
      <div class="subgroup-title">🌧️ Clima & Atmosfera Dinâmica</div>
      <div class="btn-grid-2">
        <button class="fx-btn btn-rain" onclick="triggerEffect('rain', '🌧️ Chuva Dinâmica')">
          <div class="title">🌧️ Chuva Dinâmica</div>
          <div class="desc">Fundo azul oscilante + gotas suaves</div>
        </button>
        <button class="fx-btn btn-storm" onclick="triggerEffect('storm', '⛈️ Tempestade & Raios')">
          <div class="title">⛈️ Tempestade</div>
          <div class="desc">Chuva intensa + flashes de relâmpago</div>
        </button>
      </div>

      <!-- Sinalização -->
      <div class="subgroup-title">🚩 Sinalização de Pista & Boxes</div>
      <div class="btn-grid-2">
        <button class="fx-btn btn-sc" onclick="triggerEffect('safetycar', '🟨 Safety Car (SC)')">
          <div class="title">🟨 Safety Car</div>
          <div class="desc">Pulsar amarelo lento e suave</div>
        </button>
        <button class="fx-btn btn-vsc" onclick="triggerEffect('vsc', '⚠️ Virtual SC (VSC)')">
          <div class="title">⚠️ Virtual SC</div>
          <div class="desc">Pulsar amarelo moderado e macio</div>
        </button>
        <button class="fx-btn btn-sc" onclick="triggerEffect('yellow', '🚩 Bandeira Amarela')">
          <div class="title">🚩 Band. Amarela</div>
          <div class="desc">Ambiente amarelo com pulsar suave</div>
        </button>
        <button class="fx-btn btn-red" onclick="triggerEffect('red', '🚨 Bandeira Vermelha')">
          <div class="title">🚨 Band. Vermelha</div>
          <div class="desc">Ambiente vermelho com pulsar suave</div>
        </button>
        <button class="fx-btn btn-green" onclick="triggerEffect('green', '🟢 Bandeira Verde')">
          <div class="title">🟢 Bandeira Verde</div>
          <div class="desc">Pulso suave de relargada</div>
        </button>
        <button class="fx-btn btn-pit" onclick="triggerEffect('pit', '🛑 Pit Lane / Boxes')">
          <div class="title">🛑 Pit Lane / Boxes</div>
          <div class="desc">Transição suave âmbar e magenta</div>
        </button>
      </div>

      <!-- Momentos Críticos & Vitória -->
      <div class="subgroup-title">💥 Momentos Críticos & Celebração</div>
      <div class="btn-grid-2">
        <button class="fx-btn btn-crash" onclick="triggerEffect('crash', '💥 Batida Violenta')">
          <div class="title">💥 Batida (Crash)</div>
          <div class="desc">Flash único de impacto + dano vermelho</div>
        </button>
        <button class="fx-btn btn-victory" onclick="triggerEffect('victory', '🏁 Bandeira Quadriculada')">
          <div class="title">🏁 Vitória / Chequered</div>
          <div class="desc">Quadriculado suave + backlight âmbar</div>
        </button>
      </div>

      <!-- Bases & Teste -->
      <div class="subgroup-title">☀️ Bases de Iluminação & Hardware</div>
      <div class="btn-grid-3">
        <button class="fx-btn" onclick="triggerEffect('day', '☀️ Pista Dia')">
          <div class="title">☀️ F1 Dia</div>
          <div class="desc">Respiração quente</div>
        </button>
        <button class="fx-btn" onclick="triggerEffect('night', '🌙 Pista Noite')">
          <div class="title">🌙 F1 Noite</div>
          <div class="desc">Respiração fria</div>
        </button>
        <button class="fx-btn" onclick="triggerEffect('test', '🧪 Teste Hardware')">
          <div class="title">🧪 Diagnóstico</div>
          <div class="desc">Ciclo RGB + CCT</div>
        </button>
      </div>
    </div>

    <!-- Presets de Iluminação Ambiente -->
    <div class="card">
      <div class="card-title">
        <span>Iluminação Ambiente (Desk Setup)</span>
        <span class="badge-info">CCT + Backlight</span>
      </div>
      <div class="btn-grid-3" style="margin-bottom: 10px;">
        <button class="amb-btn amb-warm" onclick="setPreset('warm')">☀️ Branco Quente</button>
        <button class="amb-btn amb-cold" onclick="setPreset('cold')">❄️ Branco Frio</button>
        <button class="amb-btn amb-nat" onclick="setPreset('natural')">⚪ Branco Neutro</button>
        <button class="amb-btn amb-sunset" onclick="setPreset('sunset')">🌅 Pôr do Sol</button>
        <button class="amb-btn amb-cyan" onclick="setPreset('cyan')">🌊 Ciano Chill</button>
        <button class="amb-btn amb-purple" onclick="setPreset('purple')">🟣 Roxo Setup</button>
      </div>

      <div class="subgroup-title">Cores Rápidas</div>
      <div class="btn-grid-6" style="margin-bottom: 12px;">
        <div class="color-dot" style="background: #e10600;" onclick="setColor('#e10600')"></div>
        <div class="color-dot" style="background: #00d2be;" onclick="setColor('#00d2be')"></div>
        <div class="color-dot" style="background: #2563eb;" onclick="setColor('#2563eb')"></div>
        <div class="color-dot" style="background: #16a34a;" onclick="setColor('#16a34a')"></div>
        <div class="color-dot" style="background: #eab308;" onclick="setColor('#eab308')"></div>
        <div class="color-dot" style="background: #ec4899;" onclick="setColor('#ec4899')"></div>
      </div>

      <div class="subgroup-title">Cor Livre Customizada</div>
      <input type="color" id="colorPicker" value="#00d2be" onchange="setColor(this.value)">
    </div>

    <!-- Diagnóstico do Sistema -->
    <div class="card">
      <div class="card-title">
        <span>Diagnóstico do Sistema</span>
        <span class="badge-info" id="diagStatusBadge">Online</span>
      </div>
      <div class="diag-grid">
        <div class="diag-item">
          <div class="label">Endereço IP</div>
          <div class="val" id="ipVal">...</div>
        </div>
        <div class="diag-item">
          <div class="label">Sinal Wi-Fi (RSSI)</div>
          <div class="val" id="rssiVal">...</div>
        </div>
        <div class="diag-item">
          <div class="label">Telemetria F1 UDP</div>
          <div class="val" id="f1Val">0 pacotes</div>
        </div>
        <div class="diag-item">
          <div class="label">Memória Livre (Heap)</div>
          <div class="val" id="heapVal">...</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    let toastTimer = null;
    function showToast(msg) {
      const t = document.getElementById('toast');
      t.innerText = msg;
      t.classList.add('show');
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
    }

    function triggerEffect(name, label) {
      showToast('Efeito: ' + (label || name));
      fetch('/api/effect?name=' + name, { method: 'POST' })
        .then(() => setTimeout(updateStatus, 150))
        .catch(() => {});
    }

    function setPreset(p) {
      showToast('Preset: ' + p.toUpperCase());
      fetch('/api/preset?name=' + p, { method: 'POST' })
        .then(() => setTimeout(updateStatus, 150))
        .catch(() => {});
    }

    function setMode(m) {
      showToast('Modo alterado para: ' + m.toUpperCase());
      fetch('/api/mode?name=' + m, { method: 'POST' })
        .then(() => setTimeout(updateStatus, 150))
        .catch(() => {});
    }

    function setColor(hex) {
      const r = parseInt(hex.slice(1,3), 16);
      const g = parseInt(hex.slice(3,5), 16);
      const b = parseInt(hex.slice(5,7), 16);
      showToast(`Cor RGB (${r}, ${g}, ${b})`);
      fetch(`/api/color?r=${r}&g=${g}&b=${b}`, { method: 'POST' })
        .then(() => setTimeout(updateStatus, 150))
        .catch(() => {});
    }

    let briDebounce = null;
    function onBrightnessInput(val) {
      document.getElementById('briVal').innerText = Math.round((val/255)*100) + '%';
      if (briDebounce) clearTimeout(briDebounce);
      briDebounce = setTimeout(() => {
        fetch('/api/brightness?value=' + val, { method: 'POST' });
      }, 100);
    }
    function onBrightnessCommit(val) {
      fetch('/api/brightness?value=' + val, { method: 'POST' });
    }

    function updateStatus() {
      fetch('/api/status').then(r => r.json()).then(d => {
        const modeText = d.mode || 'DESCONHECIDO';
        const effText = d.activeEffect || '';
        const isDemo = d.isDemo;

        let display = modeText;
        if (isDemo) {
          display = 'DEMO SHOW (' + effText + ')';
        } else if (effText && modeText.includes('F1')) {
          display = 'F1: ' + effText;
        }
        document.getElementById('statusMode').innerText = display;

        // Atualiza botões ativos da barra rápida
        document.getElementById('btnModeAmb').classList.toggle('active', modeText.includes('AMBIENT') && !isDemo);
        document.getElementById('btnModeF1').classList.toggle('active', modeText.includes('F1') && !isDemo);
        document.getElementById('btnModeDemo').classList.toggle('active', isDemo);

        document.getElementById('ipVal').innerText = d.ip;
        document.getElementById('rssiVal').innerText = d.rssi + ' dBm';
        document.getElementById('f1Val').innerText = d.f1Packets + ' válidos';
        document.getElementById('heapVal').innerText = Math.round(d.heap / 1024) + ' KB';
      }).catch(()=>{});
    }

    setInterval(updateStatus, 2000);
    updateStatus();
  </script>
</body>
</html>
)rawliteral";

AmbientServer::AmbientServer(AmbientModeController& ambientCtrl, F1ModeController& f1Ctrl)
    : ambientCtrl_(ambientCtrl), f1Ctrl_(f1Ctrl) {
    instance_ = this;
}

void AmbientServer::begin() {
    if (started_) return;
    if (WiFi.status() != WL_CONNECTED) {
        return;
    }

    setupWebRoutes();

    // Registra o dispositivo na Alexa via Espalexa
    EspalexaDevice* alexaDevice = new EspalexaDevice("Luz da Mesa", onAlexaChanged, EspalexaDeviceType::extendedcolor, 200);
    espalexa_.addDevice(alexaDevice);

    espalexa_.begin(&server_);
    started_ = true;

    Serial.printf("[Alexa & Web] Servidor ativo em http://%s:80/ | Dispositivo Alexa: 'Luz da Mesa'\n",
                  WiFi.localIP().toString().c_str());
}

void AmbientServer::update() {
    if (!started_) {
        if (WiFi.status() == WL_CONNECTED) {
            begin();
        }
        return;
    }
    espalexa_.loop();
}

void AmbientServer::onAlexaChanged(EspalexaDevice* dev) {
    if (!dev || !instance_) return;

    uint8_t value = dev->getValue();
    EspalexaDeviceProperty prop = dev->getLastChangedProperty();
    EspalexaColorMode mode = dev->getColorMode();

    Serial.printf("[Alexa Event] Prop: %d | Modo: %d | Brilho: %u\n", (int)prop, (int)mode, value);

    if (prop == EspalexaDeviceProperty::off || (prop == EspalexaDeviceProperty::bri && value == 0)) {
        instance_->f1Ctrl_.clearForcedEffect();
        instance_->ambientCtrl_.setPreset(AmbientColorPreset::OFF);
        Modes::modeManager.forceMode(SystemMode::AMBIENT_MODE);
        Modes::modeManager.releaseForcedMode();
        Serial.println("[Alexa] -> DESLIGAR todas as fitas");
        return;
    }

    if (value == 0) {
        value = 200;
        dev->setValue(200);
    }

    instance_->ambientCtrl_.setBrightness(value);
    instance_->f1Ctrl_.clearForcedEffect();
    Modes::modeManager.forceMode(SystemMode::AMBIENT_MODE);
    Modes::modeManager.releaseForcedMode();

    if (prop == EspalexaDeviceProperty::on) {
        if (instance_->ambientCtrl_.getCurrentPreset() == AmbientColorPreset::OFF) {
            instance_->ambientCtrl_.setPreset(AmbientColorPreset::WARM_WHITE);
        }
        Serial.println("[Alexa] -> LIGAR fitas");
        return;
    }
    if (prop == EspalexaDeviceProperty::bri) {
        if (instance_->ambientCtrl_.getCurrentPreset() == AmbientColorPreset::OFF) {
            instance_->ambientCtrl_.setPreset(AmbientColorPreset::WARM_WHITE);
        }
        Serial.printf("[Alexa] -> BRILHO ajustado para %u\n", value);
        return;
    }

    if (prop == EspalexaDeviceProperty::ct) {
        uint16_t ct = dev->getCt();
        if (ct >= 330) {
            instance_->ambientCtrl_.setPreset(AmbientColorPreset::WARM_WHITE);
        } else if (ct <= 260) {
            instance_->ambientCtrl_.setPreset(AmbientColorPreset::COLD_WHITE);
        } else {
            instance_->ambientCtrl_.setPreset(AmbientColorPreset::NATURAL_WHITE);
        }
        return;
    }

    if (prop == EspalexaDeviceProperty::xy || prop == EspalexaDeviceProperty::hs ||
        mode == EspalexaColorMode::xy || mode == EspalexaColorMode::hs) {

        uint32_t rgb = dev->getRGB();
        uint8_t r = (rgb >> 16) & 0xFF;
        uint8_t g = (rgb >> 8)  & 0xFF;
        uint8_t b = rgb & 0xFF;

        bool isSyntheticWhite = (r > 190 && g > 190 && b > 190 && abs((int)r - (int)g) < 25 && abs((int)g - (int)b) < 25);
        if (isSyntheticWhite) {
            instance_->ambientCtrl_.setPreset(AmbientColorPreset::NATURAL_WHITE);
            return;
        }

        Effects::ColorRGBCCT digitalColor(r, g, b, 0, 0);
        Effects::ColorRGB analogColor(r, g, b);
        instance_->ambientCtrl_.setCustomColor(digitalColor, analogColor);
        return;
    }
}

static void fillWledInfo(JsonObject info) {
    info["ver"] = "0.14.0";
    info["vid"] = 2312080;
    info["name"] = "G7 Desk F1";
    info["udpport"] = 4210;
    info["live"] = (modeManager.getCurrentMode() == SystemMode::F1_MODE);
    info["lm"] = "";
    info["lip"] = "";
    info["ws"] = 0;
    info["fxcount"] = 2;
    info["palcount"] = 1;
    info["arch"] = "esp32";
    info["core"] = "v5.5";
    info["freeheap"] = ESP.getFreeHeap();
    info["uptime"] = millis() / 1000;
    info["opt"] = 127;
    info["brand"] = "WLED";
    info["product"] = "FOSS";
    info["mac"] = WiFi.macAddress();
    info["ip"] = WiFi.localIP().toString();

    JsonObject leds = info["leds"].to<JsonObject>();
    leds["count"] = 120;
    leds["pwr"] = 250;
    leds["fps"] = 50;
    leds["maxpwr"] = 850;
    leds["maxseg"] = 1;
    leds["seglock"] = false;
    leds["lc"] = 3;
    leds["rgbw"] = true;
    JsonArray pinArr = leds["pin"].to<JsonArray>();
    pinArr.add(18);
    pinArr.add(21);

    JsonObject wifi = info["wifi"].to<JsonObject>();
    wifi["bssid"] = WiFi.BSSIDstr();
    wifi["rssi"] = WiFi.RSSI();
    wifi["signal"] = 100;
    wifi["channel"] = WiFi.channel();
}

static void fillWledState(JsonObject state, AmbientModeController& ambientCtrl) {
    bool isOn = (ambientCtrl.getCurrentPreset() != AmbientColorPreset::OFF);
    state["on"] = isOn;
    state["bri"] = ambientCtrl.getBrightness();
    state["transition"] = 7;
    state["ps"] = (ambientCtrl.getCurrentPreset() == AmbientColorPreset::WARM_WHITE) ? 1 : 2;
    state["pl"] = -1;
    state["mainseg"] = 0;

    JsonArray segs = state["seg"].to<JsonArray>();
    JsonObject seg0 = segs.add<JsonObject>();
    seg0["id"] = 0;
    seg0["start"] = 0;
    seg0["stop"] = 120;
    seg0["len"] = 120;
    seg0["grp"] = 1;
    seg0["spc"] = 0;
    seg0["of"] = 0;
    seg0["on"] = isOn;
    seg0["frz"] = false;
    seg0["bri"] = 255;
    seg0["cct"] = (ambientCtrl.getCurrentPreset() == AmbientColorPreset::COLD_WHITE) ? 255 : 0;
    seg0["fx"] = (modeManager.getCurrentMode() == SystemMode::F1_MODE) ? 1 : 0;
    seg0["sx"] = 128;
    seg0["ix"] = 128;
    seg0["pal"] = 0;
    seg0["sel"] = true;
    seg0["rev"] = false;
    seg0["mi"] = false;

    JsonArray col = seg0["col"].to<JsonArray>();
    JsonArray c0 = col.add<JsonArray>();
    c0.add(255); c0.add(160); c0.add(0); c0.add(0);
    JsonArray c1 = col.add<JsonArray>();
    c1.add(0); c1.add(0); c1.add(0); c1.add(0);
    JsonArray c2 = col.add<JsonArray>();
    c2.add(0); c2.add(0); c2.add(0); c2.add(0);
}

void AmbientServer::setupWebRoutes() {
    server_.on("/", HTTP_GET, [this]() {
        handleRoot();
    });

    server_.on("/api/effect", HTTP_POST, [this]() {
        server_.sendHeader("Access-Control-Allow-Origin", "*");
        handleApiEffect();
    });

    server_.on("/api/brightness", HTTP_POST, [this]() {
        server_.sendHeader("Access-Control-Allow-Origin", "*");
        if (server_.hasArg("value")) {
            uint8_t val = server_.arg("value").toInt();
            ambientCtrl_.setBrightness(val);
            server_.send(200, "text/plain", "OK");
        } else {
            server_.send(400, "text/plain", "Missing value");
        }
    });

    server_.on("/api/preset", HTTP_POST, [this]() {
        server_.sendHeader("Access-Control-Allow-Origin", "*");
        String name = server_.arg("name");
        name.toLowerCase();

        f1Ctrl_.clearForcedEffect();

        if (name == "warm") ambientCtrl_.setPreset(AmbientColorPreset::WARM_WHITE);
        else if (name == "cold") ambientCtrl_.setPreset(AmbientColorPreset::COLD_WHITE);
        else if (name == "natural") ambientCtrl_.setPreset(AmbientColorPreset::NATURAL_WHITE);
        else if (name == "sunset") ambientCtrl_.setPreset(AmbientColorPreset::SUNSET_GOLD);
        else if (name == "cyan") ambientCtrl_.setPreset(AmbientColorPreset::CYAN_CHILL);
        else if (name == "purple") ambientCtrl_.setPreset(AmbientColorPreset::DEEP_PURPLE);
        else if (name == "off") ambientCtrl_.setPreset(AmbientColorPreset::OFF);

        modeManager.forceMode(SystemMode::AMBIENT_MODE);
        modeManager.releaseForcedMode();
        server_.send(200, "text/plain", "OK");
    });

    server_.on("/api/color", HTTP_POST, [this]() {
        server_.sendHeader("Access-Control-Allow-Origin", "*");
        if (server_.hasArg("r") && server_.hasArg("g") && server_.hasArg("b")) {
            uint8_t r = server_.arg("r").toInt();
            uint8_t g = server_.arg("g").toInt();
            uint8_t b = server_.arg("b").toInt();

            f1Ctrl_.clearForcedEffect();
            ambientCtrl_.setCustomColor(Effects::ColorRGBCCT(r, g, b, 0, 0), Effects::ColorRGB(r, g, b));
            modeManager.forceMode(SystemMode::AMBIENT_MODE);
            modeManager.releaseForcedMode();
            server_.send(200, "text/plain", "OK");
        } else {
            server_.send(400, "text/plain", "Missing RGB");
        }
    });

    server_.on("/api/mode", HTTP_POST, [this]() {
        server_.sendHeader("Access-Control-Allow-Origin", "*");
        String m = server_.arg("name");
        m.toLowerCase();
        if (m == "ambient") {
            f1Ctrl_.clearForcedEffect();
            modeManager.forceMode(SystemMode::AMBIENT_MODE);
            modeManager.releaseForcedMode();
        } else if (m == "f1") {
            f1Ctrl_.clearForcedEffect();
            modeManager.forceMode(SystemMode::F1_MODE);
            modeManager.releaseForcedMode();
        } else if (m == "demo") {
            f1Ctrl_.startDemo();
            modeManager.forceMode(SystemMode::F1_MODE);
        }
        server_.send(200, "text/plain", "OK");
    });

    server_.on("/api/f1-state", HTTP_POST, [this]() {
        server_.sendHeader("Access-Control-Allow-Origin", "*");
        if (server_.hasArg("plain")) {
            String body = server_.arg("plain");
            bool ok = Communication::f1UdpReceiver.processExternalPayload(body.c_str(), body.length());
            server_.send(ok ? 200 : 400, "application/json", ok ? "{\"ok\":true}" : "{\"ok\":false}");
        } else {
            server_.send(400, "application/json", "{\"ok\":false}");
        }
    });

    server_.on("/api/status", HTTP_GET, [this]() {
        server_.sendHeader("Access-Control-Allow-Origin", "*");
        handleApiStatus();
    });

    // Rotas de compatibilidade com WLED
    server_.on("/json/state", HTTP_ANY, [this]() {
        server_.sendHeader("Access-Control-Allow-Origin", "*");
        handleJsonState();
    });

    server_.on("/json/info", HTTP_GET, [this]() {
        server_.sendHeader("Access-Control-Allow-Origin", "*");
        JsonDocument doc;
        fillWledInfo(doc.to<JsonObject>());
        String out;
        serializeJson(doc, out);
        server_.send(200, "application/json", out);
    });

    server_.on("/json/si", HTTP_GET, [this]() {
        server_.sendHeader("Access-Control-Allow-Origin", "*");
        JsonDocument doc;
        fillWledState(doc["state"].to<JsonObject>(), ambientCtrl_);
        fillWledInfo(doc["info"].to<JsonObject>());
        String out;
        serializeJson(doc, out);
        server_.send(200, "application/json", out);
    });

    server_.on("/json/eff", HTTP_GET, [this]() {
        server_.sendHeader("Access-Control-Allow-Origin", "*");
        server_.send(200, "application/json", "[\"Solid\",\"F1 Telemetry Reactive\"]");
    });

    server_.on("/json/pal", HTTP_GET, [this]() {
        server_.sendHeader("Access-Control-Allow-Origin", "*");
        server_.send(200, "application/json", "[\"Default\"]");
    });

    server_.on("/json", HTTP_ANY, [this]() {
        server_.sendHeader("Access-Control-Allow-Origin", "*");
        if (server_.method() == HTTP_POST) {
            handleJsonState();
            return;
        }
        JsonDocument doc;
        fillWledState(doc["state"].to<JsonObject>(), ambientCtrl_);
        fillWledInfo(doc["info"].to<JsonObject>());
        JsonArray eff = doc["effects"].to<JsonArray>();
        eff.add("Solid");
        eff.add("F1 Telemetry Reactive");
        JsonArray pal = doc["palettes"].to<JsonArray>();
        pal.add("Default");
        String out;
        serializeJson(doc, out);
        server_.send(200, "application/json", out);
    });

    server_.on("/win", HTTP_GET, [this]() {
        server_.sendHeader("Access-Control-Allow-Origin", "*");
        if (server_.hasArg("A")) {
            ambientCtrl_.setBrightness(server_.arg("A").toInt());
        }
        if (server_.hasArg("T")) {
            int t = server_.arg("T").toInt();
            if (t == 0) ambientCtrl_.setPreset(AmbientColorPreset::OFF);
            else if (t == 1) ambientCtrl_.setPreset(AmbientColorPreset::WARM_WHITE);
        }
        server_.send(200, "text/Xml", "<?xml version=\"1.0\" ?><vs><ac>200</ac><ds>G7 Desk F1</ds></vs>");
    });

    server_.onNotFound([this]() {
        if (!espalexa_.handleAlexaApiCall(server_.uri(), server_.arg(0))) {
            server_.send(404, "text/plain", "Not Found");
        }
    });
}

void AmbientServer::handleRoot() {
    server_.send(200, "text/html", INDEX_HTML);
}

void AmbientServer::handleApiEffect() {
    String name = server_.arg("name");
    name.toLowerCase();

    if (name == "stop" || name == "ambient") {
        f1Ctrl_.clearForcedEffect();
        modeManager.forceMode(SystemMode::AMBIENT_MODE);
        modeManager.releaseForcedMode();
        server_.send(200, "application/json", "{\"ok\":true,\"effect\":\"AMBIENT\"}");
        return;
    }

    if (name == "demo") {
        f1Ctrl_.startDemo();
        modeManager.forceMode(SystemMode::F1_MODE);
        server_.send(200, "application/json", "{\"ok\":true,\"effect\":\"DEMO_SHOW\"}");
        return;
    }

    Effects::EffectId eff = Effects::EffectId::NONE;
    uint32_t durationMs = 0;

    if (name == "overtake" || name == "boost") eff = Effects::EffectId::OVERTAKE_BOOST;
    else if (name == "aero" || name == "speed" || name == "drs") eff = Effects::EffectId::ACTIVE_AERO_STRAIGHT;
    else if (name == "shiftflash" || name == "shift") eff = Effects::EffectId::SHIFT_FLASH;
    else if (name == "rain") eff = Effects::EffectId::WEATHER_RAIN;
    else if (name == "storm") eff = Effects::EffectId::WEATHER_STORM;
    else if (name == "safetycar" || name == "sc") eff = Effects::EffectId::SAFETY_CAR;
    else if (name == "vsc") eff = Effects::EffectId::VSC;
    else if (name == "yellow") eff = Effects::EffectId::FLAG_YELLOW;
    else if (name == "red") eff = Effects::EffectId::FLAG_RED;
    else if (name == "green") eff = Effects::EffectId::FLAG_GREEN_SURGE;
    else if (name == "pit" || name == "boxes") eff = Effects::EffectId::PIT_LANE;
    else if (name == "crash") {
        eff = Effects::EffectId::INCIDENT_CRASH;
        durationMs = Config::Firmware::CRASH_EFFECT_DURATION_MS; // Efeito momentâneo de 3.5s
    }
    else if (name == "engine") eff = Effects::EffectId::INCIDENT_ENGINE_BLOWN;
    else if (name == "victory" || name == "chequered") eff = Effects::EffectId::CHEQUERED_VICTORY;
    else if (name == "day" || name == "ambient_day") eff = Effects::EffectId::AMBIENT_DAY;
    else if (name == "night" || name == "ambient_night") eff = Effects::EffectId::AMBIENT_NIGHT;
    else if (name == "test" || name == "diagnostic") eff = Effects::EffectId::CUSTOM_TEST_PATTERN;

    if (eff != Effects::EffectId::NONE) {
        f1Ctrl_.triggerEffect(eff, durationMs);
        modeManager.forceMode(SystemMode::F1_MODE);
        server_.send(200, "application/json", "{\"ok\":true}");
    } else {
        server_.send(400, "application/json", "{\"ok\":false,\"error\":\"Unknown effect\"}");
    }
}

void AmbientServer::handleJsonState() {
    if (server_.method() == HTTP_POST) {
        if (server_.hasArg("plain")) {
            JsonDocument doc;
            deserializeJson(doc, server_.arg("plain"));

            if (!doc["on"].isNull()) {
                bool on = doc["on"];
                if (!on) ambientCtrl_.setPreset(AmbientColorPreset::OFF);
                else if (ambientCtrl_.getCurrentPreset() == AmbientColorPreset::OFF) {
                    ambientCtrl_.setPreset(AmbientColorPreset::WARM_WHITE);
                }
            }
            if (!doc["bri"].isNull()) {
                ambientCtrl_.setBrightness(doc["bri"]);
            }
            if (!doc["ps"].isNull()) {
                int ps = doc["ps"];
                if (ps == 1) ambientCtrl_.setPreset(AmbientColorPreset::WARM_WHITE);
                else if (ps == 2) ambientCtrl_.setPreset(AmbientColorPreset::COLD_WHITE);
                else if (ps == 3) ambientCtrl_.setPreset(AmbientColorPreset::SUNSET_GOLD);
            }
            if (!doc["seg"].isNull() && doc["seg"][0]["col"][0].is<JsonArray>()) {
                uint8_t r = doc["seg"][0]["col"][0][0];
                uint8_t g = doc["seg"][0]["col"][0][1];
                uint8_t b = doc["seg"][0]["col"][0][2];
                f1Ctrl_.clearForcedEffect();
                ambientCtrl_.setCustomColor(Effects::ColorRGBCCT(r, g, b, 0, 0), Effects::ColorRGB(r, g, b));
                modeManager.forceMode(SystemMode::AMBIENT_MODE);
                modeManager.releaseForcedMode();
            }
        }
    }

    JsonDocument res;
    fillWledState(res.to<JsonObject>(), ambientCtrl_);
    String out;
    serializeJson(res, out);
    server_.send(200, "application/json", out);
}

void AmbientServer::handleApiStatus() {
    JsonDocument doc;
    doc["mode"] = modeManager.getModeName();
    if (modeManager.getCurrentMode() == SystemMode::AMBIENT_MODE) {
        switch (ambientCtrl_.getCurrentPreset()) {
            case AmbientColorPreset::WARM_WHITE: doc["activeEffect"] = "Branco Quente (CCT)"; break;
            case AmbientColorPreset::COLD_WHITE: doc["activeEffect"] = "Branco Frio (CCT)"; break;
            case AmbientColorPreset::NATURAL_WHITE: doc["activeEffect"] = "Branco Neutro (CCT)"; break;
            case AmbientColorPreset::SUNSET_GOLD: doc["activeEffect"] = "Pôr do Sol Dourado"; break;
            case AmbientColorPreset::CYAN_CHILL: doc["activeEffect"] = "Ciano Chill"; break;
            case AmbientColorPreset::DEEP_PURPLE: doc["activeEffect"] = "Roxo Setup"; break;
            case AmbientColorPreset::OFF: doc["activeEffect"] = "Desligado"; break;
            default: doc["activeEffect"] = "Cor Personalizada"; break;
        }
    } else {
        doc["activeEffect"] = f1Ctrl_.getActiveEffectName();
    }
    doc["isDemo"] = f1Ctrl_.isDemoActive();
    doc["brightness"] = ambientCtrl_.getBrightness();
    doc["ip"] = WiFi.localIP().toString();
    doc["rssi"] = WiFi.RSSI();
    doc["f1Packets"] = Communication::f1UdpReceiver.getValidPackets();
    doc["heap"] = ESP.getFreeHeap();

    String out;
    serializeJson(doc, out);
    server_.send(200, "application/json", out);
}

} // namespace Modes
