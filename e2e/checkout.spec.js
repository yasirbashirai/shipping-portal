import { test, expect } from '@playwright/test';

const mockRatesResponse = {
  success: true,
  quotes: [
    { carrier: 'RL_CARRIERS', serviceLevel: 'Standard LTL', totalCost: 298.75, transitDays: 5, estimatedDelivery: '2026-03-15T00:00:00Z', badges: ['Best Price'], isRecommended: true },
    { carrier: 'SEFL', serviceLevel: 'Standard LTL', totalCost: 315.00, transitDays: 3, estimatedDelivery: '2026-03-13T00:00:00Z', badges: ['Fastest'], isRecommended: false },
    { carrier: 'XPO', serviceLevel: 'Standard LTL', totalCost: 342.50, transitDays: 4, estimatedDelivery: '2026-03-14T00:00:00Z', badges: [], isRecommended: false },
    { carrier: 'FEDEX_FREIGHT', serviceLevel: 'FedEx Freight Priority', totalCost: 425.00, transitDays: 2, estimatedDelivery: '2026-03-12T00:00:00Z', badges: [], isRecommended: false },
  ],
  shipmentSummary: { estimatedWeight: 780, freightClass: '92.5', estimatedPallets: 1 },
  sessionId: 'rate_test123',
};

test.describe('Checkout Widget', () => {
  test('customer can get rates and select a carrier', async ({ page }) => {
    await page.goto('http://localhost:5174');

    // Mock the API
    await page.route('**/api/rates', async (route) => {
      await route.fulfill({ json: mockRatesResponse });
    });

    // Fill form
    await page.fill('[data-testid="cabinet-count"]', '10');
    await page.click('[data-testid="type-rta"]');
    await page.click('[data-testid="delivery-residential"]');
    await page.click('[data-testid="method-curbside"]');
    await page.fill('[data-testid="destination-zip"]', '90210');
    await page.click('[data-testid="get-rates-btn"]');

    // Check loading state appears
    await expect(page.locator('[data-testid="rates-loading"]')).toBeVisible();

    // Check rate cards appear
    await expect(page.locator('[data-testid="rate-card"]')).toHaveCount(4);

    // Select first card
    await page.click('[data-testid="rate-card"]:first-child');

    // Confirmation banner should appear
    await expect(page.locator('[data-testid="confirm-banner"]')).toBeVisible();
  });

  test('form shows validation errors for invalid ZIP', async ({ page }) => {
    await page.goto('http://localhost:5174');

    await page.fill('[data-testid="destination-zip"]', '921');
    await page.click('[data-testid="get-rates-btn"]');

    // Should show validation error (form doesn't submit)
    await expect(page.locator('[data-testid="estimator-form"]')).toBeVisible();
  });

  test('estimator form renders on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://localhost:5174');

    await expect(page.locator('[data-testid="estimator-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="get-rates-btn"]')).toBeVisible();
  });
});
