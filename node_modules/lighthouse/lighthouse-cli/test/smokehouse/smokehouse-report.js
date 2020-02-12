/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
/* eslint-disable no-console */
'use strict';

const log = require('lighthouse-logger');

const VERBOSE = Boolean(process.env.LH_SMOKE_VERBOSE);
const NUMBER_REGEXP = /(?:\d|\.)+/.source;
const OPS_REGEXP = /<=?|>=?|\+\/-/.source;
// An optional number, optional whitespace, an operator, optional whitespace, a number.
const NUMERICAL_EXPECTATION_REGEXP =
  new RegExp(`^(${NUMBER_REGEXP})?\\s*(${OPS_REGEXP})\\s*(${NUMBER_REGEXP})$`);

/**
 * Checks if the actual value matches the expectation. Does not recursively search. This supports
 *    - Greater than/less than operators, e.g. "<100", ">90"
 *    - Regular expressions
 *    - Strict equality
 *
 * @param {*} actual
 * @param {*} expected
 * @return {boolean}
 */
function matchesExpectation(actual, expected) {
  if (typeof actual === 'number' && NUMERICAL_EXPECTATION_REGEXP.test(expected)) {
    const parts = expected.match(NUMERICAL_EXPECTATION_REGEXP);
    const [, prefixNumber, operator, postfixNumber] = parts;
    switch (operator) {
      case '>':
        return actual > postfixNumber;
      case '>=':
        return actual >= postfixNumber;
      case '<':
        return actual < postfixNumber;
      case '<=':
        return actual <= postfixNumber;
      case '+/-':
        return Math.abs(actual - prefixNumber) <= postfixNumber;
      default:
        throw new Error(`unexpected operator ${operator}`);
    }
  } else if (typeof actual === 'string' && expected instanceof RegExp && expected.test(actual)) {
    return true;
  } else {
    // Strict equality check, plus NaN equivalence.
    return Object.is(actual, expected);
  }
}

/**
 * Walk down expected result, comparing to actual result. If a difference is found,
 * the path to the difference is returned, along with the expected primitive value
 * and the value actually found at that location. If no difference is found, returns
 * null.
 *
 * Only checks own enumerable properties, not object prototypes, and will loop
 * until the stack is exhausted, so works best with simple objects (e.g. parsed JSON).
 * @param {string} path
 * @param {*} actual
 * @param {*} expected
 * @return {(Smokehouse.Difference|null)}
 */
function findDifference(path, actual, expected) {
  if (matchesExpectation(actual, expected)) {
    return null;
  }

  // If they aren't both an object we can't recurse further, so this is the difference.
  if (actual === null || expected === null || typeof actual !== 'object' ||
      typeof expected !== 'object' || expected instanceof RegExp) {
    return {
      path,
      actual,
      expected,
    };
  }

  // We only care that all expected's own properties are on actual (and not the other way around).
  for (const key of Object.keys(expected)) {
    // Bracket numbers, but property names requiring quotes will still be unquoted.
    const keyAccessor = /^\d+$/.test(key) ? `[${key}]` : `.${key}`;
    const keyPath = path + keyAccessor;
    const expectedValue = expected[key];

    if (!(key in actual)) {
      return {path: keyPath, actual: undefined, expected: expectedValue};
    }

    const actualValue = actual[key];
    const subDifference = findDifference(keyPath, actualValue, expectedValue);

    // Break on first difference found.
    if (subDifference) {
      return subDifference;
    }
  }

  return null;
}

/**
 * Collate results into comparisons of actual and expected scores on each audit.
 * @param {Smokehouse.ExpectedLHR} actual
 * @param {Smokehouse.ExpectedLHR} expected
 * @return {Smokehouse.LHRComparison}
 */
function collateResults(actual, expected) {
  const auditNames = Object.keys(expected.audits);
  const collatedAudits = auditNames.map(auditName => {
    const actualResult = actual.audits[auditName];
    if (!actualResult) {
      throw new Error(`Config did not trigger run of expected audit ${auditName}`);
    }

    const expectedResult = expected.audits[auditName];
    const diff = findDifference(auditName, actualResult, expectedResult);

    return {
      category: auditName,
      actual: actualResult,
      expected: expectedResult,
      equal: !diff,
      diff,
    };
  });

  return {
    audits: collatedAudits,
    errorCode: {
      category: 'error code',
      actual: actual.errorCode,
      expected: expected.errorCode,
      equal: actual.errorCode === expected.errorCode,
    },
    finalUrl: {
      category: 'final url',
      actual: actual.finalUrl,
      expected: expected.finalUrl,
      equal: actual.finalUrl === expected.finalUrl,
    },
  };
}

/**
 * @param {unknown} obj
 */
function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

/**
 * Log the result of an assertion of actual and expected results.
 * @param {Smokehouse.Comparison} assertion
 */
function reportAssertion(assertion) {
  // @ts-ignore - this doesn't exist now but could one day, so try not to break the future
  const _toJSON = RegExp.prototype.toJSON;
  // @ts-ignore
  // eslint-disable-next-line no-extend-native
  RegExp.prototype.toJSON = RegExp.prototype.toString;

  if (assertion.equal) {
    if (isPlainObject(assertion.actual)) {
      console.log(`  ${log.greenify(log.tick)} ${assertion.category}`);
    } else {
      console.log(`  ${log.greenify(log.tick)} ${assertion.category}: ` +
          log.greenify(assertion.actual));
    }
  } else {
    if (assertion.diff) {
      const diff = assertion.diff;
      const fullActual = JSON.stringify(assertion.actual, null, 2).replace(/\n/g, '\n      ');
      const msg = `
  ${log.redify(log.cross)} difference at ${log.bold}${diff.path}${log.reset}
              expected: ${JSON.stringify(diff.expected)}
                 found: ${JSON.stringify(diff.actual)}

          found result:
      ${log.redify(fullActual)}
`;
      console.log(msg);
    } else {
      console.log(`  ${log.redify(log.cross)} ${assertion.category}:
              expected: ${JSON.stringify(assertion.expected)}
                 found: ${JSON.stringify(assertion.actual)}
`);
    }
  }

  // @ts-ignore
  // eslint-disable-next-line no-extend-native
  RegExp.prototype.toJSON = _toJSON;
}

/**
 * Log all the comparisons between actual and expected test results, then print
 * summary. Returns count of passed and failed tests.
 * @param {Smokehouse.LHRComparison} results
 * @return {{passed: number, failed: number}}
 */
function report(results) {
  let correctCount = 0;
  let failedCount = 0;

  [results.finalUrl, results.errorCode, ...results.audits].forEach(auditAssertion => {
    if (auditAssertion.equal) {
      correctCount++;
    } else {
      failedCount++;
    }

    if (!auditAssertion.equal || VERBOSE) {
      reportAssertion(auditAssertion);
    }
  });

  const plural = correctCount === 1 ? '' : 's';
  const correctStr = `${correctCount} assertion${plural}`;
  const colorFn = correctCount === 0 ? log.redify : log.greenify;
  console.log(`  Correctly passed ${colorFn(correctStr)}\n`);

  return {
    passed: correctCount,
    failed: failedCount,
  };
}

module.exports.collateResults = collateResults;
module.exports.report = report;
