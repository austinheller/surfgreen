export default function parseStrings(props) {
   const meta = props.meta;
   const keys = Object.keys(meta);
   let newContent = props.contents;
   keys.forEach( key => {
      var regex = new RegExp('{{' + key + '}}', 'g');
      newContent = newContent.replace(regex, meta[key]);
   });
   // remove any unprocessed strings
   // NOTE: disabled because if you have a valid string inside a nested block, Surfgreen will strip it, which we don't want
   /*
   const unprocessedStringRegex = /{{(\w+\d*)?}}/g;
   const unprocessedStrings = newContent.match(unprocessedStringRegex);
   if( unprocessedStrings ) {
      newContent = newContent.replace(unprocessedStringRegex, '');
   }
   */
   return newContent;
}