# 🏎️ G7 Desk F1 Smart Lighting — Firmware ESP32

Firmware embarcado de alta fidelidade e performance desenvolvido para o setup de simulação **G7 Desk F1**, controlando fitas de LED inteligentes integradas ao ecossistema convencional de iluminação ambiente e à telemetria em tempo real do aplicativo **F1 Dash**.

---

## 1. Visão Geral da Arquitetura

O sistema implementa dois modos de operação mutuamente exclusivos, com proteção contra concorrência e renderização a **50 FPS** local no ESP32:

1. **AMBIENT MODE**: Iluminação inteligente para o setup (Branco Quente CCT, Branco Frio CCT, pôr do sol, ciano e cores sólidas) com respiração suave e suporte à automação e Alexa.
2. **F1 GAME MODE**: Iluminação imersiva e reativa à corrida de Fórmula 1, controlada pelo estado semântico recebido via **UDP (Porta 4210)** do aplicativo F1-Dash.

```
                    ┌───────────────────────────────┐
                    │     App F1-Dash (PS5 / PC)    │
                    └───────────────┬───────────────┘
                                    │ Datagramas UDP (Porta 4210 / 5 Hz)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FIRMWARE ESP32 (G7 DESK)                        │
│                                                                        │
│   ┌─────────────────────┐            ┌─────────────────────────────┐   │
│   │   F1UdpReceiver     │ ─────────► │    PayloadParser (JSON)     │   │
│   └─────────────────────┘            └──────────────┬──────────────┘   │
│                                                     │                  │
│                                                     ▼                  │
│   ┌─────────────────────┐            ┌─────────────────────────────┐   │
│   │     ModeManager     │ ◄───────── │   RaceState & EventManager  │   │
│   └──────────┬──────────┘            └──────────────┬──────────────┘   │
│              │                                      │                  │
│              ├──────────────────────┬───────────────┘                  │
│              ▼                      ▼                                  │
│   ┌─────────────────────┐ ┌────────────────────────────────────────┐   │
│   │ AmbientMode (Lenta) │ │   EffectEngine (50 FPS Não Bloqueante) │   │
│   └──────────┬──────────┘ └─────────────────┬──────────────────────┘   │
│              │                              │                          │
│              └──────────────┬───────────────┘                          │
│                             ▼                                          │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │             MasterLedController (Interface Unificada)          │   │
│   └───────────────┬─────────────────┬──────────────────┬───────────┘   │
└───────────────────┼─────────────────┼──────────────────┼───────────────┘
                    │                 │                  │
                    ▼                 ▼                  ▼
          ┌──────────────────┐ ┌──────────────┐ ┌────────────────┐
          │  WS2805 Esquerda │ │ WS2805 Direita│ │ RGB Analógica  │
          │  (GPIO 18 / 24V) │ │(GPIO 21 / 24V)│ │(GPIO 32,27,26) │
          └──────────────────┘ └──────────────┘ └────────────────┘
```

---

## 2. Mapeamento de Pinos e Hardware

### 2.1 Fita RGB Analógica 12 V (Acionamento por MOSFET)
- **GPIO 32**: Canal Vermelho (R)
- **GPIO 27**: Canal Verde (G)
- **GPIO 26**: Canal Azul (B)
- **Driver**: Hardware PWM (módulo ESP32 LEDC, 5 kHz, resolução de 8 bits, curva de calibração gama 2.2).

### 2.2 Fitas WS2805 RGB+CCT 24 V (5 Canais por Pixel)
- **GPIO 18**: DATA Fita Esquerda do Monitor (via buffer level shifter 74AHCT125)
- **GPIO 21**: DATA Fita Direita do Monitor (via buffer level shifter 74AHCT125)
- **Driver**: Makuna NeoPixelBus com métodos independentes de hardware RMT (`NeoEsp32Rmt0Ws2805Method` e `NeoEsp32Rmt1Ws2805Method`).
- **Aterramento do pino BIN**: Conectar `BIN` ao `GND` no conector do primeiro pixel de cada fita para operação sem falhas.

---

## 3. Estrutura Modular do Código

```text
c:\Projetos\ESP32-FW/
├── platformio.ini                    <- Configurações do ESP32 Dev Module
├── src/
│   ├── main.cpp                     <- Orquestrador principal não bloqueante (50 FPS)
│   ├── config/
│   │   ├── pins.h                   <- Mapeamento centralizado de GPIOs (32, 27, 26, 18, 21)
│   │   ├── network_config.h         <- Wi-Fi e porta UDP 4210
│   │   └── firmware_config.h        <- Parâmetros de timing, limites e FPS
│   ├── communication/
│   │   ├── f1_udp_receiver.h/.cpp   <- Socket UDP não bloqueante
│   │   └── payload_parser.h/.cpp    <- Parser JSON tolerante a falhas (ArduinoJson v7)
│   ├── state/
│   │   ├── race_state.h/.cpp        <- Armazenamento atômico do último estado de corrida
│   │   └── event_manager.h/.cpp     <- Detecção de bordas, timers e hierarquia de prioridades
│   ├── effects/
│   │   ├── effect_types.h           <- Tipos de cor ColorRGBCCT, ColorRGB e EffectId
│   │   └── effect_engine.h/.cpp     <- Motor de 12 animações procedurais F1 e ambiente
│   ├── leds/
│   │   ├── led_controller.h/.cpp    <- Abstração ILedController e MasterLedController
│   │   ├── ws2805_controller.h/.cpp <- Driver RMT para fitas esquerda e direita
│   │   └── rgb_pwm_controller.h/.cpp<- Driver LEDC PWM com correção gama
│   ├── modes/
│   │   ├── mode_manager.h/.cpp      <- Máquina de estados (BOOT, AMBIENT, F1_MODE, F1_DISCONNECTED)
│   │   ├── ambient_mode.h/.cpp      <- Modo convencional (Branco quente/frio, presets)
│   │   └── f1_mode.h/.cpp           <- Coordenador de telemetria e renderização F1
│   ├── diagnostics/
│   │   └── diagnostics.h/.cpp       <- Monitor serial de saúde, heap e métricas de pacotes
│   └── wled/
│       └── usermod_f1_lighting.h    <- Adaptador oficial para compilar como WLED Usermod v2
├── test/
│   └── test_payload_validation.js   <- Suíte de testes automatizados do contrato
└── tools/
    └── f1_telemetry_simulator.js    <- Injetor de telemetria UDP para testes de bancada
```

---

## 4. Hierarquia Estrita de Prioridades dos Eventos

O `EventManager` avalia o estado de telemetria a cada quadro respeitando rigorosamente a seguinte precedência:

1. **`INCIDENT_CRASH`** (Nível Crítico): Flash estroboscópico de impacto branco/vermelho ativo por **3,5 segundos**.
2. **`FLAG_RED` / `INCIDENT_ENGINE_BLOWN`** (Nível de Emergência): Pisca de alerta vermelho a 2.5 Hz ou pulsação lenta de motor quebrado.
3. **`SAFETY_CAR` / `VSC` / `FLAG_YELLOW`** (Nível de Pista): Pulsação amarela cadenciada distinta da dos boxes.
4. **`FLAG_GREEN_SURGE`** (Transição de Relargada): Pulso verde de aceleração por **2,0 segundos** ao retornar para pista limpa.
5. **`PIT_LANE`** (Boxes): Alternância ritmada de blocos âmbar e magenta.
6. **`OVERTAKE_BOOST`** (Potência): Fluxo elétrico azul acelerado propagando do centro para as extremidades.
7. **`ACTIVE_AERO_STRAIGHT`** (Velocidade): Ondas roxas velozes no X-Mode / DRS moduladas pelo RPM.
8. **`CHEQUERED_VICTORY`** (Fim de Prova): Animação comemorativa quadriculada.
9. **`WEATHER_RAIN` / `WEATHER_STORM`** (Clima): Gotas procedurais caindo pelas fitas laterais com cauda e relâmpagos.
10. **`AMBIENT_DAY` / `AMBIENT_NIGHT`** (Base): Iluminação suave nos canais dedicados CCT.
11. **`SHIFT_FLASH`**: Overlay de alta prioridade nos pixels periféricos superiores no ponto ótimo de troca de marcha.

---

## 5. Como Compilar e Gravar no ESP32

Com o cabo USB conectado ao ESP32:

```bash
# 1. Compilar o projeto
pio run

# 2. Gravar o binário no ESP32
pio run -t upload

# 3. Abrir o monitor serial (115200 baud)
pio device monitor
```

---

## 6. Testes Automatizados e Simulador de Bancada

### 6.1 Executar a Suíte de Testes Unitários
```bash
node test/test_payload_validation.js
```

### 6.2 Injetar Telemetria Simulada na Rede Local
Sem precisar ligar o videogame, envie cenários reais para o ESP32:

```bash
# Enviar chuva dinâmica para o ESP32
node tools/f1_telemetry_simulator.js 192.168.1.150 rain

# Enviar ultrapassagem (overtake azul)
node tools/f1_telemetry_simulator.js 192.168.1.150 overtake

# Enviar Safety Car (amarelo pulsante)
node tools/f1_telemetry_simulator.js 192.168.1.150 safetycar

# Enviar batida violenta (crash test)
node tools/f1_telemetry_simulator.js 192.168.1.150 crash
```
