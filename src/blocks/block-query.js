import getPageData from '../createPage/getPageData.js';
import parseBlocks from '../handlebars/handlebars-blocks.js';
import parseConditions from '../handlebars/handlebars-conditions.js';
import parseStrings from '../handlebars/handlebars-strings.js';

export default function runQueryBlock(queryData, siteData) {
   const allPages = siteData.pages;
   // Collect pages
   let pages = [];
   if (queryData.hasOwnProperty('for')) {
      allPages.forEach(page => {
         const pageData = getPageData({
            ...page
         });
         if (pageData.meta.hasOwnProperty('type')) {
            if (pageData.meta.type === queryData.for) {
               pages.push(pageData);
            }
         }
      });
   }
   else {
      pages = allPages;
   }
   // Sort
   if (queryData.hasOwnProperty('sortby') && typeof queryData['sortby'] === "string") {
      const sortby = queryData.sortby;
      const sort = queryData.hasOwnProperty('sort') ? queryData.sort : 'asc';
      let orderType = 'string';
      // test first item to derive sort type
      const testPage = pages[0];
      if (testPage.meta.hasOwnProperty(sortby)) {
         const prop = testPage.meta[sortby];
         if (typeof prop === "number") {
            orderType = 'number';
         }
         if (prop instanceof Date) {
            orderType = 'date';
         }
      }
      if (orderType === 'number' || orderType === 'date') {
         pages = pages.sort((a, b) => {
            return a.meta[sortby] - b.meta[sortby];
         });
         if( sort === 'desc' ) {
            pages = pages.reverse();
         }
      }
      else {
         pages = pages.sort((a, b) => {
            if( ! a.meta.hasOwnProperty(sortby) || typeof a.meta['sortby'] !== "string") {
               return 0;
            }
            const nameA = a.meta[sortby].toLowerCase(), nameB = b.meta[sortby].toLowerCase();
            if (nameA < nameB) {
               return -1;
            }
            if (nameA > nameB) {
               return 1;
            }
            return 0;
         });
         if( sort === 'desc' ) {
            pages = pages.reverse();
         }
      }
   }
   
   // Add to block
   let queryBlockOutput = '';
   const blockDefs = siteData.blocks;
   let blockDef = false;
   blockDefs.forEach( thisDef => {
      if( thisDef.name === queryData.block ) {
         blockDef = thisDef;
      }
   })
   pages.forEach( page => {
      let template = blockDef.contents;
      template = parseBlocks({
         contents: template,
         siteData: siteData
      });
      template = parseConditions({
         contents: template,
         meta: {
            content: page.contents,
            ...page.meta
         }
      });
      template = parseStrings({
         contents: template,
         meta: {
            content: page.contents,
            ...page.meta
         }
      });
      queryBlockOutput += template + '\n\n';
   } )
   return queryBlockOutput;
}