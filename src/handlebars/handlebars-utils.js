/*
 * Replace contents of a string between two indices
*/
function replaceBetween(origin, startIndex, endIndex, insertion) {
   return origin.substring(0, startIndex) + insertion + origin.substring(endIndex);
}


/*
 * Trim whitespace from handlebars
*/
function trimHandlebarWhitespace(contents) {
   if (typeof contents === 'string') {
      let newContents = contents;
      // Trim whitespace from opening and closing braces
      newContents = newContents.replace(/{{(\s*)/g, '{{');
      newContents = newContents.replace(/(\s*)}}/g, '}}');
      // Enforce consistent whitespace around operators
      const handlebarsWithOperators = newContents.match(/{{(.*?)(\s*)(!*=+)(\s*)(.*?)}}/g, true);
      if (handlebarsWithOperators) {
         handlebarsWithOperators.forEach(handlebar => {
            let newHandlebar = handlebar.replace(/(\s*)(!*=+)(\s*)/g, ' $2 ');
            newContents = newContents.replace(handlebar, newHandlebar);
         });
      }
      // Enforce consistent whitespace between "if" and variable names
      newContents = newContents.replace(/{{#if(\s+)(.*?)}}/g, '{{#if $2}}');
      // Trim leading or trailing whitespace
      newContents = newContents.trim();
      return newContents;
   }
   else {
      return contents;
   }
}

export { replaceBetween, trimHandlebarWhitespace };