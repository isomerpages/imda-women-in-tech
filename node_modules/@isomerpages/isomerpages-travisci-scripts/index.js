const axios = require('axios');
const testSuiteHandler = require('./test_suite/testSuiteHandler.js');
const { sendSlackMessage } = require('./sendSlack');
const { runLightHouse } = require('./test_suite/lighthouseHandler');

const {
  KEYCDN_API_KEY, KEYCDN_ZONE_ID, NETLIFY_SITE_ID, NETLIFY_ACCESS_TOKEN,
} = process.env;

async function checkDeployState() {
  try {
    console.log('Checking if site has been deployed successfully');
    const resp = await axios.get(`https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/deploys?access_token=${NETLIFY_ACCESS_TOKEN}`);

    const latestDeployStatus = resp.data[0].state;
    if (latestDeployStatus === 'ready') {
      console.log(`Site ${NETLIFY_SITE_ID} has been successfully deployed`);
      return true;
    }
    console.log(`Site ${NETLIFY_SITE_ID} has not been deployed`);
    return false;
  } catch (err) {
    console.log(err);
    return false;
  }
}

async function purgeCache() {
  try {
    console.log('Purging cache');
    const resp = await axios.get(`https://${KEYCDN_API_KEY}@api.keycdn.com/zones/purge/${KEYCDN_ZONE_ID}.json`);
    if (resp.status === 200) {
      console.log(`CDN cache has been successfully purged for KEYCDN Zone ID:${KEYCDN_ZONE_ID}`);
      return true;
    }
    console.log(`Failed to purge CDN cache for KEYCDN Zone ID:${KEYCDN_ZONE_ID}`);
    return false;
  } catch (err) {
    console.log(err);
    return false;
  }
}

function timeOutAlert(sendSlack) {
  const errorMessage = 'The latest build did not deploy successfully for 10 minutes! The build most likely has failed.';
  console.log(errorMessage);

  if (sendSlack) {
    sendSlackMessage(errorMessage);
  }
}

// purgeCacheIfDeployed runs when code is successfully merged to the master branch.
// The function runs a while loop to check if the Netlify website has been successfully deployed.
// If so, the function breaks out of the loop and makes an API call to purge the CDN cache.

async function purgeCacheIfDeployed(sendSlack = true) {
  try {
    console.log('In purgeCacheIfDeployed');
    let deploySuccess = false;

    // Timeout if build has not succeeded for 10min
    const timeOut = setTimeout(timeOutAlert, 600000, sendSlack);

    while (!deploySuccess) {
      // eslint-disable-next-line no-await-in-loop
      deploySuccess = await checkDeployState();
    }

    clearTimeout(timeOut);

    let purgeSuccess = false;
    while (!purgeSuccess) {
      // eslint-disable-next-line no-await-in-loop
      purgeSuccess = await purgeCache();
    }

    if (process.env.PROD_URL) {
      // Launch lighthouse tests after 15 seconds to give
      // the CDN some time to fully cache the content
      console.log('CDN cache has been purged. Lighthouse tests will begin in 15 seconds.');
      setTimeout(runLightHouse, 15000, process.env.PROD_URL, sendSlack);
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  runAll(sendSlack = true) {
    purgeCacheIfDeployed(sendSlack);
    testSuiteHandler.startTests(sendSlack);
    // other stuff to be handled by TravisCI as needed
  },
  testsOnly(sendSlack = true) {
    testSuiteHandler.startTests(sendSlack);
  },
  purgeCacheOnly: purgeCacheIfDeployed,
};
