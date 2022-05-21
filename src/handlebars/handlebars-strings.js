export default function parseStrings(props) {
   const meta = props.meta;
   const keys = Object.keys(meta);
   let newContent = props.contents;
   keys.forEach( key => {
      var regex = new RegExp('{{' + key + '}}', 'g');
      newContent = newContent.replace(regex, meta[key]);
   });
   // remove any unprocessed strings
   const unprocessedStringRegex = /{{(\w+\d*)?}}/g;
   if( newContent.match(unprocessedStringRegex) ) {
      newContent = newContent.replace(unprocessedStringRegex, '');
   }
   return newContent;
}