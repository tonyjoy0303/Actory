#!/usr/bin/env node

/**
 * Test Runner Script for Actory Platform
 * 
 * This script runs all Playwright tests and generates a comprehensive report.
 * Usage: node run-all-tests.mjs
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n📋 Actory Platform - Automated Test Runner\n');
console.log('═'.repeat(50));
console.log('\n🔍 Pre-flight Checks...\n');

// Check if Playwright is installed
try {
  const playwrightConfig = join(__dirname, 'playwright.config.ts');
  if (!fs.existsSync(playwrightConfig)) {
    console.error('❌ Error: playwright.config.ts not found');
    process.exit(1);
  }
  console.log('✓ Playwright configuration found');
} catch (error) {
  console.error('❌ Error checking Playwright setup:', error.message);
  process.exit(1);
}

// Check if test files exist
const testFiles = [
  'tests/01-authentication.spec.ts',
  'tests/02-teams.spec.ts',
  'tests/03-projects.spec.ts',
  'tests/04-casting-calls.spec.ts',
  'tests/05-submissions.spec.ts',
  'tests/06-videos.spec.ts',
  'tests/07-notifications.spec.ts',
  'tests/08-admin.spec.ts',
  'tests/09-api-integration.spec.ts'
];

let testCount = 0;
for (const testFile of testFiles) {
  if (fs.existsSync(join(__dirname, testFile))) {
    testCount++;
  }
}

console.log(`✓ Found ${testCount}/9 test suites`);

// Check if servers might be running
console.log('\n⚠️  Important Prerequisites:');
console.log('   1. Backend server must be running on http://localhost:5000');
console.log('   2. Frontend server must be running on http://localhost:8080');
console.log('   3. Test users must exist in database:');
console.log('      - jesly@gmail.com / jesly123 (Actor)');
console.log('      - tonyjoyjp@gmail.com / tony123 (Producer)');

console.log('\n' + '═'.repeat(50));
console.log('\n🚀 Starting Test Execution...\n');

// Run Playwright tests
const playwrightProcess = spawn('npx', ['playwright', 'test', '--reporter=html,list'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

playwrightProcess.on('close', (code) => {
  console.log('\n' + '═'.repeat(50));
  
  if (code === 0) {
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📊 Test Report Generated');
    console.log('   Location: playwright-report/index.html');
    console.log('\n📸 Test Artifacts:');
    console.log('   - Screenshots: test-results/');
    console.log('   - Videos: test-results/');
    console.log('   - Traces: test-results/');
    console.log('\n💡 To view the HTML report, run:');
    console.log('   npm run test:show-report');
    console.log('   OR');
    console.log('   npx playwright show-report');
  } else {
    console.log('\n❌ Some tests failed');
    console.log('\n📊 Check the HTML report for details:');
    console.log('   npm run test:show-report');
    console.log('\n🔍 Debugging Tips:');
    console.log('   1. Check screenshots in test-results/');
    console.log('   2. Watch videos of failed tests');
    console.log('   3. Use trace viewer: npx playwright show-trace <trace-file>');
    console.log('   4. Re-run failed tests: npx playwright test --last-failed');
    console.log('   5. Run in debug mode: npx playwright test --debug');
  }
  
  console.log('\n' + '═'.repeat(50) + '\n');
  process.exit(code);
});

playwrightProcess.on('error', (error) => {
  console.error('\n❌ Error running tests:', error.message);
  console.error('\n💡 Try these steps:');
  console.error('   1. Install dependencies: npm install');
  console.error('   2. Install Playwright browsers: npx playwright install');
  console.error('   3. Verify backend server is running: http://localhost:5000');
  console.error('   4. Verify frontend server is running: http://localhost:8080');
  process.exit(1);
});
