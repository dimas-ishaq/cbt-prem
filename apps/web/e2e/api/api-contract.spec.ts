import { test, expect } from '@playwright/test';

test.describe('API contract', () => {
  test('GET /settings', async ({ request }) => {
    const res = await request.get('/api/settings');
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /server-time', async ({ request }) => {
    const res = await request.get('/api/server-time');
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /dashboard/stats', async ({ request }) => {
    const res = await request.get('/api/dashboard/stats');
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /exams', async ({ request }) => {
    const res = await request.get('/api/exams');
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /exam-sessions/exam/:id', async ({ request }) => {
    const res = await request.get('/api/exam-sessions/exam/test');
    expect(res.status()).toBeLessThan(500);
  });

  test('POST /exam-sessions/bulk-reset', async ({ request }) => {
    const res = await request.post('/api/exam-sessions/bulk-reset', { data: { examId: 'test' } });
    expect(res.status()).toBeGreaterThanOrEqual(200);
    expect(res.status()).toBeLessThan(500);
  });
});
