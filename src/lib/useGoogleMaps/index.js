import { useRef, useCallback, useMemo } from 'react';
import useExternalScript from '../useExternalScript';

/**
 * Loads google api script and returns some functions.
 * @param {String} clientId Your Google client ID;
 * @param {Array[String]} libraries List of libraries to load;
 * @param {String} [versioning] Weekly, quarterly (default) or version number (Ex: 3.38);
 * @returns {Boolean} googleMapsReady as true for loaded and false for error;
 * @returns {Function} getAddressAndLocation returns a promise that let you get addresses or locations;
 */
const useGoogleMaps = ({
  clientId,
  libraries,
  versioning = 'quarterly',
  baseUrl = 'https://maps.googleapis.com/maps/api/js',
} = {}) => {
  const geocoderRef = useRef(null);

  const _clientId = useMemo(() => clientId, [clientId]);
  const _versioning = useMemo(() => versioning, [versioning]);
  const _libraries = useMemo(
    () => (Array.isArray(libraries) && libraries.length > 0 ? libraries.join(',') : ''),
    [libraries]
  );

  const src = useMemo(
    () => `${baseUrl}?client=${_clientId}&v=${_versioning}&libraries=${_libraries}`,
    [_clientId, _libraries, _versioning, baseUrl]
  );

  const googleMapsReady = useExternalScript(src);

  const getAddressAndLocation = useCallback((geocoderConfig) => {
    if (!geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    return new Promise((resolve) => {
      geocoderRef.current.geocode(geocoderConfig, (results, status) => {
        if (status === 'OK') {
          const {
            formatted_address: address,
            geometry,
            address_components: addressComponents,
          } = results[0];

          const { short_name: shortName } = addressComponents[0];

          const { location } = geometry;

          const number = parseInt(shortName);

          if (!Number.isNaN(number)) resolve({ address, number, location });
          else resolve({ address, location });
        }
      });
    });
  }, []);

  return {
    googleMapsReady,
    getAddressAndLocation,
  };
};

export default useGoogleMaps;
