import React from 'react';

import { useGoogleMaps } from '../lib';

const App = () => {
  const { googleMapsReady } = useGoogleMaps();

  return (
    <div>
      <p>Hello World!</p>
      {googleMapsReady && <p>Google Maps is loaded.</p>}
    </div>
  );
};

export default App;
