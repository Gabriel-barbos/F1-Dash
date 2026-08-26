import React, { useEffect } from 'react';
import { CockpitScreen } from './src/screens/CockpitScreen';
import { TelemetryNetworkReceiver } from './src/core/network/udp-receiver';

export default function App() {
  useEffect(() => {
    const receiver = new TelemetryNetworkReceiver({ port: 20777 });
    receiver.start();

    return () => {
      receiver.stop();
    };
  }, []);

  return <CockpitScreen />;
}
