// runs the test for /_data/navigation.yml

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
    let yamlData;
    try {
      yamlData = yaml.safeLoad(data);
    } catch (e) {
      // yaml.safeload() throws an exception if there are YAML syntax errors,
      // e.g. 2 attributes with the same name
      // we will just output the syntax error details and quit checking
      console.error(e);
      returnObj.errorMessage += errorHeader + e.message;
      returnObj.hasError = true;
      return returnObj; // no point continuing if the data isn't properly loaded
    }

    // for safety we check the file name again
    if (filePath.endsWith('navigation.yml') || filePath.endsWith('navigation.yaml')) {
      for (let i = 0; i < yamlData.length; i += 1) {
        let numSuffix = 'th';
        if ((i + 1) % 10 === 1) numSuffix = 'st';
        if ((i + 1) % 10 === 2) numSuffix = 'nd';
        if ((i + 1) % 10 === 3) numSuffix = 'rd';

        if (!Object.prototype.hasOwnProperty.call(yamlData[i], 'title')) {
          returnObj.errorMessage += `${errorHeader}is missing a \`title: \` field in the *${i + 1}${numSuffix} set* of URLs`;
          returnObj.hasError = true;
        }
        if (!Object.prototype.hasOwnProperty.call(yamlData[i], 'url') && !Object.prototype.hasOwnProperty.call(yamlData[i], 'sub-links')) { // no url is okay if it is only a collection of sublinks
          returnObj.errorMessage += `${errorHeader}is missing a \`url: \` field in the *${i + 1}${numSuffix} set* of URLs`;
          returnObj.hasError = true;
        }
        if (Object.prototype.hasOwnProperty.call(yamlData[i], 'sub-links')) {
          for (let j = 0; j < yamlData[i]['sub-links'].length; j += 1) {
            if (!Object.prototype.hasOwnProperty.call(yamlData[i]['sub-links'][j], 'title')) {
              returnObj.errorMessage += `${errorHeader}is missing a \`title: \` field in the \`sub-links:\` section of the *${i + 1}${numSuffix} set* of URLs`;
              returnObj.hasError = true;
            }
            if (!Object.prototype.hasOwnProperty.call(yamlData[i]['sub-links'][j], 'url')) {
              returnObj.errorMessage += `${errorHeader}is missing a \`url: \` field in the \`sub-links:\` section of the *${i + 1}${numSuffix} set* of URLs`;
              returnObj.hasError = true;
            }
          }
        }
      }
    }
    return returnObj;
  },
};
