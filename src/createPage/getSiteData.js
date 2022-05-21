import * as path from 'path';
import * as fs from 'fs';
import FindFiles from 'file-regex';

export default async function getSiteData(callback) {
   const sgMode = process.env.hasOwnProperty('SURFGREEN_MODE') ? process.env.SURFGREEN_MODE : 'production';
   const repoRelativePath = sgMode === 'development' ? './test' : '.';
   const repoPath = path.resolve(repoRelativePath);
   const sitePath = repoPath + '/contents';
   const buildPath = repoPath + '/build';
   // Get block definitions
   const blocks = [];
   const blocksDir = sitePath + '/blocks';
   let files = false;
   try {
      files = await FindFiles(blocksDir, /(\.html|\.js)$/, 5);
   }
   catch {
      console.error(`Error: A blocks folder wasn't found. Make sure /blocks is located in your site's /contents folder.\n`);
      return false;
   }
   files.forEach(blockProps => {
      let block = {};
      // Set path
      const blockPath = blockProps.dir + '/' + blockProps.file;
      block.path = blockPath;
      // Set ID
      let blockName = blockProps.file.replace(/(\.html)$/, '');
      blockName = blockName.replace(blocksDir, '');
      block.name = blockName;
      // Add file contents
      block.contents = fs.readFileSync(blockPath, 'utf8');
      // Push it
      blocks.push(block);
   })
   // Get pages
   const pages = [];
   const pageFiles = await FindFiles(sitePath, /\.md$/, 9);
   pageFiles.forEach( pageFile => {
      const contents = fs.readFileSync(pageFile.dir + '/' + pageFile.file, 'utf8');
      pages.push({
         name: pageFile.file.replace(/(\.md)$/, ''),
         absolutePath: pageFile.dir,
         contents: contents,
      })
   } )
   // Return site props
   const siteData = {
      sgMode: sgMode,
      repo: {
         relativePath: repoRelativePath,
         absolutePath: repoPath
      },
      sitePath: sitePath,
      buildPath: buildPath,
      blocks: blocks,
      pages: pages
   };
   return siteData;
}