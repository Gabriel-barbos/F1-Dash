import React from 'react';
import {Composition} from 'remotion';
import {F1Explainer, F1ExplainerProps} from './F1Explainer';
import {FPS, HEIGHT, SCENE_FRAMES, WIDTH} from './theme';

const sumFrames = (sf: typeof SCENE_FRAMES) =>
  sf.scene1 + sf.scene2 + sf.scene3 + sf.scene4 + sf.scene5 + sf.scene6;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="F1Explainer"
      component={F1Explainer}
      durationInFrames={sumFrames(SCENE_FRAMES)}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{
        audioDir: 'audio',
        sceneFrames: SCENE_FRAMES,
      }}
      calculateMetadata={({props}: {props: F1ExplainerProps}) => {
        const sf = props.sceneFrames ?? SCENE_FRAMES;
        return {
          durationInFrames: sumFrames(sf),
        };
      }}
    />
  );
};
