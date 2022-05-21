import startServer from './server.js';
import buildPages from './build.js';

const sgMode = process.env.SURFGREEN_MODE;
const sgAction = process.env.SURFGREEN_ACTION;

if( sgAction === 'start_server' ) {
   startServer();
}
else {
   buildPages();
}