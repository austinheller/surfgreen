import { encodeIgnores } from '../handlebars/handlebars-ignores.js'
import { marked } from 'marked';

/*
 * Get page meta + content from .md file contents
*/
export default function getPageData(props) {

   let pageRaw = props.contents;

   // Parse ignores
   pageRaw = encodeIgnores(pageRaw);
   
   // Split page contents to identify frontmatter vs. content
   let splitPage = pageRaw.split(/\n(~{2,})\n/g);
   if(splitPage.length < 2) {
      return {
         meta: {},
         contents: ''
      }
   }
   
   //
   // Get contents
   //
   let contents = splitPage[2];
   contents = contents.trim();
   const htmlContents = marked.parse(contents);

   //
   // Get page meta
   //
   const meta = {};

   //
   // Determine site root's relative location from page location
   //
   if( props.hasOwnProperty('relativePath') ) {
      let relativePath = props.relativePath;
      // Trim trailing slash from path
      relativePath = relativePath.replace(/\/$/g, '');
      // How many slashes do we have left?
      let relativeBase = '';
      const traversalsMatch = relativePath.match(/\//g);
      if( Array.isArray(traversalsMatch) ) {
         for( var i = 0; i < traversalsMatch.length; i++) {
            relativeBase = relativeBase + '../';
         }
         relativeBase = relativeBase.replace(/\/$/g, '');
      }
      else {
         relativeBase = '.';
      }
      meta.siteBase = relativeBase;
   }
   // Absolute site root
   if( props.hasOwnProperty('siteRoot') ) {
      meta.siteRoot = props.siteRoot;
   }

   // Page frontmatter
   let frontmatter = splitPage[0];
   const lines = frontmatter.match(/(.*)?(\s*):(\s*)(.*)?/g);
   lines.forEach( line => {
      var propName = '', propValue = '', inValue = false;
      const lineArray = line.split('');
      lineArray.forEach( char => {
         if( ! inValue && char !== ':' ) {
            propName += char;
         }
         else if(! inValue && char === ':') {
            inValue = true;
         }
         else if( inValue ) {
            propValue += char;
         }
      } )
      // Parse value to see if we need to change the type
      propValue = propValue.trim();
      const hasNonNumeric = propValue.match(/[^\d^.]/g);
      if(! hasNonNumeric) {
         propValue = parseInt(propValue);
      }
      // Add to meta
      meta[propName] = propValue;
   } )
   return {
      meta: meta,
      contents: htmlContents
   };
}