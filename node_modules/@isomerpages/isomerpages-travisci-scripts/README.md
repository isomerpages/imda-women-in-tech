# Isomer TravisCI Scripts

This package contains a set of scripts that facilitates the production and deployment of [Isomer](https://isomer.gov.sg/) pages using TravisCI.

Specifically, it checks for syntax errors in the Markdown and YAML files used by Isomer, and sends details of the errors to a designated Slack channel using a [webhook](https://api.slack.com/incoming-webhooks). On commit or merge to the master branch (i.e. to production), it also waits for the [Netlify](https://app.netlify.com/) build process to complete and purges the KeyCDN cache to ensure that all visitors will receive the latest copy of the site.

## Isomer Integration

First, install [this package](https://www.npmjs.com/package/@isomerpages/isomerpages-travisci-scripts) as a dependency:

```bash
npm install @isomerpages/isomerpages-travisci-scripts
```

Follow [Slack's instructions](https://api.slack.com/incoming-webhooks) for creating an app with a webhook for the channel you want the script to send error messages to. Add this webhook address to your TravisCI environment as the `SLACK_URI` environmental variable. Add the `SLACK_ALERT_URI`, `KEYCDN_API_KEY`, `KEYCDN_ZONE_ID`, `NETLIFY_SITE_ID`, `NETLIFY_ACCESS_TOKEN`, `STAGING_URL`, and `PROD_URL` environmental variables as well.

**Make sure all secret key environmental variables are hidden!**

Create the file `.travis.yml` in the root directory of your site's repository:

```yaml
#.travis.yml
language: node_js
node_js:
  - "node"
git:
  depth: 3
script: node travis-script.js
cache: npm
```

Create the file `travis-script.js` in the root directory of your site's repository:

```js
//travis-script.js
const travisScript = require("@isomerpages/isomerpages-travisci-scripts");
const travisBranch = process.env.TRAVIS_BRANCH;

if(travisBranch == "master") {
    travisScript.runAll();
}
else {
    travisScript.testsOnly();
}
```

Feel free to customise `travis-script.js` as you please. See below for a more complete documentation of the methods in the package.

This is all you need to get started! Give yourself a pat on the back, sit back, and let Slack handle the rest!

## Methods

### runAll

`runAll()` is a method that optionally takes in the boolean parameter `sendSlack`, which defaults to `true` if left unspecified.

If `sendSlack` is set to `false`, the error output will not be sent to Slack. However, you can continue to see the output generated in the TravisCI build log.

`runAll()` will run the Isomer syntax checker, the CDN purger, and the Lighthouse scan for the production site. It should be run when commits/merges are made in the `master` branch.

It does not return any value - all output is sent to standard output and Slack (if enabled, and does not include any CDN purging errors).

### testsOnly

`testsOnly()` is a method that optionally takes in the boolean parameter `sendSlack`, which defaults to `true` if left unspecified.

If `sendSlack` is set to `false`, the error output will not be sent to Slack. However, you can continue to see the output generated in the TravisCI build log.

As its name implies, `testsOnly()` will only run the Isomer syntax checker and the Lighthouse scan for the staging site. It should be run for commits on staging branches.

Running `testsOnly(false)` is also a great way to preview the error output locally to fix any preexisting issues before deploying it on a site's repository. You don't want to suddenly send a barrage of error messages to the user's Slack channel!

It does not return any value - all output is sent to standard output and Slack (if enabled).

### purgeCacheOnly

`purgeCacheOnly()` is a method that optionally takes in the boolean parameter `sendSlack`, which defaults to `true` if left unspecified. It only runs the CDN cache purger, skipping 
the Isomer syntax checker.

It does not return any value. Errors during execution, if any, are sent to standard output only. However, if the Netlify build timeouts (i.e. build is not successful after 10 
minutes), an alert will be sent to Slack if `sendSlack` is `true`.
