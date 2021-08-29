const { red } = require("kleur");

/**
 * In the event that the user is passing either a JSON
 * object of headers alone or with an array of individual header
 * (key/value) pairs, this object will take prescedence.
 * This utility function will attempt to accept the incoming JSON object
 * and parse it into a map with the keys and values both being strings.
 * If an error is thrown when parsing the data, we will return an empty object.
 *
 * @param {string} headersJSON String formatted JSON object of key/value pairs
 * for header values
 * @return {Record<string, string>} Parsed JSON object from headers string passed into the function.
 */
function getCLISchemaHeadersJSON(headersJSON) {
  let headerMap = {};

  // Parse the incoming headers from the CLI as a JSON string
  if (headersJSON != null) {
    try {
      headerMap = JSON.parse(headersJSON);
    } catch (err) {
      console.error(red("Cannot succesfully parse the incoming JSON header object from the CLI"));
    }
  }

  return headerMap;
}

/**
 * Accept incoming array of string headers sent from the CLI. Each of these headers
 * can be inferred and parsed from the CLI flag (--header or -x) and allows for multiple
 * instances of the flag to be used, due to setting the isMultiple flag on in the meow library
 * implementation.
 *
 * It is imperative that all header strings follow the format of (key: value). We will strip the colon and split
 * on the space to separate the two. In the event that the user did not supply this format,
 * we will log the error and continue on down the header chain.
 *
 * @param {Array<string>} headers Headers from the multiple headers flag passed in the CLI
 * @return {Record<string, string>} Parsed headers into key/value map where both values are strings
 */
function getCLIHeadersFromArray(headers) {
  // Final header map
  let headerMap = {};

  // Check to ensure the user is passing header values
  if (!Array.isArray(headers) || !headers) {
    return headerMap;
  }

  headers.forEach((header) => {
    // Checks word chars with a colon, space and a following word (has to be reinitialized)
    const headerParsingRegex = /(\w+)(\:)\s((\w+)[\-|\:]?.+)/gi;

    const headersMatch = headerParsingRegex.exec(header);

    // Abstract headers from regex groups and assign value to string
    if (headersMatch) {
      const { 1: key, 3: value } = headersMatch;
      headerMap[key] = value;
    }
  });

  return headerMap;
}

// All Exports
exports.getCLISchemaHeadersJSON = getCLISchemaHeadersJSON;
exports.getCLIHeadersFromArray = getCLIHeadersFromArray;
