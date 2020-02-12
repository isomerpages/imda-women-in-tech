// for files that we do not have a test for we will just try
// loading the yaml file and see if there are any syntax errors

const yaml = require('js-yaml');

module.exports = {
  runTest(data, filePath) {
    const returnObj = {
      hasError: false,
      hasFatalError: false,
      errorMessage: '',
    };

    const errorHeader = `\n\`${filePath.substring(1)}\` `;

    // turns the yaml string into a javascript object
    try {
      yaml.safeLoad(data);
    } catch (e) {
      // yaml.safeload() throws an exception if there are YAML syntax errors,
      // e.g. 2 attributes with the same name
      // we will just output the syntax error details and quit checking
      console.error(e);
      returnObj.errorMessage += errorHeader + e.message;
      returnObj.hasError = true;
      return returnObj; // no point continuing if the data isn't properly loaded
    }
    return returnObj;
  },
};
