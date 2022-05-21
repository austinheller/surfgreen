function encodeIgnores(content) {
   let newContent = content;
   // Get all ignore blocks
   let ignoreBlocks = [], buffer = '', inIgnore = false;
   for(var i = 0; i < newContent.length; i++) {
      let char = newContent[i], charPlus1 = newContent[i + 1], charPlus2 = newContent[i + 2];
      if( char === '{' && charPlus1 === '{' && charPlus2 === '!' ) {
         inIgnore = true;
      }
      if( char === '!' && charPlus1 === '}' && charPlus2 === '}' ) {
         const ignoreBlock = buffer + char + charPlus1 + charPlus2;
         ignoreBlocks.push( ignoreBlock );
         inIgnore = false;
         buffer = '';
      }
      if( inIgnore === true ) {
         buffer += char;
      }
   }
  // Encode Surfgreen syntax within ignore blocks 
   ignoreBlocks.forEach( ignoreBlock => {
      let newBlock = ignoreBlock;
      newBlock = newBlock.replace('{{!', '');
      newBlock = newBlock.replace('!}}', '');
      newBlock = newBlock.replace(/({{)/g, '{!{!PARSE_IGNORE');
      newBlock = newBlock.replace(/}}/g, '!}!}');
      newBlock = newBlock.replace(/(~{2,3})/g, '{!{!FRONTMATTER_PARSE_IGNORE~}!}');
      newContent = newContent.replace(ignoreBlock, newBlock);
   });
   
   return newContent;
}

function decodeIgnores(content) {
   let newContent = content;
   newContent = newContent.replace(/{!{!PARSE_IGNORE/g, '{{');
   newContent = newContent.replace(/!}!}/g, '}}');
   newContent = newContent.replace(/{!{!FRONTMATTER_PARSE_IGNORE~}!}/g, '~~~');
   return newContent;
}

export {encodeIgnores, decodeIgnores};