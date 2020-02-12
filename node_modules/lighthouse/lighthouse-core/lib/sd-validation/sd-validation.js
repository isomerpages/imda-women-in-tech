/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const parseJSON = require('./json-linter.js');
const validateJsonLD = require('./jsonld-keyword-validator.js');
const expandAsync = require('./json-expander.js');
const validateSchemaOrg = require('./schema-validator.js');

/** @typedef {'json'|'json-ld'|'json-ld-expand'|'schema-org'} ValidatorType */

/**
 * Validates JSON-LD input. Returns array of error objects.
 *
 * @param {string} textInput
 * @returns {Promise<Array<{path: ?string, validator: ValidatorType, message: string}>>}
 */
module.exports = async function validate(textInput) {
  // STEP 1: VALIDATE JSON
  const parseError = parseJSON(textInput);

  if (parseError) {
    return [{
      validator: 'json',
      path: parseError.lineNumber,
      message: parseError.message,
    }];
  }

  const inputObject = JSON.parse(textInput);

  // STEP 2: VALIDATE JSONLD
  const jsonLdErrors = validateJsonLD(inputObject);

  if (jsonLdErrors.length) {
    return jsonLdErrors.map(error => {
      return {
        validator: /** @type {ValidatorType} */ ('json-ld'),
        path: error.path,
        message: error.message,
      };
    });
  }

  // STEP 3: EXPAND
  /** @type {LH.StructuredData.ExpandedSchemaRepresentation|null} */
  let expandedObj = null;
  try {
    expandedObj = await expandAsync(inputObject);
  } catch (error) {
    return [{
      validator: 'json-ld-expand',
      path: null,
      message: error.message,
    }];
  }

  // STEP 4: VALIDATE SCHEMA
  const schemaOrgErrors = validateSchemaOrg(expandedObj);

  if (schemaOrgErrors.length) {
    return schemaOrgErrors.map(error => {
      return {
        validator: /** @type {ValidatorType} */ ('schema-org'),
        path: error.path,
        message: error.message,
      };
    });
  }

  return [];
};
