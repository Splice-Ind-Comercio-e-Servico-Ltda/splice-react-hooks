import { useCallback, useRef } from 'react';

import { checkForGoogleMaps, checkForGeometryLib } from '../utils';

const useGoogleMapsActions = () => {
  const _geocoderRef = useRef(null);
  const _boundsRef = useRef();
  const _directionsServiceRef = useRef(null);
  const _directionsRendererRef = useRef(null);

  /**
   * Clears the current route rendered by Google Maps' DirectionsRenderer.
   * @see {https://developers.google.com/maps/documentation/javascript/reference/directions#DirectionsRenderer}
   * @returns {void}
   */
  const _clearRouteFromDirectionsService = useCallback(() => {
    if (_directionsRendererRef.current) {
      _directionsRendererRef.current.setMap(null);
    }
  }, []);

  /**
   * Draws the route from DirectionsResult on the map instance using the DirectionsRenderer class.
   * @param {window.google.maps.DirectionsResult} directionsResult Google Maps' DirectionsResult interface.
   * @see {https://developers.google.com/maps/documentation/javascript/reference/directions#DirectionsResult}
   * @param {window.google.maps.Map} mapInstance Google Maps' Map instance.
   * @see {https://developers.google.com/maps/documentation/javascript/reference/map#Map}
   * @param {window.google.maps.DirectionsRendererOptions} directionsRendererOptions Google Maps' DirectionsRendererOptions interface.
   * @see {https://developers.google.com/maps/documentation/javascript/reference/directions#DirectionsRendererOptions}
   * @returns {void}
   */
  const _drawRouteFromDirectionsService = useCallback(
    (directionsResult, mapInstance, directionsRendererOptions = {}) => {
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
        if (!_directionsRendererRef.current) {
          _directionsRendererRef.current = new window.google.maps.DirectionsRenderer(
            directionsRendererOptions
          );
        }

        _directionsRendererRef.current.setMap(mapInstance);

        _directionsRendererRef.current.setDirections(directionsResult);
      } catch (error) {
        throw error;
      }
    },
    []
  );

  /**
   * Gets the address, location and number, if available, from GeocoderResult.
   * @param {window.google.maps.GeocoderResult} geocoderResult Google Maps' GeocoderResult interface.
   * @see {https://developers.google.com/maps/documentation/javascript/reference/geocoder#GeocoderResult}
   * @promise {promise}
   * @fulfill {Object}
   * @reject {Error}
   * @returns {Promise.<Object>} Object containing the address, location and number, if available.
   */
  const _getAddressAndLocationFromGeocoderResult = useCallback(
    (geocoderResult) =>
      new Promise((resolve, reject) => {
        try {
          const {
            formatted_address: address,
            geometry,
            address_components: addressComponents,
          } = geocoderResult[0];

          const { short_name: shortName } = addressComponents[0];

          const { location } = geometry;

          const number = parseInt(shortName);

          if (Number.isNaN(number)) {
            resolve({ address, location });
          } else {
            resolve({ address, number, location });
          }
        } catch (error) {
          reject(error);
        }
      }),
    []
  );

  /**
   * Gets all LatLng instances from DirectionsResult's routes.
   * @param {window.google.maps.DirectionsResult} directionsResult Google Maps' DirectionsResult interface.
   * @see {https://developers.google.com/maps/documentation/javascript/reference/directions#DirectionsResult}
   * @promise {promise}
   * @fulfill {Array.<window.google.maps.LatLng>}
   * @reject {Error}
   * @returns {Promise.<Array.<window.google.maps.LatLng>>} Array of Google Maps' LatLng instances.
   * @see {https://developers.google.com/maps/documentation/javascript/reference/coordinates#LatLng}
   */
  const _getLatLngsFromDirectionsResult = useCallback(
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

  /**
   * Gets an Array of Google Maps' LatLngs, with the given distance in between each.
   * @param {Array.<window.google.maps.LatLng>} latLngs Array of Google Maps' LatLngs interface to be applied the given distance in between each.
   * @see {https://developers.google.com/maps/documentation/javascript/reference/coordinates#LatLng}
   * @param {Number} [meters = 500] The distance, in meters, to be applied in the algorithm. Defaults to 500.
   * @promise {promise}
   * @fulfill {Array.<window.google.maps.LatLng>}
   * @reject {Error}
   * @returns {Promise.<Array.<window.google.maps.LatLng>>} Array of Google Maps' LatLngs, with the given distance between each.
   */
  const _getPositionsEveryProvidedMeters = (latLngs, meters = 500) => {
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

  /**
   * Get GeocoderResult using Google Maps' Geocoder geocode method.
   * @param {window.google.maps.GeocoderRequest} geocoderRequest Google Maps' GeocoderRequest interface.
   * @see {https://developers.google.com/maps/documentation/javascript/reference/geocoder#GeocoderRequest}
   * @promise {promise}
   * @fulfill {(window.google.maps.GeocoderResult|null)}
   * @reject {Error}
   * @returns {Promise.<(window.google.maps.GeocoderResult|null)>} Google Maps' GeocoderResult interface or null.
   * @see {https://developers.google.com/maps/documentation/javascript/reference/geocoder#GeocoderResult}
   */
  const _getResultsFromGeocoderService = useCallback((geocoderRequest) => {
    checkForGoogleMaps();

    if (!_geocoderRef.current) {
      _geocoderRef.current = new window.google.maps.Geocoder();
    }

    return new Promise((resolve, reject) => {
      try {
        _geocoderRef.current.geocode(geocoderRequest, (geocoderResult, geocoderStatus) => {
          if (geocoderStatus === 'OK') {
            resolve(geocoderResult);
          } else {
            resolve(null);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  /**
   * Get DirectionsResult using Google Maps' DirectionsService route method.
   * @param {window.google.maps.DirectionsRequest} directionsRequest Google Maps' DirectionsRequest interface.
   * @see {https://developers.google.com/maps/documentation/javascript/reference/directions#DirectionsRequest}
   * @promise {promise}
   * @fulfill {window.google.maps.DirectionsResult}
   * @reject {Error}
   * @returns {Promise.<window.google.maps.DirectionsResult>} Google Maps' DirectionsResult interface.
   * @see {https://developers.google.com/maps/documentation/javascript/reference/directions#DirectionsResult}
   */
  const _getRouteFromDirectionsService = useCallback((directionsRequest) => {
    checkForGoogleMaps();

    if (!_directionsServiceRef.current) {
      _directionsServiceRef.current = new window.google.maps.DirectionsService();
    }

    return new Promise((resolve, reject) => {
      try {
        _directionsServiceRef.current.route(directionsRequest, (response, status) => {
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

  /**
   * Create the Google Maps LatLngBounds object internally.
   */
  const _createBounds = useCallback(
    () => (_boundsRef.current = new window.google.maps.LatLngBounds()),
    []
  );

  /**
   * Receives a position object and extends the created bounds object.
   */
  const _extendBounds = useCallback((position) => {
    _boundsRef.current.extend(position);
  }, []);

  /**
   * Fit the current bounds object.
   */
  const _fitBounds = useCallback((mapInstance) => {
    mapInstance.fitBounds(_boundsRef.current);
  }, []);

  return {
    clearRouteFromDirectionsService: _clearRouteFromDirectionsService,
    drawRouteFromDirectionsService: _drawRouteFromDirectionsService,
    getAddressAndLocationFromGeocoderResult: _getAddressAndLocationFromGeocoderResult,
    getLatLngsFromDirectionsResult: _getLatLngsFromDirectionsResult,
    getPositionsEveryProvidedMeters: _getPositionsEveryProvidedMeters,
    getResultsFromGeocoderService: _getResultsFromGeocoderService,
    getRouteFromDirectionsService: _getRouteFromDirectionsService,
    createBounds: _createBounds,
    extendBounds: _extendBounds,
    fitBounds: _fitBounds,
  };
};

export default useGoogleMapsActions;
