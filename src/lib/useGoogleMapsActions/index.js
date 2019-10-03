import { useCallback, useRef } from 'react';

import { checkForGoogleMaps, checkForGeometryLib } from '../utils';

/**
 * @returns {Function} getAddressAndLocation returns a promise that let you get addresses or locations;
 */
const useGoogleMapsActions = () => {
  const geocoderRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);

  /**
   * Returns an array of LatLng objects between the origin and destination of the request.
   * @param {window.google.maps.DirectionsRequest} request Request's configuration object, to be consummed by Google Maps' DirectionsService.
   * @see {https://developers.google.com/maps/documentation/javascript/reference/directions#DirectionsRequest}
   * @promise {promise}
   * @fulfill {Array<window.google.maps.LatLng>}
   * @return {Promise.<Array.<window.google.maps.LatLng>>} Array of LatLng objects between the origin and destination of the request.
   * @see {https://developers.google.com/maps/documentation/javascript/reference/directions#DirectionsResult}
   */
  const getPositionsEveryProvidedMeters = (latLngs, meters = 500) => {
    checkForGeometryLib();

    if (latLngs.length <= 1) {
      throw new Error('You must provide at least two latLng objects.');
    }

    // Maybe?
    if (latLngs.length === 2 && JSON.stringify(latLngs[0]) === JSON.stringify(latLngs[1])) {
      throw new Error('The two objects must be different.');
    }

    return new Promise((resolve, reject) => {
      try {
        const [first] = latLngs;
        const positions = [first];

        const {
          computeDistanceBetween,
          computeOffsetOrigin,
          computeHeading,
        } = window.google.maps.geometry.spherical;

        if (latLngs.length > 2) {
          let prev = first;
          let acc = 0;

          for (const latLng of latLngs) {
            acc += computeDistanceBetween(prev, latLng);

            if (Math.round(acc) < meters) {
              prev = latLng;
            } else {
              const diff = acc - meters;
              const heading = computeHeading(prev, latLng);
              const adjustedPosition = computeOffsetOrigin(latLng, diff, heading);

              acc = 0;
              prev = adjustedPosition;
              positions.push(adjustedPosition);
            }
          }
        }

        resolve(positions);
      } catch (error) {
        reject(error);
      }
    });
  };

  const clearDrawedRoutes = useCallback(() => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }
  }, []);

  const getRouteFromDirectionsService = useCallback((directionsRequest) => {
    checkForGoogleMaps();

    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new window.google.maps.DirectionsService();
    }

    return new Promise((resolve, reject) => {
      try {
        directionsServiceRef.current.route(directionsRequest, (response, status) => {
          if (status === 'OK') {
            resolve(response);
          } else {
            resolve(null);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  const getLatLngsFromdirectionsResult = useCallback(
    (directionsResult) =>
      new Promise((resolve, reject) => {
        try {
          const { routes } = directionsResult;
          const [route] = routes;

          const latLngs = [];

          if (route.legs && route.legs.length > 0) {
            for (let i = 0; i < route.legs.length; i++) {
              const leg = route.legs[i];
              if (leg.steps && leg.steps.length > 0) {
                for (let j = 0; j < leg.steps.length; j++) {
                  const step = leg.steps[j];
                  if (step.steps && step.steps.length > 0) {
                    for (let k = 0; k < step.steps.length; k++) {
                      const innerStep = step.steps[k];

                      innerStep.path.forEach((p) => latLngs.push(p));
                    }
                  } else {
                    step.path.forEach((p) => latLngs.push(p));
                  }
                }
              }
            }
          }

          resolve(latLngs);
        } catch (error) {
          reject(error);
        }
      }),
    []
  );

  const drawRouteFromDirectionsService = useCallback(
    (directionsResult, mapInstance, directionsRendererConfig = {}) => {
      checkForGoogleMaps();

      if (!directionsResult instanceof window.google.maps.DirectionsResult) {
        throw new Error(
          'Param directionsResult is not an instance of google.maps.DirectionsResult.'
        );
      }

      if (!mapInstance) {
        throw new Error('A map instance must be provided');
      }

      try {
        if (!directionsRendererRef.current) {
          directionsRendererRef.current = new window.google.maps.DirectionsRenderer(
            directionsRendererConfig
          );
        }

        directionsRendererRef.current.setMap(mapInstance);

        directionsRendererRef.current.setDirections(directionsResult);
      } catch (error) {
        throw error;
      }
    },
    []
  );

  const getAddressAndLocation = useCallback((geocoderConfig) => {
    checkForGoogleMaps();

    if (!geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    return new Promise((resolve, reject) => {
      try {
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

            if (!Number.isNaN(number)) {
              resolve({ address, number, location });
            } else {
              resolve({ address, location });
            }
          } else {
            resolve(null);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  return {
    getAddressAndLocation,
    getPositionsEveryProvidedMeters,
    drawRouteFromDirectionsService,
    getLatLngsFromdirectionsResult,
    getRouteFromDirectionsService,
    clearDrawedRoutes,
  };
};

export default useGoogleMapsActions;
