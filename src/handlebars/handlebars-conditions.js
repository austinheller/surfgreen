import { replaceBetween, trimHandlebarWhitespace } from './handlebars-utils.js';

/*
 * Take a single conditional and evaluate it.
 * Note that it doesn't matter if there's a nested conditional inside of this one — it will turn up on a subsequent pass.
 */
function parseCondition(props) {
	const fragment = trimHandlebarWhitespace(props.fragment);
	//
	// First, look for variable name, operator, and value
	//
	let varName = '';
	let varValue = '';
	let operator = '';
	let checkingName = false;
	let checkingValue = false;
	let checkingOperator = false;
	let inHandlebar = false;
	let buffer = '';
	let depth = 0;

	for (var i = 0; i < fragment.length; i++) {
		var char = fragment[i];
		var prevIndex = i - 1;
		var nextIndex = i + 1;
		var secondNextIndex = i + 2;
		var prevChar = fragment[prevIndex];
		var nextChar = fragment[nextIndex];
		var secondNextChar = fragment[secondNextIndex];

		if (char === '{' && prevChar === '{' && nextChar === '#') {
			inHandlebar = true;
			if (secondNextChar === 'i') {
				depth++;
			}
		}

		// See if we're in the initial if statement
		if (inHandlebar === true && depth === 1) {
			buffer += char;
			if (buffer.includes('{#if ')) {
				buffer = '';
				checkingName = true;
			}
			if (checkingName === true) {
				if (buffer.trim().length > 0) {
					if (char === ' ') {
						varName = buffer;
						checkingName = false;
						checkingOperator = true;
						buffer = '';
					} else if (char === '}' && nextChar === '}') {
						varName = buffer.replace(/}$/g, '');
						checkingName = false;
						buffer = '';
					}
				}
			}
			if (checkingOperator === true) {
				if (buffer.trim().length > 0 && char !== '!' && char !== '=') {
					operator = buffer;
					checkingOperator = false;
					checkingValue = true;
					buffer = '';
				}
			}
			if (checkingValue === true) {
				if (buffer.trim().length > 0 && char === '}' && nextChar === '}') {
					varValue = buffer.replace('}', '');
					checkingValue = false;
					buffer = '';
				}
			}
		}

		if (char === '}' && prevChar === '}') {
			inHandlebar = false;
		}

		if (char === '{' && prevChar === '{' && nextChar === '/') {
			depth--;
		}
	}

	varName = varName.trim();
	varValue = varValue.trim();
	operator = operator.trim();

	//
	// Next, get the content if condition is true, or if false (ELSE)
	//
	let contentToEvaluate = fragment.trim();
	const ifOpenings = fragment.match(/{{#if (.*?)}}/g);
	const firstOpening = ifOpenings[0];
	contentToEvaluate = contentToEvaluate.replace(firstOpening, '');
	contentToEvaluate = contentToEvaluate.replace(/{{\/if}}$/g, '');
	contentToEvaluate = contentToEvaluate.trim();

	//
	// Determine if the condition has an ELSE statement
	//
	let contentIfTrue = '';
	let contentIfFalse = '';
	for (var a = 0; a < contentToEvaluate.length; a++) {
		var prevChar = contentToEvaluate[a - 1];
		var char = contentToEvaluate[a];
		var nextChar1 = contentToEvaluate[a + 1];
		var nextChar2 = contentToEvaluate[a + 2];
		var nextChar3 = contentToEvaluate[a + 3];
		if (prevChar === '{' && char === '{' && nextChar1 === '#' && nextChar2 === 'e' && nextChar3 === 'l') {
			contentIfTrue = contentToEvaluate.substring(0, a - 1);
			contentIfFalse = contentToEvaluate.substring(a + 8, contentToEvaluate.length);
			break;
		}
		if (a === contentToEvaluate.length - 1 && contentIfFalse === '') {
			contentIfTrue = contentToEvaluate;
		}
	}

	//
	// Figure out if condition is true, false, or null (couldn't run and was ignored)
	//
	let newContents = props.contents;
	const result = evaluateCondition({
		name: varName,
		value: varValue,
		operator: operator,
		ignoreUndefined: props.ignoreUndefined,
		meta: props.meta,
	});
	if (result === true || result === false) {
		const contentToUse = result === true ? contentIfTrue : contentIfFalse;
		newContents = replaceBetween(props.contents, props.start, props.end + 1, contentToUse.trim());
	}
	return newContents;
}

/*
 * Figure out if the condition matches the stored meta value
 * Returns a simple TRUE or FALSE bool
 */
function evaluateCondition(props) {
	const meta = props.meta;
	const testName = props.name;
	let result; // default to false
	// Determine equivalency mode (equals, not equals, exists)
	let mode;
	const operator = props.operator;
	if (operator.trim() === '') {
		mode = 'EXISTS';
	} else {
		if (props.operator.includes('!')) {
			mode = 'NOT_EQUALS';
		} else {
			mode = 'EQUALS';
		}
	}
	// Strip syntactical quotes from test value
	let testValue = props.value;
	testValue = testValue.replace(/^[\'\"]/, '');
	testValue = testValue.replace(/[\'\"]$/, '');
	// Does the variable exist?
	if (! meta.hasOwnProperty(testName) ) {
		if( mode === 'NOT_EQUALS' ) { // consider non-existence equivalent to not-equals
			result = true;
		} else if (props.ignoreUndefined === true) {
			result = null;
		} else {
			result = false;
		}
	} else { // Evaluate
		const storedValue = meta[testName];
		switch (mode) {
			case 'EQUALS':
				if (testValue === storedValue) {
					result = true;
				} else {
					result = false;
				}
				break;
			case 'NOT_EQUALS':
				if (testValue !== storedValue) {
					result = true;
				} else {
					result = false;
				}
				break;
			case 'EXISTS':
				result = true;
				break;
			default:
				result = false;
		}
	}
	/*
	console.log(
		'Condition parsed',
		JSON.stringify({
			testName: testName,
			testValue: testValue,
			storedValue: typeof storedValue !== 'undefined' ? storedValue : null,
			operator: operator,
			mode: mode,
			result: result,
		})
	);
	*/
	return result;
}

/*
 * Find all conditionals in the contents of an .md file, and return them as an array
 */
export default function parseConditions(props) {
	// Set initial iteration if it isn't specified
	if (!props.hasOwnProperty('iteration')) {
		props.iteration = 1;
	}

	// Set default for ignoreUndefined (behavior for conditions that contain undefined variables)
	if (!props.hasOwnProperty('ignoreUndefined')) {
		props.ignoreUndefined = false;
	}

	let contents = trimHandlebarWhitespace(props.contents);

	//
	// First, find all conditions
	//
	let conditions = [];
	let startIndex = null;
	let endIndex = null;
	let depth = 0;

	for (var i = 0; i < contents.length; i++) {
		var char = contents[i];
		var prevIndex = i - 1;
		var nextIndex = i + 1;
		var secondNextIndex = i + 2;
		var prevChar = contents[prevIndex];
		var nextChar = contents[nextIndex];
		var secondNextChar = contents[secondNextIndex];

		if (char === '{' && prevChar === '{' && nextChar === '#' && secondNextChar === 'i') {
			depth++;
			if (depth === 1) {
				startIndex = prevIndex;
			}
		}

		if (char === '{' && prevChar === '{' && nextChar === '/') {
			depth--;
			if (depth === 0) {
				endIndex = i + 5;
				const condition = {
					start: startIndex,
					end: endIndex,
					fragment: contents.substring(startIndex, endIndex + 1),
				};
				conditions.push(condition);
				// Reset vars
				startIndex = null;
				endIndex = null;
			}
		}
	}

	if (conditions.length > 0) {
		const conditionToParse = conditions[0];
		const parsedContents = parseCondition({
			contents: contents,
			meta: props.meta,
			ignoreUndefined: props.ignoreUndefined,
			...conditionToParse,
		});
		if (props.iteration > 7) {
			if (props.ignoreUndefined !== true) {
				console.warn('Warning: Condition parsing exceeded maximum depth of 7. Some conditions were ignored.');
			}
			return parsedContents;
		} else {
			return parseConditions({
				contents: parsedContents,
				meta: props.meta,
				ignoreUndefined: props.ignoreUndefined,
				iteration: props.iteration + 1,
			});
		}
	} else {
		return contents;
	}
}
