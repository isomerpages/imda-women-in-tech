const fs = require('fs');
const checkNavigation = require('./yaml/checkNavigation.js');
const checkHomepage = require('./yaml/checkHomepage.js');
const checkYamlGeneric = require('./yaml/checkYamlGeneric.js');

module.exports = {
  runTest(filePath) {
    const data = fs.readFileSync(filePath, 'utf-8');

    // this is where we run our yaml tests
    // As each yaml file is a singleton, they each have their own
    // structure, and hence we are forced to write a singleton test
    // for each file. As a result, it does not cover all yaml files
    // out there, and it is not be worth the effort to test for each
    // file as well taking into account that the yaml files are
    // edited much less frequently

    let returnObj;

    if (filePath.toLowerCase().endsWith('navigation.yml') || filePath.toLowerCase().endsWith('navigation.yaml')) {
      returnObj = checkNavigation.runTest(data, filePath);
    } else if (filePath.toLowerCase().endsWith('homepage.yml' || filePath.toLowerCase().endsWith('homepage.yaml'))) {
      returnObj = checkHomepage.runTest(data, filePath);
    } else { // run the generic syntax test
      returnObj = checkYamlGeneric.runTest(data, filePath);
    }
    return returnObj;
  },
};
