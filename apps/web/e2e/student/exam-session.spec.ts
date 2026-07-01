import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('Student Exam Session', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    const examCard = page.locator('a[href*="/exams/"]').first();
    await examCard.waitFor({ state: 'visible', timeout: 15000 });
    await examCard.click();
    await page.waitForURL(/\/exams\//, { timeout: 15000 });
  });

  test('exam page renders with header', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('header, [class*="header"]').first()).toBeVisible();
  });

  test('start session then workspace shows soal', async ({ page }) => {
    const startBnt = page.locator('button:has-text("Mulai")').first();
    await expect(startBnt).toBeVisible({ timeout: 8000 });
    await startBnt.click();
    const soalArea = page.locator('text=/soal|pertanyaan/i').first();
    await expect(soalArea).toBeVisible({ timeout: 15000 });
  });

  test('answer multiple choice and verify checked', async ({ page }) => {
    const startBnt = page.locator('button:has-text("Mulai")').first();
    await expect(startBnt).toBeVisible({ timeout: 8000 });
    await startBnt.click();
    const option = page.locator('input[type="radio"]').or(page.locator('[role="radio"]')).first();
    await expect(option).toBeVisible({ timeout: 10000 });
    await option.click();
    await expect(option).toBeChecked();
  });

  test('fill essay answer', async ({ page }) => {
    const startBnt = page.locator('button:has-text("Mulai")').first();
    await expect(startBnt).toBeVisible({ timeout: 8000 });
    await startBnt.click();
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10000 });
    await textarea.fill('Jawaban essay E2E testing');
    await expect(textarea).toHaveValue('Jawaban essay E2E testing');
  });

  test('submit exam and land on dashboard', async ({ page }) => {
    const startBnt = page.locator('button:has-text("Mulai")').first();
    await expect(startBnt).toBeVisible({ timeout: 8000 });
    await startBnt.click();
    const finishBtn = page.locator('button:has-text("Selesai"), [data-testid="finish-exam"]');
    await expect(finishBtn).toBeVisible({ timeout: 10000 });
    await finishBtn.click();
    const confirmBtn = page.locator('button:has-text("Ya"), button:has-text("Konfirmasi")');
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();
    await page.waitForURL(/\/dashboard/, { timeout: 20000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('timer countdown visible after start', async ({ page }) => {
    const startBnt = page.locator('button:has-text("Mulai")').first();
    await expect(startBnt).toBeVisible({ timeout: 8000 });
    await startBnt.click();
    const timer = page.locator(`text=/\\d{2}:\\d{2}:\\d{2}|\\d{2}:\\d{2}/`).first();
    await expect(timer).toBeVisible({ timeout: 10000 });
  });
});
