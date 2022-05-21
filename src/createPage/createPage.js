import * as fs from 'fs';
import getSiteData from './getSiteData.js';
import {encodeIgnores, decodeIgnores} from '../handlebars/handlebars-ignores.js'
import parseBlocks from '../handlebars/handlebars-blocks.js';
import parseConditions from '../handlebars/handlebars-conditions.js'
import parseStrings from '../handlebars/handlebars-strings.js';
import getPageData from './getPageData.js';

/*
 * Get a block's contents from the block definitions
*/
function getBlockContents(blockName, blocks) {
   if (!blockName) {
      console.error('Error: No block ID specified.');
      return false;
   }
   let block = false;
   blocks.forEach(thisBlock => {
      if (thisBlock.name === blockName) {
         block = thisBlock;
      }
   })
   if (block === false) {
      console.error(`Error: No block by the name of ${blockName} was found.`);
      return false;
   }
   return block;
}

function parseHandlebars(props, depth = 0) {
   let template = props.template;
   const siteData = props.siteData;
   const pageData = props.pageData;
   template = parseBlocks({
      contents: template,
      siteData: siteData
   });
   template = parseConditions({
      contents: template,
      meta: {
         content: pageData.contents,
         ...pageData.meta
      }
   });
   template = parseStrings({
      contents: template,
      meta: {
         content: pageData.contents,
         ...pageData.meta
      }
   });
   // Look for existing handlebars
   const handlebarsMatch = template.match(/{{(.*?)}}/g);
   if (handlebarsMatch) {
      depth++;
      if (depth > 20) {
         console.warn('Exceeded max handlebars parse depth of 20.');
         return template;
      }
      props.template = template;
      return parseHandlebars(props, depth);
   }
   return template;
}

export default async function createPage(pageName, filePath) {
   const siteData = await getSiteData();
   // Get page markdown
   let files = false, file = false, pageMarkdown = false;
   try {
      let exactMatch = false;
      files = fs.readdirSync(filePath);
      // first, see if we have an exact match
      files.forEach( dirFile => {
         const testName = dirFile.replace(/(\.md|\.markdown)$/g, '');
         if(pageName === testName) {
            exactMatch = true;
            file = dirFile;
         }
      } )
      // If not, look for an alt
      if( exactMatch === false && file === false ) {
         files.forEach(dirFile => {
            const regex = new RegExp('(' + pageName + '|index|main)\.(md|markdown)', 'g');
            const fileMatch = dirFile.match(regex);
            if (Array.isArray(fileMatch)) {
               file = fileMatch[0];
            }
         })
      }
      if (file !== false) {
         pageMarkdown = fs.readFileSync(`${filePath}/${file}`, 'utf8');
      }
   }
   catch {
      console.error('Directory not found');
   }
   // Create page HTML from markdown src
   const returnedPage = {
      html: '',
      meta: false
   };
   if (!pageMarkdown) {
      returnedPage.html = 'No page found';
   }
   else if (pageMarkdown === '') {
      returnedPage.html = 'Page is empty';
   }
   else {
      // Get relative path from absolute
      const fileRelRegex = new RegExp('^(' + siteData.sitePath + ')', 'g');
      let fileRelativePath = filePath.replace(fileRelRegex, '');
      if (fileRelativePath.charAt(0) !== '/') {
         fileRelativePath = '/' + fileRelativePath;
      }

      // Get base templates
      const blockDefs = siteData.blocks;
      const headerBlock = getBlockContents('header', blockDefs);
      const bodyBlock = getBlockContents('body', blockDefs);
      const footerBlock = getBlockContents('footer', blockDefs);

      // concatenate page, import all blocks, run block conditions, and replace block string variables
      let template = headerBlock.contents + '\n' + bodyBlock.contents + '\n' + footerBlock.contents;
      template = encodeIgnores(template);
      
      const pageData = getPageData({
         contents: pageMarkdown,
         relativePath: fileRelativePath,
         siteRoot: siteData.sitePath,
         blocks: blockDefs
      });

      let pageHTML = parseHandlebars({
         template: template,
         pageData: pageData,
         siteData: siteData
      });
      
      // decode ignored Surfgreen syntax
      pageHTML = decodeIgnores(pageHTML);

      returnedPage.html = pageHTML;
      returnedPage.meta = pageData.meta;
   }
   return returnedPage;
}