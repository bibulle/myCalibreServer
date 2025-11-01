#!/usr/bin/env node

/**
 * Verification script to check if E2E test environment is properly configured
 */

const http = require('http');

async function checkEndpoint(url, description) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      console.log(`✓ ${description}: ${res.statusCode}`);
      resolve(res.statusCode === 200);
    });

    req.on('error', (err) => {
      console.log(`✗ ${description}: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`✗ ${description}: Timeout`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function testLogin() {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      username: 'test@example.com',
      password: 'password123',
    });

    const options = {
      hostname: 'localhost',
      port: 3333,
      path: '/api/authent/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const json = JSON.parse(body);
            if (json.access_token) {
              console.log('✓ Test user login: Success');
              resolve(true);
            } else {
              console.log('✗ Test user login: No access token in response');
              resolve(false);
            }
          } catch (e) {
            console.log('✗ Test user login: Invalid JSON response');
            resolve(false);
          }
        } else {
          console.log(`✗ Test user login: Status ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`✗ Test user login: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('✗ Test user login: Timeout');
      req.destroy();
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🔍 Verifying E2E test environment setup...\n');

  // Check backend
  await checkEndpoint('http://localhost:3333/api/health', 'Backend API health');
  await checkEndpoint('http://localhost:3333/api/version', 'Backend API version');

  // Check frontend
  await checkEndpoint('http://localhost:4200/', 'Frontend application');

  // Test authentication with test user
  await testLogin();

  console.log('\n✅ E2E environment verification complete!');
  console.log('\nTo run E2E tests:');
  console.log('  npx nx run frontend-e2e:e2e-with-seed');
  console.log('  or: npx nx e2e frontend-e2e');
}

main().catch(console.error);
