import * as path from 'path';
import * as fs from 'fs';
import FindFiles from 'file-regex';
import getSiteData from './createPage/getSiteData.js';
import createPage from './createPage/createPage.js';

function copyFileSync(source, target) {

   var targetFile = target;

   // If target is a directory, a new file with the same name will be created
   if (fs.existsSync(target)) {
      if (fs.lstatSync(target).isDirectory()) {
         targetFile = path.join(target, path.basename(source));
      }
   }

   fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source, target, inSource) {

   if (source.includes('/contents/blocks')) {
      return;
   }

   var files = [];

   // Check if folder needs to be created or integrated
   var targetFolder = path.join(target, path.basename(source));
   if (!fs.existsSync(targetFolder) && !inSource) {
      fs.mkdirSync(targetFolder);
   }
   else {
      targetFolder = targetFolder.replace('/build/contents', '/build');
   }

   // Copy
   if (fs.lstatSync(source).isDirectory()) {
      files = fs.readdirSync(source);
      //  console.log(files);
      files.forEach(function (file) {
         var curSource = path.join(source, file);
         if (fs.lstatSync(curSource).isDirectory()) {
            copyFolderRecursiveSync(curSource, targetFolder, false);
         } else {
            if (!curSource.match(/\.md$/g)) {
               copyFileSync(curSource, targetFolder);
            }
         }
      });
   }
}

const getOutputFileName = function (slug, dir) {
   let name = slug;
   // Trim leading slash
   if (dir.charAt === '/') {
      dir = dir.substring(0, dir.length - 1);
   }
   // Identify immediate directory
   const dirs = dir.split('/');
   const lastDir = dirs[dirs.length - 1];
   // Evaluate it, baby
   if (slug === lastDir || slug === 'home') {
      name = 'index';
   }
   else {
      name = slug;
   }
   return name;
}

export default async function createPages() {
   const siteData = await getSiteData();
   if(! siteData) {
      console.error(`Surfgreen quit because site data could not be retrieved.\n`);
      return;
   }
   const siteSrc = siteData.sitePath;
   // Copy site directory
   const buildDir = siteData.repo.absolutePath + '/build';
   copyFolderRecursiveSync(siteSrc, buildDir, true);
   // Get markdown files, create pages
   const pages = await FindFiles(siteSrc, /\.md$/, 5);
   pages.forEach(async function (page) {
      const pageSlug = page.file.replace(/\.(\w+_*-*?)$/g, '');
      const pageBuild = await createPage(pageSlug, page.dir);
      if( pageBuild.meta.hasOwnProperty('createPage') ) {
         if( pageBuild.meta.createPage === 'false' ) {
            return;
         }
      }
      const pageHTML = pageBuild.html;
      // Get filename to use for output (since it might not be index.html)
      const fileName = getOutputFileName(pageSlug, page.dir);
      // Get output file name based on slug and path
      const buildDir = page.dir.replace(siteData.sitePath, siteData.buildPath) + '/' + fileName + '.html';
      fs.writeFileSync(buildDir, pageHTML);
   })
   
   console.log(`Hang ten! Your site has completed building, and can be found in your site's /build folder.\n\nIf you're deploying this site from a hosting service, make sure the public root is also set to /build.\n\nHappy surfing!\n\n`);
   
}