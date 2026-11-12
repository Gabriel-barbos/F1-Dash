# 📚 Documentação Técnica de Engenharia: F1 Telemetry Ecosystem

Este documento consolida a especificação técnica completa, decisões arquiteturais, modelos matemáticos e detalhes de implementação do ecossistema de telemetria automotiva para **EA SPORTS™ F1® (F1 25 / F1 26)**.

---

# Sumário
1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Protocolo de Telemetria F1 (Codemasters/EA Sports)](#2-protocolo-de-telemetria-f1-codemastersea-sports)
3. [Pilar 1: Aplicativo Mobile (React Native + Kotlin Nativo)](#3-pilar-1-aplicativo-mobile-react-native--kotlin-nativo)
4. [Pilar 2: Claudinho Ronaldo (Engenheiro de Corrida IA)](#4-pilar-2-claudinho-ronaldo-engenheiro-de-corrida-ia)
5. [Pilar 3: Firmware e Hardware ESP32 (G7 Desk F1)](#5-pilar-3-firmware-e-hardware-esp32-g7-desk-f1)
6. [Engenharia de Redes & Análise de Latência (L2/L3)](#6-engenharia-de-redes--análise-de-latência-l2l3)

---

# 1. Visão Geral da Arquitetura

O sistema opera com uma topologia local **Zero-Cloud**, onde todo o processamento de telemetria e controle de atuadores ocorre dentro da rede local (LAN).

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                REDE LOCAL (LAN)                                  │
│                                                                                  │
│  ┌──────────────────────┐          UDP Unicast          ┌─────────────────────┐  │
│  │   PlayStation 5      │ ─────────────────────────────►│    Samsung A54      │  │
│  │   F1 25 (60 Hz)      │      Porta 20777 (5 GHz)      │  React Native / KTL │  │
│  │   192.168.1.109      │                               │    192.168.1.xxx    │  │
│  └──────────────────────┘                               └──────────┬──────────┘  │
│                                                                    │             │
│                                                          UDP State │             │
│                                                          Port 4210 │             │
│                                                                    ▼             │
│  ┌──────────────────────┐                               ┌─────────────────────┐  │
│  │  Fitas LED Bancada   │◄─────── RMT Channels 0 & 1 ───│     ESP32 DevKit    │  │
│  │  WS2805 24V RGBCCT   │         Pulsos de 800 kHz     │     FreeRTOS / C++  │  │
│  │  + Fita Analógica 12V│                               │    192.168.1.103    │  │
│  └──────────────────────┘                               └─────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

# 2. Protocolo de Telemetria F1 (Codemasters/EA Sports)

O simulador F1 25 / F1 26 transmite pacotes binários compactados utilizando alinhamento de 1 byte (estruturas *packed*) em ordem de bytes **Little-Endian**.

### 2.1 Cabeçalho Universal de Pacotes (29 Bytes)
Todos os pacotes recebidos na porta UDP `20777` compartilham o mesmo cabeçalho:

| Offset | Tipo | Campo | Descrição |
| :--- | :--- | :--- | :--- |
| `0` | `uint16` | `m_packetFormat` | Ano do formato (2025 ou 2026) |
| `2` | `uint8` | `m_gameYear` | Ano do jogo (25) |
| `3` | `uint8` | `m_gameMajorVersion` | Versão maior do jogo |
| `4` | `uint8` | `m_gameMinorVersion` | Versão menor do jogo |
| `5` | `uint8` | `m_packetVersion` | Versão do pacote |
| `6` | `uint8` | `m_packetId` | Identificador do tipo de dados |
| `7` | `uint64` | `m_sessionUID` | Identificador único da sessão |
| `15` | `float` | `m_sessionTime` | Timestamp da sessão em segundos |
| `19` | `uint32` | `m_frameIdentifier` | Número do quadro renderizado |
| `23` | `uint32` | `m_overallFrameIdentifier` | Contador global de quadros |
| `27` | `uint8` | `m_playerCarIndex` | Índice do carro do jogador (0..21) |
| `28` | `uint8` | `m_secondaryPlayerCarIndex`| Índice do segundo jogador |

### 2.2 Principais IDs de Pacotes Utilizados

```
PacketId  0: Motion               (Física, aceleração G, pitch, roll, yaw)
PacketId  1: Session              (Bandeiras FIA, clima, tempo restante, Safety Car)
PacketId  2: LapData              (Tempos de volta, setores, posições, status de boxes)
PacketId  3: Event                (Eventos instantâneos: batidas, ultrapassagens, voltas mais rápidas)
PacketId  6: CarTelemetry         (Velocidade km/h, RPM, marcha, acelerador, freio, DRS, temp pneus)
PacketId  7: CarStatus            (Combustível, ERS, Active Aero X-Mode/Z-Mode, danos de motor)
PacketId 10: CarDamage            (Desgaste e danos estruturais de componentes percentuais)
PacketId 16: Overtake             (Estado regulamentar do modo ultrapassagem F1 2026)
```

---

# 3. Pilar 1: Aplicativo Mobile (React Native + Kotlin Nativo)

### 3.1 Ingestão de Rede em Kotlin Nativo (`ExpoUdpModule.kt`)
Em dispositivos Android, pontes puras de JavaScript para rede sofrem de *JNI Marshaling overhead* quando submetidas a rajadas de 180 a 360 pacotes/s.
- Implementamos um módulo nativo em Kotlin que abre um `DatagramSocket` vinculado à porta local `20777`.
- O pacote é recebido diretamente na memória nativa e entregue via evento de ponte otimizado para o `@f1-dash/telemetry-core`.

### 3.2 Parsing Binário com `DataView` (`packages/telemetry-core`)
O normalizador utiliza `DataView` sobre um buffer compartilhado para extrair valores com precisão de byte sem gerar cópias de strings ou alocações temporárias no Garbage Collector:
```typescript
const view = new DataView(arrayBuffer);
const packetFormat = view.getUint16(0, true);
const packetId = view.getUint8(6);
const playerIdx = view.getUint8(27);
```

### 3.3 Suporte Multi-Regulamento: F1 2025 vs F1 2026
- **F1 2025:** Mapeamento de `drs` (0 ou 1) e `ersDeployMode` (0 a 3).
- **F1 2026 (Active Aero & Overtake Boost):**
  - O regulamento de 2026 introduz a aerodinâmica ativa (*X-Mode* para retas de alta velocidade e *Z-Mode* para curvas de alta pressão aerodinâmica).
  - O *Overtake Boost* em 2026 é desassociado do botão de ERS antigo: ele é regulado pelo delta de perseguição de menos de 1 segundo para o carro à frente. O normalizador monitora ambos os campos de forma isolada.

### 3.4 Motor Gráfico Reativo (60 FPS)
- **Car Damage Heatmap:** Mapeamento dinâmico em vetor SVG. Os componentes do chassi (Asa Dianteira Esquerda/Direita, Assoalho, Sidepods, Difusor, Motor e Caixa de Câmbio) recebem classes de cores baseadas no percentual de dano:
  - $0\%$: Verde Escuro (Estrutura íntegra)
  - $1\% \dots 20\%$: Amarelo suave
  - $21\% \dots 49\%$: Âmbar / Laranja
  - $\ge 50\%$: Vermelho Alerta
- **RevLights:** 15 LEDs estilizados divididos em Verde (5), Vermelho (5) e Roxo (5), acendendo progressivamente conforme o percentual de RPM da marcha atual, com flash estroboscópico de corte de giro (*Shift Flash*).

---

# 4. Pilar 2: Claudinho Ronaldo (Engenheiro de Corrida IA)

### 4.1 Heurística de Detecção de Eventos (`race-engineer-detector.ts`)
O listener avalia deltas e limites críticos a cada ciclo de telemetria:
- **Degradação de Pneus:** $\Delta \text{desgaste} > 5\%$ em uma única volta ou desgaste absoluto $> 65\%$.
- **Perda de Ritmo:** Queda de delta $> 1.5\text{s}$ no setor em relação à melhor volta pessoal.
- **Entrada em Zona de Ataque:** Delta para o carro à frente menor que $1.0\text{s}$.
- **Incidentes:** Danos súbitos em asas ou detecção de colisão via pacote de eventos.

### 4.2 Máquina de Estados com Histerese e Cooldown
Para evitar interrupções excessivas durante a pilotagem, o serviço aplica janelas de cooldown configuráveis por tipo de evento:
- Alertas de danos graves: Cooldown de $45\text{s}$.
- Informações de gap/ritmo: Cooldown de $120\text{s}$.
- Alertas de bandeiras (Safety Car / Vermelha): Prioridade de interrupção instantânea (preempção da fila).

### 4.3 Pipeline Acústico de Rádio F1 (DSP)
Para reproduzir fielmente a acústica do rádio de equipe da Fórmula 1:
1. **Chime de Abertura:** Disparo imediato do tom sonoro oficial de abertura de canal (`radio_beep.mp3`).
2. **Equalização Passa-Banda (Bandpass 300 Hz – 3.000 Hz):** Filtro de telecomunicações que atenua graves profundos e agudos cristalinos, simulando o microfone do capacete.
3. **Envelope Visual de Amplitude:** Cálculo do envelope de volume a cada $40\text{ms}$ para alimentar as barras animadas no banner de Team Radio da interface.

---

# 5. Pilar 3: Firmware e Hardware ESP32 (G7 Desk F1)

### 5.1 Eletrônica de Potência e Distribuição
- **Barramento 24V DC:** Alimenta as fitas digitais WS2805 RGBCCT de alta potência (60 pixels/m), garantindo baixa corrente e sem queda de tensão (*voltage drop*).
- **Barramento 12V DC:** Alimenta fita analógica RGB via canais MOSFET acionados por PWM a 1 kHz.
- **Slew-Rate Control:** Configuração de corrente de saída nos pinos de dados dos LEDs (`gpio_set_drive_capability` em `GPIO_DRIVE_CAP_1`) para suprimir reflexões de alta frequência nas linhas de transmissão.

### 5.2 Controle RMT por Hardware (WS2805 RGBCCT)
O circuito integrado WS2805 exige pacotes de 40 bits por pixel (8 bits R, 8 bits G, 8 bits B, 8 bits Warm White, 8 bits Cold White).
- O firmware utiliza os módulos periféricos **RMT0 e RMT1** do ESP32 via biblioteca `NeoPixelBus`.
- Os pulsos de sub-microssegundo são modulados diretamente por DMA de hardware sem consumir ciclos de instrução do processador.

### 5.3 Smart Cross-Fade por Interpolação de Buffer
Para eliminar cortes secos ao sair de modos esportivos (ex: Modo Reta para Branco Quente), o `EffectEngine` armazena um snapshot do quadro anterior e calcula cada canal físico com a curva *Smoothstep* cúbica:
$$\text{progress} = \frac{now - start}{duration}$$
$$t = \text{progress}^2 \cdot (3 - 2 \cdot \text{progress})$$
$$\text{corFinal} = \text{ColorRGBCCT::lerp}(\text{snapshot}, \text{target}, t)$$

| Transição | Duração | Comportamento Visual |
| :--- | :--- | :--- |
| **Saída para Iluminação Ambiente** | `380 ms` | Dissolve orgânico suave até o Branco Quente |
| **Entrada em Modo Reta / Overtake** | `120 ms` | Resposta rápida e tátil de aceleração |
| **Overtake ➔ Boxes** | `250 ms` | Fusão suave entre tons azuis e luzes de pit lane |
| **Batida / Bandeira Vermelha** | `0 ms` | Corte imediato de impacto e emergência |

### 5.4 Integração Alexa e Servidor Web Local
- **Espalexa (SSDP/UPnP):** O ESP32 emula localmente lâmpadas Philips Hue na rede local, permitindo comandos diretos da Alexa ("Alexa, ligar iluminação da bancada") sem necessidade de skills na nuvem.
- **Web Server HTTP (PROGMEM):** Interface de usuário com dark mode embarcada na memória flash para controle de brilho, testes de bancada e diagnóstico em tempo real.

---

# 6. Engenharia de Redes & Análise de Latência (L2/L3)

### 6.1 A Descoberta da Tempestade de Broadcast L2
Durante os testes de integração com o PS5 conectado via cabo Ethernet, identificou-se uma latência inesperada de 1 a 4 segundos na iluminação do ESP32.

#### Mecânica do Problema
1. O PS5 transmitia telemetria a 60 Hz utilizando endereço de broadcast (`192.168.1.255:20777`).
2. O switch interno do roteador residencial é obrigado a replicar todo quadro com endereço MAC `FF:FF:FF:FF:FF:FF` para **todas as interfaces físicas**, incluindo o rádio Wi-Fi 2.4 GHz onde o ESP32 operava.
3. Pela norma IEEE 802.11, quadros de Broadcast não podem usar modulações de alta velocidade (como MCS7 a 72 Mbps); eles são **obrigados a trafegar na taxa básica de 1 Mbps**.
4. 180 pacotes/s de ~1.350 bytes geravam cerca de 2 Mbps de demanda bruta no ar a 1 Mbps, consumindo 100% do *airtime* da antena 2.4 GHz e lotando o buffer do rádio do ESP32.

#### Prova Empírica Medida no ESP32 (`192.168.1.103`)

| Cenário de Rede | Tráfego na Porta `20777` | Pacotes Entregues ao ESP32 | Latência Média | Perda de Pacotes |
| :--- | :--- | :--- | :--- | :--- |
| **Repouso (Sem corrida)** | `0 pkts/s` | $3 / 3$ | **69,0 ms** | **0%** |
| **UDP Broadcast (60 Hz)** | $180\text{ pkts/s}$ para `.255` | $1 / 4$ | **> 3.000 ms (Timeout)** | **75% de perda** |
| **UDP Unicast (60 Hz)** | $180\text{ pkts/s}$ direto para o IP do A54 | $4 / 4$ | **62,2 ms** | **0%** |

### 6.2 Solução Definitiva
Configuração do jogo em **Unicast Estrito** apontando para o IP do smartphone na banda de 5 GHz. O tráfego pesado viaja exclusivamente pelo cabo $\to$ 5 GHz (a centenas de Mbps), deixando o espectro de 2.4 GHz 100% limpo e garantindo tempo real estrito para o ESP32.
