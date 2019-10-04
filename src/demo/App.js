import React from 'react';

import { useGoogleMapsScript } from '../lib';

const App = () => {
  const googleMapsReady = useGoogleMapsScript();

  return (
    <div>
      <p>Hello World!</p>
      {googleMapsReady && <p>Google Maps is loaded.</p>}
    </div>
  );
};

export default App;
