import { replaceBetween, trimHandlebarWhitespace } from './handlebars-utils.js';
import parseConditions from './handlebars-conditions.js';
import parseStrings from './handlebars-strings.js';
import runQueryBlock from '../blocks/block-query.js';

/*
 * Parse a single block
*/
function parseBlock(props) {
   const fragment = props.fragment;
   const blockProps = {
      _blockName: '',
   };
   // Identify name
   const blockName = fragment.replace(/{{\#(.+?)(\s(.*?))*}}/g, '$1');
   blockProps._blockName = blockName;
   // Identify arguments
   let argText = fragment.replace(/{{(.*?)(\s)/g, '');
   argText = argText.replace('}}', '');
   argText = argText.trim();
   argText += ' '; // Need this for the regex below
   // Find arguments with values
   const argValueRegex = /(\w+\d*_*-*)(\s*)=(\s*)("*\'*)(.*?)(\4)(\s)/g;
   const argsWithValues = argText.match(argValueRegex);
   if( argsWithValues ) {
    argsWithValues.forEach( arg => {
       const split = arg.split('=');
       const name = split[0].trim();
       let value = split[1].trim();
       // Trim quotes
       value = value.replace(/^("*'*[&quot;]*){1}(.*?)\1/g, '$2');
       // Save it
       blockProps[name] = value;
    } );  
   }
   // Find arguments with no values
   let argsNoValueText = argText.replace(argValueRegex, '');
   argsNoValueText += ' '; // need this for the regex below
   const argsNoValues = argsNoValueText.match(/(.*?)(\s)/g);
   if( argsNoValues ) {
      argsNoValues.forEach( arg => {
         const names = arg.split(' ');
         names.forEach(name => {
            name = name.trim();
            if(name.length > 0) {
               blockProps[name] = '';
            }
         })
      })
   }

   const siteData = props.siteData;
   const blockDefs = siteData.blocks;
   let blockDef = false, blockContents = false;

   //
   // Built-in blocks
   //
   switch( blockProps['_blockName'] ) {
      case 'query':
         blockContents = runQueryBlock(blockProps, siteData);
      break;
      default:
         blockContents = false;
   }

   //
   // Custom blocks
   //
   // Get block from block definitions
   if(blockContents === false) {
      blockDefs.forEach( thisDef => {
         if(blockProps['_blockName'] === thisDef.name) {
            blockDef = thisDef;
         }
      } )
      if( ! blockDef ) {
         console.error(`Error: No block by the name of ${blockProps._blockName} was found.`);
         return '';
      }
      else {
         blockContents = blockDef.contents;
      }
   }

   // Run conditions, replace variable strings
   blockContents = parseConditions({
      contents: blockContents,
      meta: blockProps,
      ignoreUndefined: true
   });
   blockContents = parseStrings({
      contents: blockContents,
      meta: blockProps
   });
   const newContents = replaceBetween(props.contents, props.start - 1, props.end + 1, blockContents);
   return newContents;
}


/*
 * Take a snippet of HTML content (whether an entire page or a single block), and parse all of the blocks {{key = value}} in it
 * Arguments: HTML content (string), block definitions (object)
 * Returns: HTML content (string)
 * */
export default function parseBlocks(props) {
   let contents = trimHandlebarWhitespace(props.contents);
   
   // First, find all blocks
   const blockMatches = [];
   let inHandlebars = false, inBlock = false, inCondition = false, startIndex = null, buffer = '';
   for(var i = 0; i < contents.length; i++) {
      var char = contents[i], prevChar = contents[i - 1];
      if( char === '{' && prevChar === '{' ) {
         buffer = prevChar;
         inHandlebars = true;
         startIndex = i;
      }
      if( char === '}' && prevChar === '}') {
         if( inBlock === true ) {
            blockMatches.push({
               fragment: buffer + char,
               start: startIndex,
               end: i
            })
         }
         inHandlebars = false;
         buffer = '';
         inBlock = false;
         startIndex = null;
      }
      if( inHandlebars === true ) {
         buffer += char;
      }
      if( buffer.includes('{{#') && ! inCondition ) {
         let ifTest = contents[i + 1] + contents[i + 2] + contents[i + 3];
         let elseTest = contents[i + 1] + contents[i + 2] + contents[i + 3] + contents[i + 4] + contents[i + 5];            
         if( ifTest.trim() === "if" || elseTest.trim() === "else" ) {
            inCondition = true;
         }
         else {
            inBlock = true;
         }
      }
   }
   
   // Then, keep running function until all blocks have been imported
   const siteData = props.siteData;
   if( blockMatches.length > 0 ) {
      const parseProps = {
         contents: contents,
         siteData: siteData,
         ...blockMatches[0]
      };
      const parsedContents = parseBlock(parseProps);
      return parseBlocks({
         contents: parsedContents,
         siteData: siteData
      });
   }
   else {
      return contents;
   }
   
}