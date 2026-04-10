# End-to-End Testing with Playwright

This directory contains comprehensive end-to-end tests for the Billing SaaS Application using Playwright.

## Test Suite Overview

The comprehensive E2E test suite (`e2e-comprehensive.spec.ts`) creates a complete testing environment with:

### Test Data Created

- **2 Super Users**: Pre-existing admin accounts
  - `admin@admin.com` / `Shubham@143`
  - `shubhampardhui24@gmail.com` / `Shubham@143`

- **5 Organizations**: 
  - TechCorp Solutions (Technology)
  - HealthCare Plus (Healthcare)
  - FinanceHub (Finance)
  - RetailMart (Retail)
  - EduLearn Academy (Education)

- **6 Admin Accounts**: One for each org + one additional for TechCorp
  
- **User Accounts**: 3 accounts of each role per organization
  - ADMIN role: 3 users per org
  - FINANCE role: 3 users per org
  - OPERATOR role: 3 users per org
  - READONLY role: 3 users per org
  - **Total**: 60 role-based users

- **Customers**: 5-8 customers per organization (25-40 total)

- **Products**: 10-15 products per organization (50-75 total)
  - Each organization has products in a unique sector
  - Sectors: Technology, Healthcare, Finance, Retail, Education, etc.

- **Bills**: 20-25 bills per organization (100-125 total)
  - Multiple items per bill
  - Various statuses: DRAFT, PENDING, PAID, OVERDUE

### Database Verification

The test suite verifies all database tables are properly updated:
- Users table
- Customers table
- Products table
- Bills table
- BillItems table
- Roles table
- UserSessions table
- SecurityLogs table

## Prerequisites

1. **Node.js**: Ensure Node.js is installed
2. **Database**: SQLite database should be set up
3. **Dependencies**: Run `npm install`
4. **Playwright Browsers**: The browsers will be installed automatically

## Running Tests

### Standard Test Run
```bash
npm run test:e2e
```

### UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

### Headed Mode (See browser)
```bash
npm run test:e2e:headed
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### View Test Report
```bash
npm run test:e2e:report
```

## Test Structure

```
tests/
├── helpers/
│   ├── test-helpers.ts      # Test utilities and constants
│   ├── data-generator.ts    # Data generation utilities
│   └── database-helper.ts   # Database verification utilities
└── e2e-comprehensive.spec.ts # Main test suite
```

## Test Steps

The comprehensive test executes in the following order:

1. **Verify Super Users**: Tests login for both super admin accounts
2. **Create Organizations**: Creates 5 organizations with admin accounts
3. **Create User Accounts**: Creates role-based users for each organization
4. **Create Customers**: Generates 5-8 customers per organization
5. **Create Products**: Generates 10-15 products per organization (unique sectors)
6. **Create Bills**: Generates 20-25 bills per organization
7. **Verify Database**: Checks all tables are properly updated
8. **Test Permissions**: Verifies role-based access control
9. **Generate Report**: Creates comprehensive summary

## Configuration

Test configuration is in `playwright.config.ts`:

- **Base URL**: http://localhost:3000
- **Test Directory**: ./tests
- **Workers**: 1 (sequential execution)
- **Retries**: 0 locally, 2 on CI
- **Timeout**: 30 seconds per test
- **Reporters**: HTML, List, JSON

## Test Data

### Super Users
```typescript
{
  email: 'admin@admin.com',
  password: 'Shubham@143'
},
{
  email: 'shubhampardhui24@gmail.com',
  password: 'Shubham@143'
}
```

### Organization Admins
All organization admin accounts use password: `Shubham@143`

### Role Users
All role-based user accounts use password: `Shubham@143`

## Database Helper

The `DatabaseHelper` class provides methods to:
- Verify user existence
- Count records in all tables
- Retrieve data by user/organization
- Verify bill integrity
- Check data relationships

## Data Generator

The `DataGenerator` class generates:
- Unique emails (prevents duplicates)
- Unique phone numbers
- Unique SKUs
- GST numbers (Indian format)
- Realistic customer data (Indian names, addresses)
- Sector-specific products with appropriate pricing
- Bills with multiple items

## Troubleshooting

### Browser Installation Issues
If Playwright browsers fail to install due to certificate issues:
```bash
set NODE_TLS_REJECT_UNAUTHORIZED=0
npx playwright install
```

### Database Errors
Ensure the database is migrated and seeded:
```bash
npm run db:generate
npm run db:push
```

### Server Not Starting
The test config automatically starts the dev server. If it fails:
```bash
npm run dev
```
Then run tests in a separate terminal without webServer in config.

### Test Failures
- Check if the application is running on port 3000
- Verify database has the required schema
- Ensure no port conflicts
- Check console logs for specific errors

## CI/CD Integration

For continuous integration:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Test Results

Test results are saved in:
- `playwright-report/` - HTML report
- `test-results/` - Screenshots, videos, traces
- `test-results/results.json` - JSON report

## Best Practices

1. **Run Sequentially**: Tests are designed to run in order (workers: 1)
2. **Clean Database**: Consider resetting database before major test runs
3. **Monitor Logs**: Console logs provide detailed progress information
4. **Check Reports**: Always review HTML reports after test completion
5. **Database Verification**: The test suite automatically verifies database integrity

## Future Enhancements

- [ ] Add performance testing scenarios
- [ ] Implement visual regression testing
- [ ] Add API testing alongside UI tests
- [ ] Create test data cleanup utilities
- [ ] Add more granular permission testing
- [ ] Implement parallel organization testing

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Review HTML test report
3. Enable debug mode for step-by-step execution
4. Verify database state using Prisma Studio

---

**Note**: The first test run may take 15-20 minutes to create all test data. Subsequent runs can be faster if test data is preserved.
