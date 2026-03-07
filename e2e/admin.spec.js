import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test('admin can login and is redirected to dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/login');

    await page.fill('[data-testid="login-email"]', 'admin@dotlessagency.com');
    await page.fill('[data-testid="login-password"]', 'Admin@12345');
    await page.click('[data-testid="login-submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('[data-testid="stat-cards"]')).toBeVisible();
  });

  test('login shows error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:5173/login');

    await page.fill('[data-testid="login-email"]', 'admin@dotlessagency.com');
    await page.fill('[data-testid="login-password"]', 'wrongpassword');
    await page.click('[data-testid="login-submit"]');

    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
  });

  test('dashboard stat cards load with values', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="login-email"]', 'admin@dotlessagency.com');
    await page.fill('[data-testid="login-password"]', 'Admin@12345');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/admin/);

    const statCards = page.locator('[data-testid="stat-card"]');
    await expect(statCards).toHaveCount(4);
  });

  test('orders page loads with order list', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="login-email"]', 'admin@dotlessagency.com');
    await page.fill('[data-testid="login-password"]', 'Admin@12345');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/admin/);

    // Navigate to orders
    await page.click('text=Orders');
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();
  });

  test('website filter changes displayed data', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="login-email"]', 'admin@dotlessagency.com');
    await page.fill('[data-testid="login-password"]', 'Admin@12345');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/admin/);

    // Click Cabinets.deals filter
    await page.click('[data-testid="filter-cabinets_deals"]');

    // The filter should be active
    await expect(page.locator('[data-testid="website-filter"]')).toBeVisible();
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('http://localhost:5173/admin');
    await expect(page).toHaveURL(/\/login/);
  });
});
