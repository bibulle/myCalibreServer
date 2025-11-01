const { composePlugins, withNx } = require('@nx/webpack');

module.exports = composePlugins(withNx(), (config) => {
  return {
    ...config,
    externals: [
      // Native modules
      'better-sqlite3',
      'sqlite3',
      'sharp',
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
  };
});
