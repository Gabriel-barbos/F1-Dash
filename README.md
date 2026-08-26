# F1 Telemetry Dashboard (F1 25 - PS5 / Windows PoC & Web Dashboard)

Proof of Concept (PoC) para recepção, decodificação e visualização em tempo real da telemetria UDP enviada pelo **F1 25 no PlayStation 5** (ou simulador local), com suporte a **60Hz** e **Dashboard Web no Navegador**.

---

## 🏎️ Como Executar

### 1. Iniciar o Receptor UDP + Servidor Web

```powershell
npm run dev
```

O receptor iniciará na porta UDP `20777` e abrirá o servidor Web na porta `3000`.

---

### 2. Acessar o Dashboard Visual no Navegador

Abra no seu navegador (Google Chrome, Edge, Firefox, celular ou tablet no mesmo Wi-Fi):

* No computador: **[http://localhost:3000](http://localhost:3000)**
* No celular ou tablet (conectado no mesmo Wi-Fi): **`http://<IP_DO_PC>:3000`** *(o IP exato aparece no terminal ao iniciar)*

---

### 3. Teste 1: Usando o Simulador Mock Local (60Hz)

Abra um **segundo terminal** na mesma pasta e execute:

```powershell
npm run mock
```

O simulador enviará pacotes a **60Hz**. No navegador, você verá o painel estilo volante de F1 atualizando instantaneamente com:
- LEDs de troca de marcha (Shift Lights)
- Velocímetro e indicador gigante de marcha
- Acelerador e freio com animação ultra fluida
- Status de DRS
- Temperaturas e pressões dos 4 pneus (FL, FR, RL, RR) e freios

---

### 4. Teste 2: Conectando com o F1 25 Real no PS5 (60Hz)

1. Certifique-se de que o **PC e o PS5 estão na mesma rede local**.
2. Inicie `npm run dev` no PC e abra `http://localhost:3000`.
3. No **PS5**, dentro do **F1 25**:
   - Vá em **Opções de Jogo / Configurações** > **Configurações de Telemetria**.
   - **Telemetria UDP**: `Ligado` (On).
   - **Formato UDP**: `2024` ou `2025`.
   - **Endereço IP UDP**: Insira o IP do seu PC mostrado no terminal.
   - **Porta UDP**: `20777`.
   - **Frequência de envio de telemetria**: `60Hz`.
4. Entre na pista e pilote! O dashboard web no navegador exibirá os dados em tempo real a 60 FPS com latência mínima.

---

## 🧪 Testes Automatizados

```powershell
npm test
```
