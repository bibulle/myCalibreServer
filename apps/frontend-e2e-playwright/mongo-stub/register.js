'use strict';

/**
 * Node `--require` preload hook: redirects any `require('mongodb')` to the
 * local stub (./mongodb-stub.js) for the lifetime of the process. Used only
 * to run the API's e2e webServer without a real MongoDB instance - see
 * ../README.md. `mongodb` must be externalized (not webpack-bundled) for
 * this to have any effect; see apps/api/webpack.config.js.
 */

const Module = require('module');
const path = require('path');

const stubPath = path.join(__dirname, 'mongodb-stub.js');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, ...args) {
  if (request === 'mongodb') {
    return stubPath;
  }
  return originalResolveFilename.call(this, request, ...args);
};
