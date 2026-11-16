import React from 'react';
import {AbsoluteFill, Audio, Sequence, Series, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Scene1Intro} from './scenes/Scene1Intro';
import {Scene2Udp} from './scenes/Scene2Udp';
import {Scene3Engine} from './scenes/Scene3Engine';
import {Scene4GeminiClaudinho} from './scenes/Scene4GeminiClaudinho';
import {Scene5Esp32} from './scenes/Scene5Esp32';
import {Scene6Outro} from './scenes/Scene6Outro';
import {SCENE_FRAMES} from './theme';

export type F1ExplainerProps = {
  audioDir?: string;
  sceneFrames?: typeof SCENE_FRAMES;
};

export const F1Explainer: React.FC<F1ExplainerProps> = ({
  audioDir = 'audio',
  sceneFrames = SCENE_FRAMES,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const globalProgress = frame / Math.max(1, durationInFrames - 1);

  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence durationInFrames={sceneFrames.scene1}>
          <Audio src={staticFile(`${audioDir}/scene1_intro.mp3`)} />
          <Scene1Intro globalProgress={globalProgress} />
        </Series.Sequence>

        <Series.Sequence durationInFrames={sceneFrames.scene2}>
          <Audio src={staticFile(`${audioDir}/scene2_udp.mp3`)} />
          <Scene2Udp globalProgress={globalProgress} />
        </Series.Sequence>

        <Series.Sequence durationInFrames={sceneFrames.scene3}>
          <Audio src={staticFile(`${audioDir}/scene3_engine.mp3`)} />
          <Scene3Engine globalProgress={globalProgress} />
        </Series.Sequence>

        <Series.Sequence durationInFrames={sceneFrames.scene4}>
          <Audio src={staticFile(`${audioDir}/scene4_gemini_intro.mp3`)} />
          <Sequence from={sceneFrames.scene4ClaudinhoStart}>
            <Audio src={staticFile(`${audioDir}/scene4_claudinho_radio.mp3`)} />
          </Sequence>
          <Scene4GeminiClaudinho globalProgress={globalProgress} />
        </Series.Sequence>

        <Series.Sequence durationInFrames={sceneFrames.scene5}>
          <Audio src={staticFile(`${audioDir}/scene5_esp32.mp3`)} />
          <Scene5Esp32 globalProgress={globalProgress} />
        </Series.Sequence>

        <Series.Sequence durationInFrames={sceneFrames.scene6}>
          <Audio src={staticFile(`${audioDir}/scene6_outro.mp3`)} />
          <Scene6Outro globalProgress={globalProgress} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
