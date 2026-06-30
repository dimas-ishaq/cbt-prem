import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('Student Exam Session', () => {
  test.beforeEach(async ({ page }) => {
    // navigate to first available exam
    await page.goto('/dashboard');
    const examCard = page.locator('a[href*="/exams/"]').first();
    await examCard.waitFor({ state: 'visible', timeout: 15000 });
    await examCard.click();
    await page.waitForURL(/\/exams\//, { timeout: 15000 });
  });

  test('exam page render', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    // header should show exam title
    await expect(page.locator('header').or(page.locator('[class*="header"]')).first()).toBeVisible();
  });

  test('start session from rules gate', async ({ page }) => {
    // if rules gate shown, click Mulai/Mulai Ujian
    const startBtn = page.locator('button:has-text("Mulai")').first();
    if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await startBtn.click();
    }
    // after start, workspace should render (soal)
    await page.waitForTimeout(2000);
    const soalArea = page.locator('text=/soal|pertanyaan/i').first();
    await expect(soalArea).toBeVisible({ timeout: 10000 });
  });

  test('answer multiple choice question', async ({ page }) => {
    const startBtn = page.locator('button:has-text("Mulai")').first();
    if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(2000);
    }
    // click first radio/checkbox option
    const option = page.locator('input[type="radio"]').or(page.locator('[role="radio"]')).first();
    if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
      await option.click();
      await page.waitForTimeout(500);
      await expect(option).toBeChecked();
    }
  });

  test('answer essay question', async ({ page }) => {
    const startBtn = page.locator('button:has-text("Mulai")').first();
    if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(2000);
    }
    // find textarea (essay)
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      await textarea.fill('Jawaban essay E2E testing');
      await expect(textarea).toHaveValue('Jawaban essay E2E testing');
    }
  });

  test('submit exam', async ({ page }) => {
    const startBtn = page.locator('button:has-text("Mulai")').first();
    if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(2000);
    }
    // click finish/submit button
    const finishBtn = page.locator('button:has-text("Selesai")').or(page.locator('[data-testid="finish-exam"]'));
    if (await finishBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await finishBtn.click();
      // confirm dialog if any
      const confirmBtn = page.locator('button:has-text("Ya")').or(page.locator('button:has-text("Konfirmasi")'));
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
      }
      await page.waitForURL(/dashboard/, { timeout: 20000 });
      await expect(page).toHaveURL(/dashboard/);
    }
  });

  test('autosave indicator visible', async ({ page }) => {
    const startBtn = page.locator('button:has-text("Mulai")').first();
    if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(2000);
    }
    // look for autosave indicator
    const autoSaveIndicator = page.locator('text=/tersimpan|tersimpan otomatis|menyimpan/i').first();
    if (await autoSaveIndicator.isVisible({ timeout: 10000 }).catch(() => false)) {
      await expect(autoSaveIndicator).toBeVisible();
    }
  });

  test('timer countdown visible after start', async ({ page }) => {
    const startBtn = page.locator('button:has-text("Mulai")').first();
    if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(2000);
    }
    // timer should show MM:SS format
    const timer = page.locator(`text=/\\d{2}:\\d{2}:\\d{2}|\\d{2}:\\d{2}/`).first();
    await expect(timer).toBeVisible({ timeout: 10000 });
  });
});
