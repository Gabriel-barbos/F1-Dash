/**
 * carDamageAssets.ts
 *
 * Mapeamento estático de todos os assets PNG do carro para o bundler Metro (React Native / Expo).
 * No React Native, chamadas require() devem ser estáticas para inclusão no bundle de compilação.
 */

export const CAR_ASSETS = {
  carBase: require('../../../assets/car-parts/car2.png'),

  floor: [
    require('../../../assets/car-parts/Fondo1.png'),
    require('../../../assets/car-parts/Fondo2.png'),
    require('../../../assets/car-parts/Fondo3.png'),
    require('../../../assets/car-parts/Fondo4.png'),
    require('../../../assets/car-parts/Fondo5.png'),
  ],

  gearbox: [
    require('../../../assets/car-parts/Cambio1.png'),
    require('../../../assets/car-parts/Cambio2.png'),
    require('../../../assets/car-parts/Cambio3.png'),
  ],

  engine: [
    require('../../../assets/car-parts/Engine1.png'),
    require('../../../assets/car-parts/Engine2.png'),
    require('../../../assets/car-parts/Engine3.png'),
  ],

  sidepodL: [
    require('../../../assets/car-parts/SidepodL1.png'),
    require('../../../assets/car-parts/SidepodL2.png'),
    require('../../../assets/car-parts/SidepodL3.png'),
    require('../../../assets/car-parts/SidepodL4.png'),
    require('../../../assets/car-parts/SidepodL5.png'),
  ],

  sidepodR: [
    require('../../../assets/car-parts/SidepodR1.png'),
    require('../../../assets/car-parts/SidepodR2.png'),
    require('../../../assets/car-parts/SidepodR3.png'),
    require('../../../assets/car-parts/SidepodR4.png'),
    require('../../../assets/car-parts/SidepodR5.png'),
  ],

  diffuser: [
    require('../../../assets/car-parts/Diffusore1.png'),
    require('../../../assets/car-parts/Diffusore2.png'),
    require('../../../assets/car-parts/Diffusore3.png'),
    require('../../../assets/car-parts/Diffusore4.png'),
    require('../../../assets/car-parts/Diffusore5.png'),
  ],

  rearWing: [
    require('../../../assets/car-parts/Dietro1.png'),
    require('../../../assets/car-parts/Dietro2.png'),
    require('../../../assets/car-parts/Dietro3.png'),
    require('../../../assets/car-parts/Dietro4.png'),
    require('../../../assets/car-parts/Dietro5.png'),
  ],

  flWing: [
    require('../../../assets/car-parts/Sinistra1.png'),
    require('../../../assets/car-parts/Sinistra2.png'),
    require('../../../assets/car-parts/Sinistra3.png'),
    require('../../../assets/car-parts/Sinistra4.png'),
    require('../../../assets/car-parts/Sinistra5.png'),
  ],

  frWing: [
    require('../../../assets/car-parts/Destra1.png'),
    require('../../../assets/car-parts/Destra2.png'),
    require('../../../assets/car-parts/Destra3.png'),
    require('../../../assets/car-parts/Destra4.png'),
    require('../../../assets/car-parts/Destra5.png'),
  ],
};
