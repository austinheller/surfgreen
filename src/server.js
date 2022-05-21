import express from 'express';
import getSiteData from './createPage/getSiteData.js';
import createPage from './createPage/createPage.js';
import * as path from 'path';
import * as fs from 'fs';
import * as livereload from 'livereload';
import connectLivereload from 'connect-livereload';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
const app = express();
const port = 3000;


export default async function startServer() {
   
   const siteData = await getSiteData();
   if(! siteData) {
      console.error(`Surfgreen quit because site data could not be retrieved.\n`);
      return;
   }
   const webpackRelativeLocation = process.env.SURFGREEN_WEBPACK_LOCATION ? process.env.SURFGREEN_WEBPACK_LOCATION : './webpack.cjs';
   const webpackLocation = path.resolve(process.env.PWD, webpackRelativeLocation);
   let webpackConfig = false;
   try {
      webpackConfig = await import(webpackLocation);   
   }
   catch {
      console.warn('Note: Webpack is installed, but a configuration file was not found, so Surfgreen will not bundle any assets.');
   }
   let compiler = false;
   if(webpackConfig !== false) {
      compiler = webpack(webpackConfig.default);
   }

   // Start livereload
   const liveReloadServer = livereload.createServer({
      extraExts: ['md', 'scss'],
      applyCSSLive: true
   });
   liveReloadServer.watch(path.resolve(siteData.sitePath));
   app.use(connectLivereload());

   if( compiler !== false ) {
      app.use(webpackDevMiddleware(compiler, {
         publicPath: siteData.sitePath,
         writeToDisk: true
      }));
   
      app.use(webpackHotMiddleware(compiler));
   }

   // Static files
   app.use(express.static(siteData.sitePath));

   // Site root
   app.get('/', async function (req, res) {
      const pageBuild = await createPage('home', siteData.sitePath);
      const pageHTML = pageBuild.html;
      res.set('Content-Type', 'text/html');
      res.send(pageHTML);
   });

   // Minified JS, CSS files
   app.get(/(.*?)(index\.min\.js|style\.min\.css)/, (req, res) => {
      const fileName = req.path.replace(/(.*?)(index\.min\.js|style\.min\.css)/g, '$2');
      const buildLocation = siteData.repo.absolutePath + '/build/' + fileName;
      const contents = fs.readFileSync(buildLocation, 'utf8');
      let contentType = '';
      if (fileName.includes('.css')) {
         contentType = 'text/css';
      }
      else if (fileName.includes('.js')) {
         contentType = 'text/javascript';
      }
      res.set('Content-Type', contentType);
      res.send(contents);
   });

   // HTML files OR no file extension
   app.get(/(\/|^)([^.]+$|(.*?).html)/, async function (req, res) {

      // Remove leading and trailing slashes from path
      let filePath = req.path;
      if (filePath.charAt(0) === '/') {
         filePath = filePath.substring(1);
      }
      if (filePath.charAt(filePath.length - 1) === '/') {
         filePath = filePath.substring(0, filePath.length - 1);
      }

      // Get page name (without path)
      const dirs = filePath.split('/');
      let fileName = dirs[dirs.length - 1];
      if (fileName.includes('index.html')) {
         fileName = dirs[dirs.length - 2];
      }
      fileName = fileName.replace(/.html$/, '');

      // Get file path
      if (filePath.match(/.html$/)) {
         filePath = filePath.replace(/([^/]*?)(.html)$/, '');
         filePath = filePath.replace(/\/$/, '');
      }
      let sitePath = siteData.sitePath;
      if (sitePath.charAt(sitePath.length + 1) !== '/') {
         sitePath += '/';
      }
      filePath = sitePath + filePath;
      filePath = filePath.replace('//', '/');

      // Get page HTML
      const pageBuild = await createPage(fileName, filePath);
      const pageHTML = pageBuild.html;
      res.set('Content-Type', 'text/html');
      res.send(pageHTML);

   });

   app.listen(port, () => {
      console.log(`\n\nSurf's up! Your site is ready for local preview:\n\nhttp://localhost:${port}\n\n`);
   });

}