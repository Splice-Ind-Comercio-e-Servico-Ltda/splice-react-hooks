export const checkForGoogleMaps = () => {
  if (!(window && window.google)) {
    throw new Error('This method uses Google maps API and it is not loaded.');
  }
};

export const checkForGeometryLib = () => {
  checkForGoogleMaps();

  if (!window.google.maps.geometry) {
    throw new Error("The library 'geometry' must be included in your Google maps script.");
  }
};
