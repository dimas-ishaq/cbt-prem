import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 90000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.HEADLESS === 'false' ? [['list']] : [['line']],
  projects: [
    {
      name: 'setup-student',
      testMatch: /setup\/student\.setup\.ts/,
    },
    {
      name: 'setup-admin',
      testMatch: /setup\/admin\.setup\.ts/,
    },
    {
      name: 'setup-superadmin',
      testMatch: /setup\/superadmin\.setup\.ts/,
    },
    {
      name: 'auth',
      testMatch: /auth\/(login|logout|rbac)\.spec\.ts/,
    },
    {
      name: 'student-dashboard',
      dependencies: ['setup-student'],
      testMatch: /student\/dashboard\.spec\.ts/,
      use: { storageState: 'playwright/.auth/user.json' },
    },
    {
      name: 'student-exam-session',
      dependencies: ['setup-student'],
      testMatch: /student\/exam-session\.spec\.ts/,
      use: { storageState: 'playwright/.auth/user.json' },
    },
    {
      name: 'admin-utilities',
      dependencies: ['setup-admin'],
      testMatch: /admin\/(exam-create|exam-list|exam-edit|monitoring|results|reports|settings|notifications|logs|master-data|users|roles|question-bank|exam-groups|profile|sounds|exam-cards|essay-grading|analytics|monitoring-history|monitoring-upcoming|results-sessions)\.spec\.ts/,
      use: { storageState: 'playwright/.auth/admin.json' },
    },
    {
      name: 'admin-exam-create',
      dependencies: ['setup-admin'],
      testMatch: /admin\/exam-create\.spec\.ts/,
      use: { storageState: 'playwright/.auth/admin.json' },
    },
    {
      name: 'api-contract',
      testMatch: /api\/api-contract\.spec\.ts/,
    },
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    headless: process.env.HEADLESS !== 'false',
    launchOptions: process.env.HEADLESS === 'false' ? { slowMo: 150 } : undefined,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
});
