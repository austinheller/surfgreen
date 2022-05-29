import startServer from './server.js';
import buildPages from './build.js';

export default {
   start: (specifiedConfig = {}) => {
      
      // Set config
      let config = {};
      const defaultConfig = {
         webpack: false,
         webpackLocation: './webpack.cjs'
      };
      const defaultKeys = Object.keys(defaultConfig);
      defaultKeys.forEach( key => {
         if( specifiedConfig.hasOwnProperty(key) ) {
            config[key] = specifiedConfig[key];   
         }
         else {
            config[key] = defaultConfig[key];
         }
      })
   
      // Start the thing
      const sgMode = process.env.SURFGREEN_MODE;
      const sgAction = process.env.SURFGREEN_ACTION;
      if( sgAction === 'start_server' ) {
         startServer(config);
      }
      else {
         buildPages(config);
      }
      
   }
};