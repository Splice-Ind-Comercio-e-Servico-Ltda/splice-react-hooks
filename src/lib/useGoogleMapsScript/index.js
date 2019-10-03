import { useMemo } from 'react';

import useExternalScript from '../useExternalScript';

/**
 * Loads google api script and returns some functions.
 * @param {String} clientId Your Google client ID;
 * @param {Array[String]} libraries List of libraries to load;
 * @param {String} [versioning] Weekly, quarterly (default) or version number (Ex: 3.38);
 * @returns {Boolean} googleMapsReady as true for loaded and false for error;
 */
const useGoogleMapsScript = (
  clientId,
  { libraries, versioning = 'quarterly', baseUrl = 'https://maps.googleapis.com/maps/api/js' } = {}
) => {
  const _clientId = useMemo(() => clientId, [clientId]);
  const _versioning = useMemo(() => versioning, [versioning]);
  const _libraries = useMemo(
    () => (Array.isArray(libraries) && libraries.length > 0 ? libraries.join(',') : ''),
    [libraries]
  );

  const _src = useMemo(
    () => `${baseUrl}?client=${_clientId}&v=${_versioning}&libraries=${_libraries}`,
    [_clientId, _libraries, _versioning, baseUrl]
  );

  const googleMapsReady = useExternalScript({ src: _src });

  return googleMapsReady;
};

export default useGoogleMapsScript;
