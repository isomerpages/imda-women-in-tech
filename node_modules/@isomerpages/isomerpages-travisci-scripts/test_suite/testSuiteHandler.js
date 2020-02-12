// iterates through the project directory and runs
// the respective shell commands for each file

// full name of files/folders where checks are to be skipped
const ignores = ['readme.md', 'node_modules', '_site'];

// should hidden files and directories (i.e. names
// beginning with '.') be checked?
const checkHiddens = false;

const fs = require('fs');
const markdownHandler = require('./markdownHandler.js');
const yamlHandler = require('./yamlHandler.js');
const { runLightHouse } = require('./lighthouseHandler');
const { sendSlackMessage } = require('../sendSlack');

let errorMessage = '';
let fileCount = 0;
let errorCount = 0;
let fatalErrorCount = 0;

let permalinks = [];

// iterates through the root directory of the repo and
// runs the appropriate check for the file type
function readDirectory(path = '.') {
  const files = fs.readdirSync(path, { withFileTypes: true });

  files.forEach((file) => {
    if (!file.name) {
      console.log(file);
      return;
    }
    if (!checkHiddens && file.name.startsWith('.')) return;
    for (let i = 0, len = ignores.length; i < len; i += 1) {
      if (file.name.toLowerCase() === ignores[i]) return;
    }
    const fullPath = `${path}/${file.name}`;
    if (file.isDirectory()) {
      readDirectory(fullPath);
    } else if (file.isFile()) {
      // Markdown file checks MUST be synchronous because of the permalink checks
      if (file.name.endsWith('.md')) {
        fileCount += 1;
        const checkResult = markdownHandler.runTest(fullPath, permalinks);
        if (checkResult.hasError) {
          errorCount += 1;
          errorMessage += checkResult.errorMessage;
        }
        if (checkResult.hasFatalError) fatalErrorCount += 1;
        permalinks = permalinks.concat(checkResult.permalinks);
      }

      if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        fileCount += 1;
        const checkResult = yamlHandler.runTest(fullPath);
        if (checkResult.hasError) {
          errorCount += 1;
          errorMessage += checkResult.errorMessage;
        }
        if (checkResult.hasFatalError) fatalErrorCount += 1;
      }
    }
  });
}

module.exports = {
  // starts the test suite
  // returns the string to be sent to Slack should there be errors
  // returns false otherwise (i.e. all files are good)
  startTests(sendSlack) {
    readDirectory();
    if (process.env.STAGING_URL) runLightHouse(process.env.STAGING_URL, sendSlack);
    console.log(`Number of files checked: ${fileCount}`);
    console.log(`Number of files with errors: ${errorCount}`);
    let errorOutput = '';
    if (errorCount === 1) {
      errorOutput = `Hey, this file doesn't look right:${errorMessage}`;
    } else if (errorCount > 1) {
      errorOutput = `Hey, I've found errors in these ${errorCount} files:${errorMessage}`;
    }
    if (errorCount > 0) {
      console.log(errorOutput);
      if (sendSlack) sendSlackMessage(errorOutput);
      if (fatalErrorCount > 0) {
        // Fail the build here separately from Slack to avoid a case where this program
        // ceases execution before a Slack message is sent because we threw an error
        sendSlackMessage(`The following errors were found in the repo for ${process.env.PROD_URL}:\n${errorOutput}`, true);
        console.error('Fatal error(s) were found! See above for details. Fatal errors must be rectified before merging to master is allowed.');
        process.exitCode = 1;
      }
    }

    // reset variables we previously used
    errorMessage = '';
    fileCount = 0;
    errorCount = 0;
    permalinks = [];
  },
};
