// Gerado automaticamente com os áudios oficiais do Claudinho Ronaldo
export interface ClaudinhoClip {
  id: string;
  scenario: string;
  text: string;
  asset: any;
  durationMs: number;
  envelope: number[];
}

export const CLAUDINHO_AUDIO_ASSETS: Record<string, any> = {
  "damage_1.wav": require('../../assets/engineer/audio/damage_1.wav'),
  "damage_2.wav": require('../../assets/engineer/audio/damage_2.wav'),
  "damage_3.wav": require('../../assets/engineer/audio/damage_3.wav'),
  "overtake_1.wav": require('../../assets/engineer/audio/overtake_1.wav'),
  "overtake_2.wav": require('../../assets/engineer/audio/overtake_2.wav'),
  "overtake_3.wav": require('../../assets/engineer/audio/overtake_3.wav'),
  "pos_lost_1.wav": require('../../assets/engineer/audio/pos_lost_1.wav'),
  "pos_lost_2.wav": require('../../assets/engineer/audio/pos_lost_2.wav'),
  "gap_behind_1.wav": require('../../assets/engineer/audio/gap_behind_1.wav'),
  "gap_behind_2.wav": require('../../assets/engineer/audio/gap_behind_2.wav'),
  "gap_behind_3.wav": require('../../assets/engineer/audio/gap_behind_3.wav'),
  "gap_front_1.wav": require('../../assets/engineer/audio/gap_front_1.wav'),
  "gap_front_2.wav": require('../../assets/engineer/audio/gap_front_2.wav'),
  "gap_front_3.wav": require('../../assets/engineer/audio/gap_front_3.wav'),
  "safety_car_1.wav": require('../../assets/engineer/audio/safety_car_1.wav'),
  "safety_car_2.wav": require('../../assets/engineer/audio/safety_car_2.wav'),
  "vsc_1.wav": require('../../assets/engineer/audio/vsc_1.wav'),
  "vsc_2.wav": require('../../assets/engineer/audio/vsc_2.wav'),
  "red_flag_1.wav": require('../../assets/engineer/audio/red_flag_1.wav'),
  "red_flag_2.wav": require('../../assets/engineer/audio/red_flag_2.wav'),
  "pit_lane_1.wav": require('../../assets/engineer/audio/pit_lane_1.wav'),
  "pit_lane_2.wav": require('../../assets/engineer/audio/pit_lane_2.wav'),
  "fastest_lap_1.wav": require('../../assets/engineer/audio/fastest_lap_1.wav'),
  "fastest_lap_2.wav": require('../../assets/engineer/audio/fastest_lap_2.wav'),
  "tyre_wear_1.wav": require('../../assets/engineer/audio/tyre_wear_1.wav'),
  "tyre_wear_2.wav": require('../../assets/engineer/audio/tyre_wear_2.wav'),
  "calm_1.wav": require('../../assets/engineer/audio/calm_1.wav'),
};

export const CLAUDINHO_CLIPS: ClaudinhoClip[] = [
  {
    id: "damage_1",
    scenario: "DAMAGE",
    text: "Puta que pariu, bateu onde?! Segura esse carro na pista, porra!",
    asset: CLAUDINHO_AUDIO_ASSETS["damage_1.wav"],
    durationMs: 4870,
    envelope: [0.101,0.043,0.043,0.043,0.183,0.188,0.877,0.086,0.332,0.361,0.963,0.264,0.359,0.71,0.184,0.122,0.491,0.291,0.676,0.474,0.337,0.498,0.347,0.177,0.056,0.053,0.061,0.048,0.094,0.218,0.067,0.12,0.391,0.617,0.347,0.121,0.049,0.318,0.935,0.465,0.594,0.373,0.074,0.239,0.47,0.147,0.756,0.09,0.21,0.647,0.678,0.663,0.531,0.071,0.052,0.053,0.044,0.044,0.175,0.023,0.04]
  },
  {
    id: "damage_2",
    scenario: "DAMAGE",
    text: "Cuidado com a asa dianteira, caralho! Me avisa se o volante tá torto!",
    asset: CLAUDINHO_AUDIO_ASSETS["damage_2.wav"],
    durationMs: 3710,
    envelope: [0.096,0.043,0.62,0.337,0.818,0.453,0.721,0.853,0.603,0.395,0.629,0.082,0.642,0.746,0.301,0.746,0.867,0.831,0.317,0.266,0.053,0.085,0.081,0.042,0.748,0.194,0.372,0.77,0.257,0.689,0.759,0.694,0.248,0.853,0.094,0.732,0.892,0.086,0.404,0.292,0.059,0.046,0.045,0.031,0.045,0.11,0.007]
  },
  {
    id: "damage_3",
    scenario: "DAMAGE",
    text: "Merda, danificou o carro! Não arrisca agora, traz ele inteiro!",
    asset: CLAUDINHO_AUDIO_ASSETS["damage_3.wav"],
    durationMs: 4070,
    envelope: [0.092,0.039,0.04,0.039,0.193,0.641,0.662,0.107,0.546,0.671,0.217,0.271,0.352,0.367,0.578,0.129,0.675,0.982,0.958,0.199,0.178,0.074,0.044,0.192,0.614,0.769,0.448,0.164,0.838,0.328,0.87,0.924,0.761,0.689,0.073,0.052,0.528,0.766,0.236,0.256,0.239,0.455,0.703,0.566,0.199,0.059,0.045,0.042,0.168,0.02,0.036]
  },
  {
    id: "overtake_1",
    scenario: "OVERTAKE",
    text: "CARALHO, QUE PASSADA! É disso que eu tô falando, Gabriel, porra!",
    asset: CLAUDINHO_AUDIO_ASSETS["overtake_1.wav"],
    durationMs: 5270,
    envelope: [0.092,0.039,0.04,0.041,0.726,0.359,0.239,0.098,0.487,0.75,0.81,0.555,0.197,0.398,0.057,0.166,0.042,0.535,0.749,0.095,0.075,0.061,0.898,1,0.687,0.094,0.807,0.542,0.133,0.225,0.239,0.218,0.223,0.095,0.386,0.065,0.061,0.044,0.314,0.422,0.102,0.422,0.588,0.199,0.191,0.699,0.645,0.615,0.575,0.353,0.616,0.294,0.383,0.387,0.087,0.205,0.212,0.198,0.185,0.117,0.041,0.041,0.04,0.171,0.023,0.037]
  },
  {
    id: "overtake_2",
    scenario: "OVERTAKE",
    text: "Moleque doido, passou voando! Mantém essa porra de ritmo!",
    asset: CLAUDINHO_AUDIO_ASSETS["overtake_2.wav"],
    durationMs: 6110,
    envelope: [0.125,0.053,0.054,0.053,0.207,0.385,0.447,0.438,0.652,0.961,0.929,0.826,0.095,0.129,0.117,0.133,0.063,0.065,0.542,0.819,0.704,0.857,0.984,0.327,0.095,0.344,0.494,0.412,0.068,0.833,0.233,0.159,0.877,0.191,0.18,0.615,0.844,0.979,0.82,0.924,0.593,0.64,0.506,0.083,0.152,0.11,0.075,0.058,0.249,0.233,0.075,0.288,0.214,0.448,0.12,0.671,0.076,0.063,0.648,0.536,0.698,0.148,0.447,0.284,0.278,0.088,0.787,0.178,0.134,0.059,0.055,0.053,0.056,0.04,0.056,0.136,0.007]
  },
  {
    id: "overtake_3",
    scenario: "OVERTAKE",
    text: "Boa, Gabriel! O cara nem viu a cor do carro, caralho!",
    asset: CLAUDINHO_AUDIO_ASSETS["overtake_3.wav"],
    durationMs: 5110,
    envelope: [0.092,0.039,0.039,0.04,0.053,0.5,0.459,0.6,0.679,0.596,0.872,0.629,0.395,0.779,0.359,0.237,0.367,0.497,0.65,0.765,0.763,0.439,0.269,0.172,0.056,0.573,0.557,0.129,0.216,0.182,0.1,0.123,0.467,0.317,0.111,0.447,0.095,0.241,0.049,0.044,0.577,0.803,0.956,0.889,0.495,0.256,0.434,0.874,0.574,0.959,0.93,0.599,0.11,0.174,0.103,0.058,0.039,0.039,0.039,0.039,0.038,0.163,0.022,0.037]
  },
  {
    id: "pos_lost_1",
    scenario: "POSITION_LOST",
    text: "Puta que pariu, tomou passada! Foco na retomada, Gabriel, vai pra cima!",
    asset: CLAUDINHO_AUDIO_ASSETS["pos_lost_1.wav"],
    durationMs: 5950,
    envelope: [0.093,0.042,0.04,0.039,0.073,0.462,0.152,0.051,0.045,0.744,0.111,0.152,0.364,0.054,0.467,0.842,0.431,0.191,0.463,0.255,0.114,0.046,0.82,0.314,0.844,0.082,0.795,0.294,0.084,0.199,0.798,0.872,0.551,0.26,0.586,0.081,0.144,0.102,0.074,0.077,0.96,0.226,0.563,0.745,0.717,0.625,0.318,0.59,0.534,0.955,1,0.59,0.162,0.595,0.266,0.609,0.737,0.138,0.775,0.376,0.773,0.096,0.11,0.338,0.326,0.537,0.555,0.108,0.049,0.043,0.04,0.03,0.042,0.114,0.006]
  },
  {
    id: "pos_lost_2",
    scenario: "POSITION_LOST",
    text: "Perdeu posição, caralho! Não deixa ele abrir, cola na asa dele!",
    asset: CLAUDINHO_AUDIO_ASSETS["pos_lost_2.wav"],
    durationMs: 4761,
    envelope: [0.098,0.042,0.042,0.041,0.379,0.595,0.105,0.622,0.081,0.496,0.188,0.33,0.088,0.094,0.787,0.822,0.363,0.159,0.673,0.83,0.75,0.822,0.735,0.187,0.33,0.091,0.055,0.045,0.207,0.61,0.281,0.584,0.274,0.604,0.83,0.621,0.353,0.454,0.459,0.066,0.054,0.394,0.881,0.814,0.801,0.829,1,0.527,0.768,0.115,0.592,0.7,0.376,0.371,0.056,0.054,0.036,0.069,0.109,0.01]
  },
  {
    id: "gap_behind_1",
    scenario: "GAP_BEHIND",
    text: "Atenção Gabriel, o cara de trás tá com asa aberta e colando! Fecha a porta!",
    asset: CLAUDINHO_AUDIO_ASSETS["gap_behind_1.wav"],
    durationMs: 5521,
    envelope: [0.102,0.044,0.044,0.043,0.961,0.185,0.594,0.443,0.164,0.801,0.615,0.659,0.51,0.323,0.881,0.841,0.322,0.067,0.532,0.072,0.863,0.943,0.869,0.227,0.077,0.559,0.905,0.672,0.077,0.851,0.413,0.44,0.747,0.973,0.135,0.932,0.105,0.858,0.982,0.179,0.763,0.148,0.314,0.122,0.642,0.724,0.613,0.781,0.617,0.262,0.496,0.074,0.053,0.313,0.852,0.586,0.491,0.264,0.313,1,0.748,0.086,0.752,0.206,0.064,0.049,0.2,0.03,0.069,0.003]
  },
  {
    id: "gap_behind_2",
    scenario: "GAP_BEHIND",
    text: "Olha o retrovisor, ele tá a menos de um segundo! Traciona forte nessa saída!",
    asset: CLAUDINHO_AUDIO_ASSETS["gap_behind_2.wav"],
    durationMs: 6070,
    envelope: [0.098,0.042,0.042,0.042,0.333,0.856,0.588,0.589,0.371,0.272,0.509,0.457,0.346,0.114,0.309,0.793,0.974,0.447,0.07,0.11,0.089,0.047,0.195,0.152,0.596,0.603,0.251,0.211,0.521,0.4,0.327,0.081,0.504,0.367,0.13,0.358,0.102,0.25,0.464,0.482,0.263,0.526,0.089,0.088,0.123,0.066,0.044,0.586,0.763,0.106,0.12,0.497,0.393,0.474,0.115,0.099,0.761,1,0.113,0.462,0.542,0.15,0.429,0.08,0.784,0.243,0.321,0.403,0.274,0.057,0.047,0.043,0.044,0.181,0.023,0.041]
  },
  {
    id: "gap_behind_3",
    scenario: "GAP_BEHIND",
    text: "O cara de trás tá babando no seu câmbio, porra! Mantém a linha interna!",
    asset: CLAUDINHO_AUDIO_ASSETS["gap_behind_3.wav"],
    durationMs: 4430,
    envelope: [0.097,0.046,0.095,0.058,0.746,0.773,0.604,0.288,0.057,0.813,0.525,0.349,0.162,0.775,0.806,0.096,0.061,0.608,0.332,0.487,0.517,0.238,0.723,0.076,0.716,0.676,0.318,0.432,0.241,0.749,0.751,0.533,0.841,0.507,0.07,0.059,0.044,0.615,0.319,0.617,0.773,0.429,0.317,0.313,0.937,0.997,0.686,0.991,0.555,0.1,0.051,0.048,0.033,0.043,0.113,0.006]
  },
  {
    id: "gap_front_1",
    scenario: "GAP_UPDATE",
    text: "O cara da frente tá logo ali, Gabriel! Tira essa diferença, caralho!",
    asset: CLAUDINHO_AUDIO_ASSETS["gap_front_1.wav"],
    durationMs: 4910,
    envelope: [0.101,0.043,0.043,0.043,0.274,0.058,0.714,0.631,0.107,0.867,0.114,0.462,0.208,0.112,0.81,0.603,0.934,0.178,1,0.472,0.131,0.197,0.473,0.128,0.963,0.139,0.394,0.517,0.831,0.927,0.601,0.088,0.348,0.24,0.484,0.369,0.138,0.328,0.119,0.639,0.7,0.465,0.485,0.26,0.102,0.782,0.309,0.712,0.686,0.821,0.919,0.428,0.247,0.112,0.047,0.051,0.042,0.043,0.032,0.044,0.116,0.006]
  },
  {
    id: "gap_front_2",
    scenario: "GAP_UPDATE",
    text: "Cola na asa dele, porra! Tá a menos de dois segundos, bota pressão!",
    asset: CLAUDINHO_AUDIO_ASSETS["gap_front_2.wav"],
    durationMs: 5470,
    envelope: [0.088,0.038,0.038,0.037,0.06,0.767,0.734,0.679,0.319,0.868,0.836,1,0.294,0.826,0.099,0.627,0.504,0.522,0.383,0.057,0.732,0.886,0.698,0.656,0.839,0.088,0.181,0.169,0.067,0.039,0.209,0.681,0.175,0.34,0.284,0.135,0.361,0.06,0.396,0.529,0.109,0.14,0.056,0.147,0.239,0.229,0.333,0.263,0.147,0.105,0.039,0.334,0.626,0.627,0.071,0.556,0.12,0.081,0.73,0.663,0.302,0.06,0.046,0.041,0.04,0.029,0.039,0.098,0.006]
  },
  {
    id: "gap_front_3",
    scenario: "GAP_UPDATE",
    text: "Diferença pro carro da frente caindo, Gabriel! Mantém o pé que você engole ele!",
    asset: CLAUDINHO_AUDIO_ASSETS["gap_front_3.wav"],
    durationMs: 6070,
    envelope: [0.097,0.041,0.042,0.041,0.099,0.463,0.147,0.151,0.735,0.589,0.448,0.313,0.111,0.09,0.387,0.079,0.545,0.888,0.41,0.624,0.353,0.12,0.533,0.314,0.278,0.06,0.641,0.459,0.463,0.38,0.435,0.268,0.206,0.775,0.268,0.517,0.802,0.935,0.456,0.124,0.13,0.064,0.044,0.475,0.43,0.062,0.05,0.507,0.257,0.492,0.06,0.05,0.503,0.066,0.321,0.293,0.127,0.205,0.296,0.102,0.48,0.44,0.785,0.299,0.296,0.469,0.214,0.201,0.084,0.045,0.042,0.041,0.043,0.179,0.023,0.04]
  },
  {
    id: "safety_car_1",
    scenario: "SAFETY_CAR",
    text: "Safety car na pista, porra! Segura o delta positivo e não faz cagada!",
    asset: CLAUDINHO_AUDIO_ASSETS["safety_car_1.wav"],
    durationMs: 6030,
    envelope: [0.106,0.045,0.046,0.046,0.077,0.196,0.4,0.113,0.415,0.069,0.311,0.881,0.263,0.991,0.094,0.065,0.199,0.217,0.345,0.136,0.383,0.296,0.066,0.235,0.953,0.938,0.642,0.563,0.929,0.748,0.096,0.144,0.086,0.081,0.099,0.138,0.058,0.202,0.441,0.569,0.113,0.897,0.238,0.621,0.071,0.412,0.23,0.071,0.405,0.254,0.245,0.236,0.163,0.288,0.108,0.091,0.167,0.909,0.195,0.147,0.683,0.686,0.119,0.776,0.941,0.331,0.331,0.384,0.063,0.051,0.046,0.045,0.037,0.047,0.126,0.007]
  },
  {
    id: "safety_car_2",
    scenario: "SAFETY_CAR",
    text: "Bandeira amarela, safety car! Respira, economiza pneu e foca no delta!",
    asset: CLAUDINHO_AUDIO_ASSETS["safety_car_2.wav"],
    durationMs: 6641,
    envelope: [0.102,0.043,0.044,0.043,0.061,0.655,0.55,0.164,0.237,0.49,0.504,0.943,0.669,0.926,0.869,0.807,0.848,0.686,0.466,0.073,0.052,0.055,0.08,0.122,0.528,0.192,0.13,0.324,0.485,0.817,0.682,0.295,0.06,0.048,0.047,0.043,0.04,0.208,0.491,0.106,0.057,0.224,0.149,0.297,0.801,0.147,0.067,0.052,0.553,0.087,0.561,0.248,0.271,0.142,0.3,0.11,0.586,0.299,0.275,0.535,0.629,0.211,0.059,0.05,0.237,0.227,0.116,0.165,0.999,0.137,0.666,0.411,0.127,0.813,0.602,0.077,0.411,0.152,0.054,0.044,0.173,0.029,0.067,0.003]
  },
  {
    id: "vsc_1",
    scenario: "VSC",
    text: "Virtual Safety Car na pista! Olha o delta no visor e segura o pé!",
    asset: CLAUDINHO_AUDIO_ASSETS["vsc_1.wav"],
    durationMs: 4881,
    envelope: [0.119,0.067,0.054,0.117,0.367,0.404,0.076,0.637,0.918,0.64,0.115,0.42,0.399,0.318,0.319,0.072,0.748,0.892,0.672,0.6,0.219,0.221,0.218,0.424,0.075,0.732,0.153,0.072,0.056,0.053,1,0.387,0.57,0.176,0.87,0.539,0.466,0.278,0.271,0.312,0.179,0.468,0.714,0.413,0.138,0.061,0.332,0.144,0.357,0.174,0.518,0.805,0.127,0.635,0.702,0.211,0.064,0.056,0.226,0.033,0.078,0.003]
  },
  {
    id: "vsc_2",
    scenario: "VSC",
    text: "VSC acionado! Mantém o delta positivo, não toma punição à toa!",
    asset: CLAUDINHO_AUDIO_ASSETS["vsc_2.wav"],
    durationMs: 5990,
    envelope: [0.102,0.043,0.044,0.043,0.09,0.136,0.554,0.654,0.738,0.605,0.087,0.172,0.129,0.081,0.369,0.848,0.104,0.273,0.798,0.597,0.877,0.265,0.13,0.068,0.051,0.047,0.043,0.208,0.617,0.17,0.056,0.499,0.333,0.453,0.074,0.605,0.868,0.11,0.62,0.075,0.552,0.095,0.152,0.21,0.332,0.249,0.107,0.1,0.047,0.042,0.076,0.614,0.122,0.053,0.532,0.893,0.833,0.097,0.414,0.285,0.143,0.132,0.641,0.766,0.084,0.348,0.449,0.474,0.066,0.051,0.046,0.044,0.178,0.023,0.041]
  },
  {
    id: "red_flag_1",
    scenario: "RED_FLAG",
    text: "Bandeira vermelha, caralho! Sessão suspensa, traz o carro pro box devagar!",
    asset: CLAUDINHO_AUDIO_ASSETS["red_flag_1.wav"],
    durationMs: 6241,
    envelope: [0.093,0.04,0.04,0.039,0.196,0.764,0.448,0.11,0.368,0.477,0.546,0.875,0.177,0.68,0.327,0.186,0.603,0.525,0.281,0.687,0.382,0.419,0.801,0.567,0.797,0.685,0.107,0.275,0.075,0.044,0.043,0.04,0.094,0.179,0.416,0.096,0.682,0.544,0.116,0.441,0.098,0.048,0.745,0.481,0.145,0.119,0.49,0.111,0.049,0.041,0.297,0.946,0.814,0.166,0.1,0.702,0.947,0.605,0.077,0.635,0.098,0.943,0.745,0.4,0.07,0.387,0.537,0.772,0.574,0.73,0.487,0.117,0.053,0.044,0.04,0.165,0.025,0.066,0.003]
  },
  {
    id: "red_flag_2",
    scenario: "RED_FLAG",
    text: "Red flag na pista, porra! Reduz o ritmo e entra direto no pit lane!",
    asset: CLAUDINHO_AUDIO_ASSETS["red_flag_2.wav"],
    durationMs: 4550,
    envelope: [0.111,0.067,0.868,0.142,0.129,0.785,0.887,0.196,0.926,0.107,0.355,0.215,0.137,0.408,0.139,0.217,0.536,0.628,0.652,0.091,0.084,0.096,0.081,0.069,0.298,0.168,0.473,0.274,0.337,0.356,0.202,0.439,0.353,0.703,0.464,0.565,0.242,0.628,0.268,0.661,1,0.697,0.245,0.506,0.223,0.213,0.288,0.618,0.311,0.068,0.051,0.049,0.047,0.046,0.201,0.027,0.044]
  },
  {
    id: "pit_lane_1",
    scenario: "PIT_LANE",
    text: "Box agora, box agora! Aciona a porra do limitador na linha!",
    asset: CLAUDINHO_AUDIO_ASSETS["pit_lane_1.wav"],
    durationMs: 5361,
    envelope: [0.109,0.046,0.048,0.047,0.049,0.044,0.051,0.05,0.752,0.898,0.363,0.262,0.328,0.626,0.078,0.712,0.969,0.708,0.596,0.213,0.057,0.164,0.955,0.407,0.213,0.428,0.509,0.416,0.856,0.944,0.581,0.308,0.073,0.075,0.073,0.056,0.451,0.088,0.101,0.664,0.593,0.714,0.083,0.06,0.723,0.546,0.671,0.101,0.282,0.309,0.402,0.243,0.576,0.41,0.457,0.173,0.67,0.158,0.259,0.287,0.492,0.101,0.055,0.05,0.18,0.028,0.072,0.003]
  },
  {
    id: "pit_lane_2",
    scenario: "PIT_LANE",
    text: "Entrando no pit, não esquece o limitador! Parada rápida agora!",
    asset: CLAUDINHO_AUDIO_ASSETS["pit_lane_2.wav"],
    durationMs: 4641,
    envelope: [0.113,0.049,0.049,0.048,0.625,0.222,0.069,0.6,0.815,0.296,0.499,0.249,0.377,0.464,0.085,0.326,0.303,0.09,0.055,0.328,0.651,0.556,0.251,0.496,0.884,0.232,0.283,0.449,0.38,0.529,0.826,0.272,0.85,0.819,0.364,0.079,0.052,0.051,0.734,0.847,0.956,0.761,0.796,0.723,0.791,1,0.122,0.414,0.574,0.645,0.502,0.786,0.339,0.332,0.065,0.183,0.032,0.072,0.003]
  },
  {
    id: "fastest_lap_1",
    scenario: "FASTEST_LAP",
    text: "VOLTA MAIS RÁPIDA! É o Goat da F1, caralho! Que volta absurda!",
    asset: CLAUDINHO_AUDIO_ASSETS["fastest_lap_1.wav"],
    durationMs: 6481,
    envelope: [0.084,0.036,0.036,0.036,0.23,0.17,0.821,0.652,0.367,0.406,0.735,0.492,0.94,0.625,0.12,0.703,0.834,0.95,0.824,0.076,0.385,0.144,0.697,0.838,0.828,0.239,0.108,0.08,0.05,0.18,0.743,0.613,0.231,0.497,0.787,0.635,0.088,0.292,0.388,0.962,0.609,0.213,0.273,0.388,0.365,0.333,0.347,0.657,0.857,0.763,1,0.893,0.408,0.602,0.509,0.388,0.056,0.043,0.045,0.146,0.276,0.157,0.73,0.748,0.079,0.685,0.177,0.241,0.084,0.106,0.402,0.431,0.491,0.371,0.767,0.81,0.286,0.055,0.138,0.024,0.06,0.002]
  },
  {
    id: "fastest_lap_2",
    scenario: "FASTEST_LAP",
    text: "Roxo em todos os setores! Você tá voando baixo hoje, porra!",
    asset: CLAUDINHO_AUDIO_ASSETS["fastest_lap_2.wav"],
    durationMs: 4561,
    envelope: [0.116,0.049,0.05,0.049,0.202,0.212,0.63,0.706,0.466,0.346,0.287,0.058,0.056,0.559,0.136,0.371,0.376,0.127,0.534,0.082,0.435,0.627,0.232,0.171,0.092,0.055,0.049,0.05,0.081,0.117,0.75,0.773,0.577,0.623,0.72,0.515,0.179,0.763,0.917,0.474,0.424,0.394,0.549,0.593,0.415,0.074,0.173,0.57,0.506,0.389,0.124,0.057,0.051,0.048,0.222,0.034,0.078,0.002]
  },
  {
    id: "tyre_wear_1",
    scenario: "TYRE_WEAR",
    text: "Esses pneus tão no osso, porra! Mais de 70% de desgaste, segura na curva!",
    asset: CLAUDINHO_AUDIO_ASSETS["tyre_wear_1.wav"],
    durationMs: 6841,
    envelope: [0.123,0.052,0.053,0.053,0.286,0.174,0.171,0.16,0.096,0.539,0.641,0.273,0.683,0.716,0.121,0.252,0.728,0.575,0.679,0.622,0.696,0.887,0.218,0.137,0.421,0.072,0.059,0.792,0.779,0.856,0.578,0.806,0.188,0.067,0.059,0.092,0.599,0.933,0.247,0.324,0.197,0.226,0.473,0.07,0.527,0.631,0.246,0.421,0.363,0.411,0.133,0.394,0.455,0.118,0.277,0.295,0.215,0.159,0.065,0.882,1,0.281,0.13,0.237,0.291,0.061,0.057,0.081,0.161,0.298,0.129,0.399,0.721,0.768,0.935,0.165,0.335,0.566,0.758,0.327,0.565,0.622,0.072,0.08,0.133,0.011]
  },
  {
    id: "tyre_wear_2",
    scenario: "TYRE_WEAR",
    text: "Cuidado com a tração, caralho, os pneus tão só o farelo!",
    asset: CLAUDINHO_AUDIO_ASSETS["tyre_wear_2.wav"],
    durationMs: 4081,
    envelope: [0.131,0.056,0.056,0.056,0.428,0.56,0.102,0.976,0.98,0.394,0.114,0.729,0.249,0.879,0.172,0.118,0.708,0.637,0.294,0.706,0.712,0.873,0.433,0.307,0.105,0.071,0.167,0.063,0.854,0.772,0.563,0.085,0.683,0.259,0.107,0.949,0.459,0.237,0.846,0.631,0.965,0.77,0.389,0.375,0.081,0.063,0.06,0.058,0.252,0.035,0.083,0.003]
  },
  {
    id: "calm_pace",
    scenario: "CALM_RACE",
    text: "Ritmo constante, Gabriel! Abre vantagem pro pelotão e cuida dos pneus.",
    asset: CLAUDINHO_AUDIO_ASSETS["gap_front_3.wav"],
    durationMs: 4800,
    envelope: [0.08,0.04,0.04,0.35,0.72,0.85,0.6,0.3,0.15,0.7,0.85,0.4,0.2,0.65,0.8,0.4,0.1,0.05]
  },
  {
    id: "calm_clean",
    scenario: "CALM_RACE",
    text: "Pista limpa na sua frente, Gabriel. Foca no traçado e mantém essa pegada!",
    asset: CLAUDINHO_AUDIO_ASSETS["fastest_lap_2.wav"],
    durationMs: 4200,
    envelope: [0.09,0.05,0.5,0.85,0.9,0.4,0.2,0.7,0.8,0.6,0.2,0.1,0.05]
  },
  {
    id: "tyre_wear_warn_1",
    scenario: "TYRE_WEAR_WARNING",
    text: "Pneus dianteiros passando de 50%, Gabriel. Começa a administrar a borracha nas curvas!",
    asset: CLAUDINHO_AUDIO_ASSETS["tyre_wear_2.wav"],
    durationMs: 3800,
    envelope: [0.1,0.05,0.6,0.8,0.7,0.3,0.65,0.9,0.5,0.2,0.1,0.05]
  },
  {
    id: "tyre_temp_1",
    scenario: "TYRE_TEMP_HIGH",
    text: "Temperatura dos pneus subindo, Gabriel! Não escorrega tanto na saída de curva!",
    asset: CLAUDINHO_AUDIO_ASSETS["tyre_wear_1.wav"],
    durationMs: 4500,
    envelope: [0.1,0.05,0.4,0.7,0.9,0.5,0.3,0.8,0.6,0.2,0.05]
  },
  {
    id: "brake_temp_1",
    scenario: "BRAKE_TEMP_HIGH",
    text: "Temperatura dos freios no limite, Gabriel! Alivia um pouco a pressão na freada!",
    asset: CLAUDINHO_AUDIO_ASSETS["damage_2.wav"],
    durationMs: 3710,
    envelope: [0.096,0.043,0.62,0.337,0.818,0.453,0.721,0.853,0.603,0.395,0.629,0.082,0.05]
  },
  {
    id: "fuel_low_1",
    scenario: "FUEL_LOW",
    text: "Combustível no limite negativo, Gabriel! Faz um pouco de lift and coast nessa volta!",
    asset: CLAUDINHO_AUDIO_ASSETS["pit_lane_2.wav"],
    durationMs: 4300,
    envelope: [0.1,0.05,0.5,0.8,0.6,0.3,0.7,0.85,0.4,0.1,0.05]
  },
  {
    id: "fuel_surplus_1",
    scenario: "FUEL_SURPLUS",
    text: "Margem de combustível tá boa, Gabriel! Pode acelerar forte e subir o ritmo!",
    asset: CLAUDINHO_AUDIO_ASSETS["overtake_3.wav"],
    durationMs: 5110,
    envelope: [0.092,0.039,0.05,0.5,0.7,0.8,0.6,0.4,0.7,0.9,0.5,0.1,0.05]
  },
  {
    id: "ers_full_1",
    scenario: "ERS_FULL",
    text: "Bateria cheia no volante, Gabriel! Aproveita a reta e usa o modo ultrapassagem!",
    asset: CLAUDINHO_AUDIO_ASSETS["overtake_1.wav"],
    durationMs: 5270,
    envelope: [0.092,0.039,0.7,0.8,0.5,0.3,0.9,1,0.6,0.2,0.05]
  },
  {
    id: "ers_low_1",
    scenario: "ERS_LOW",
    text: "Bateria no osso agora, Gabriel! Recarrega no miolo pra ter pressão na reta!",
    asset: CLAUDINHO_AUDIO_ASSETS["pit_lane_1.wav"],
    durationMs: 4900,
    envelope: [0.1,0.05,0.6,0.8,0.7,0.4,0.7,0.9,0.4,0.1,0.05]
  },
  {
    id: "lap_pace_1",
    scenario: "LAP_PACE",
    text: "Bela volta, Gabriel! Mantém esse ritmo constante que o tempo tá excelente!",
    asset: CLAUDINHO_AUDIO_ASSETS["fastest_lap_2.wav"],
    durationMs: 4200,
    envelope: [0.09,0.05,0.5,0.85,0.9,0.4,0.2,0.7,0.8,0.6,0.2,0.1,0.05]
  },
  {
    id: "start_1",
    scenario: "START",
    text: "Moleque doido, passou voando! Mantém esse ritmo forte!",
    asset: CLAUDINHO_AUDIO_ASSETS["overtake_2.wav"],
    durationMs: 6110,
    envelope: [0.125,0.053,0.054,0.053,0.207,0.385,0.447,0.438,0.652,0.961,0.929,0.826,0.095,0.129,0.117,0.133,0.063,0.065,0.542,0.819,0.704,0.857,0.984,0.327,0.095,0.344,0.494,0.412,0.068,0.833,0.233,0.159,0.877,0.191,0.18,0.615,0.844,0.979,0.82,0.924,0.593,0.64,0.506,0.083,0.152,0.11,0.075,0.058,0.249,0.233,0.075,0.288,0.214,0.448,0.12,0.671,0.076,0.063,0.648,0.536,0.698,0.148,0.447,0.284,0.278,0.088,0.787,0.178,0.134,0.059,0.055,0.053,0.056,0.04,0.056,0.136,0.007]
  },
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
