# Automated Testing Documentation

## Overview
Comprehensive automated test suite for the Actory platform using Playwright, covering all core functionality.

## Test Coverage (200+ Tests)

### 1. Authentication Suite (01-authentication.spec.ts) - 24 Tests
- User registration (valid/invalid scenarios)
- Login/logout flows
- Password reset
- Profile management
- Session management

### 2. Teams Management Suite (02-teams.spec.ts) - 26 Tests
- Team creation
- Team viewing
- Member invitations
- Member management
- Team updates/deletion
- Permission testing

### 3. Projects Suite (03-projects.spec.ts) - 27 Tests
- Project creation
- Project viewing
- Role management
- Project updates
- Project deletion
- Team collaboration
- Project statistics

### 4. Casting Calls Suite (04-casting-calls.spec.ts) - 30 Tests
- Casting call creation
- Public browsing
- Producer view
- Team castings management
- Details view
- Status management

### 5. Submissions/Applications Suite (05-submissions.spec.ts) - 29 Tests
- Actor application flow
- Actor view of applications
- Producer review workflow
- Statistics
- Sorting/filtering
- Bulk actions
- Notification integration

### 6. Videos Suite (06-videos.spec.ts) - 38 Tests
- Profile videos management
- Video upload
- Public feed
- Video player controls
- Interactions (like, comment, share)
- Portfolio management
- Upload progress

### 7. Notifications Suite (07-notifications.spec.ts) - 38 Tests
- Notification display
- Actions (mark read, delete, clear)
- Actor notifications (application status, casting calls, etc.)
- Producer notifications (submissions, team events, etc.)
- Notification preferences
- Real-time updates
- Pagination

### 8. Admin Suite (08-admin.spec.ts) - 38 Tests
- Access control
- User management
- Content moderation
- Casting management
- Platform analytics
- System settings

### 9. API Integration Suite (09-api-integration.spec.ts) - 33 Tests
- Authentication endpoints
- Teams endpoints
- Projects endpoints
- Casting endpoints
- Submissions endpoints
- Notifications endpoints
- Error handling
- Pagination
- Search and filters

## Prerequisites

1. **Backend Server Running**
   ```bash
   cd actory-spotlight-backend
   npm install
   npm run dev
   # Server should be running on http://localhost:5000
   ```

2. **Frontend Server Running**
   ```bash
   cd actory-spotlight-ui
   npm install
   npm run dev
   # Server should be running on http://localhost:8080
   ```

3. **Test Users Setup**
   Ensure these test users exist in the database:
   - Actor: `jesly@gmail.com` / `jesly123`
   - Producer: `tonyjoyjp@gmail.com` / `tony123`
   - Admin (optional): `admin@actory.com` / `admin123`

## Running Tests

### Run All Tests (Recommended)
```bash
cd actory-spotlight-ui
npm run test:e2e:all
```
This runs all tests and generates an HTML report.

### Run Tests with UI Mode (Interactive)
```bash
npm run test:e2e:ui
```
Opens Playwright's interactive UI to run and debug tests.

### Run Tests in Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```
Runs tests with browser visible.

### Run Specific Test Suite
```bash
npx playwright test tests/01-authentication.spec.ts
npx playwright test tests/02-teams.spec.ts
npx playwright test tests/03-projects.spec.ts
npx playwright test tests/04-casting-calls.spec.ts
npx playwright test tests/05-submissions.spec.ts
npx playwright test tests/06-videos.spec.ts
npx playwright test tests/07-notifications.spec.ts
npx playwright test tests/08-admin.spec.ts
npx playwright test tests/09-api-integration.spec.ts
```

### Run Tests with Specific Pattern
```bash
npx playwright test --grep "should login"
npx playwright test --grep "casting"
```

### View Last Test Report
```bash
npm run test:show-report
```

## Test Results

After running tests, you'll see:
1. **Terminal Output** - Real-time test execution with pass/fail status
2. **HTML Report** - Detailed report with screenshots and traces for failed tests
3. **Screenshots** - Captured on test failures
4. **Videos** - Recorded for failed tests
5. **Traces** - Full execution traces for debugging

### Sample Test Output
```
Running 200+ tests across 9 suites...

✓ 01-authentication.spec.ts (24 tests) - 45s
✓ 02-teams.spec.ts (26 tests) - 52s
✓ 03-projects.spec.ts (27 tests) - 58s
✓ 04-casting-calls.spec.ts (30 tests) - 65s
✓ 05-submissions.spec.ts (29 tests) - 61s
✓ 06-videos.spec.ts (38 tests) - 78s
✓ 07-notifications.spec.ts (38 tests) - 74s
✓ 08-admin.spec.ts (38 tests) - 68s
✓ 09-api-integration.spec.ts (33 tests) - 42s

200+ tests passed!
Time: 8m 23s
```

## Viewing HTML Report

Open `playwright-report/index.html` in your browser:
```bash
npm run test:show-report
```

The HTML report includes:
- Test execution summary
- Pass/fail status for each test
- Execution time
- Screenshots for failures
- Video recordings
- Network activity
- Console logs
- Trace viewer for debugging

## Test Configuration

Configuration file: `playwright.config.ts`

Key settings:
- **baseURL**: `http://localhost:8080`
- **timeout**: 30 seconds per test
- **retries**: 0 (no retries)
- **workers**: 1 (sequential execution)
- **browsers**: Chromium only
- **headless**: true (no browser UI)
- **screenshot**: on-failure
- **video**: on-failure
- **trace**: on-failure

## Debugging Failed Tests

### 1. View Screenshots
```bash
# Screenshots are saved in test-results/
ls test-results/
```

### 2. View Videos
```bash
# Videos are saved in test-results/
# Open .webm files in browser
```

### 3. Use Trace Viewer
```bash
npx playwright show-trace test-results/path-to-trace.zip
```

### 4. Run in Debug Mode
```bash
npx playwright test --debug
```

### 5. Run with Headed Browser
```bash
npx playwright test --headed --slowmo=1000
```

## Test Patterns Used

1. **Authentication Helper** - Reusable login function from `login.spec.ts`
2. **Defensive Testing** - Check element existence before interaction
3. **Proper Waiting** - Use `waitForLoadState`, `waitForResponse`, `waitForTimeout`
4. **Dialog Handling** - Handle confirmation dialogs
5. **Permission Testing** - Separate tests for different user roles
6. **Error Handling** - Test both success and failure scenarios

## Continuous Integration

To run tests in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Install dependencies
  run: |
    cd actory-spotlight-ui
    npm ci
    npx playwright install --with-deps

- name: Run tests
  run: |
    cd actory-spotlight-ui
    npm run test:e2e:all

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: actory-spotlight-ui/playwright-report/
    retention-days: 30
```

## Troubleshooting

### Tests Failing Due to Timeout
- Increase timeout in `playwright.config.ts`
- Check if backend/frontend servers are running
- Verify network connectivity

### Authentication Failures
- Verify test user credentials exist in database
- Check localStorage token storage
- Verify API endpoint accessibility

### Element Not Found Errors
- UI may have changed - update selectors
- Add proper wait conditions
- Check if feature is behind feature flag

### Database State Issues
- Tests may need database reset between runs
- Consider using test database
- Add cleanup in `afterEach` hooks

## Best Practices

1. **Run Backend and Frontend First** - Ensure both servers are running
2. **Sequential Execution** - Tests run one at a time (workers: 1)
3. **Clean State** - Each test should be independent
4. **Descriptive Names** - Test names clearly describe what they test
5. **Avoid Hard Waits** - Use Playwright's auto-waiting features
6. **Handle Async Operations** - Properly wait for API responses
7. **Test Isolation** - Don't depend on other tests' state

## Test Maintenance

- Update selectors when UI changes
- Add new tests for new features
- Remove tests for deprecated features
- Keep test data synchronized with database schema
- Review and update timeouts as needed

## Support

For issues or questions:
1. Check test output and screenshots
2. Review trace files for failed tests
3. Run tests in debug mode
4. Check backend/frontend logs
5. Verify test user setup

---

**Total Tests**: 200+  
**Coverage**: All core functionality  
**Execution Time**: ~8-10 minutes  
**Success Rate**: Depends on environment setup
