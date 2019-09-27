import { useState, useEffect } from 'react';

const cachedScripts = [];

/**
 * Loads external scripts.
 * @param {String} config Object with the configurations;
 * @param {String} config.src Script's url;
 * @param {Boolean} [config.async] If should be loaded as async. Defaults as true;
 * @param {Boolean} [config.defer] If should defer the load. Defaults as true;
 * @returns {Boolean} True for loaded script and false for errors.
 */
const useExternalScript = ({ src, async = true, defer = true }) => {
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    const scriptAlreadyLoaded = cachedScripts.includes(src);

    if (scriptAlreadyLoaded) setScriptReady(true);
    else {
      cachedScripts.push(src);
      const script = document.createElement('script');

      script.src = src;
      script.async = async;
      script.defer = defer;

      const onScriptLoad = () => {
        setScriptReady(true);
      };

      const onScriptError = () => {
        const index = cachedScripts.indexOf(src);

        if (index >= 0) cachedScripts.splice(index, 1);
        script.remove();

        setScriptReady(false);
      };

      script.addEventListener('load', onScriptLoad);
      script.addEventListener('error', onScriptError);

      document.body.appendChild(script);

      return () => {
        script.removeEventListener('load', onScriptLoad);
        script.removeEventListener('error', onScriptError);
      };
    }
  }, [src, defer, async]);

  return scriptReady;
};

export default useExternalScript;
