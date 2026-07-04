const { composePlugins, withNx } = require('@nx/webpack');
const webpack = require('webpack');

module.exports = composePlugins(withNx(), (config) => {
  return {
    ...config,
    externals: [
      // Native modules
      'better-sqlite3',
      'sqlite3',
      'sharp',
      // Kept as a real runtime require (not bundled) so it can be swapped for a
      // stub via Node's module resolution in environments without MongoDB (e2e)
      'mongodb',
      // Optional NestJS dependencies
      'cache-manager',
      'class-validator',
      'class-transformer',
      // Optional MongoDB dependencies
      'bson-ext',
      'kerberos',
      '@mongodb-js/zstd',
      'snappy',
      'mongodb-client-encryption',
      // Externalize @nestjs optional packages and their sub-modules
      function ({ request }, callback) {
        if (request.startsWith('@nestjs/websockets') || request.startsWith('@nestjs/microservices')) {
          return callback(null, 'commonjs ' + request);
        }
        callback();
      },
    ],
    plugins: [
      ...(config.plugins || []),
      // Ignore optional MongoDB native dependencies
      new webpack.IgnorePlugin({
        resourceRegExp: /^(snappy|bson-ext|kerberos|@mongodb-js\/zstd|mongodb-client-encryption)$/,
      }),
      // Suppress dynamic require warnings in NestJS
      new webpack.ContextReplacementPlugin(/(@nestjs\/common|@nestjs\/core|express|mongodb)/, (data) => {
        delete data.dependencies[0].critical;
        return data;
      }),
    ],
    ignoreWarnings: [
      // Ignore "Critical dependency" warnings from NestJS and Express
      /Critical dependency: the request of a dependency is an expression/,
      // Ignore MongoDB optional dependencies warnings
      /Can't resolve 'snappy/,
      /Can't resolve 'bson-ext'/,
      /Can't resolve 'kerberos'/,
      /Can't resolve '@mongodb-js\/zstd'/,
      /Can't resolve 'mongodb-client-encryption'/,
      // Ignore all MongoDB deps.js warnings
      /mongodb\/lib\/deps\.js/,
    ],
  };
});
