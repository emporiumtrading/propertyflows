import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display landing page content', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByTestId('button-get-started')).toBeVisible();
    
    await expect(page.locator('h1')).toContainText('Property Management');
  });

  test('should navigate to marketplace', async ({ page }) => {
    await page.goto('/');
    
    const browseButton = page.getByTestId('button-browse-units');
    await expect(browseButton).toBeVisible();
    
    await browseButton.click();
    
    await expect(page).toHaveURL('/marketplace');
  });

  test('should have footer links', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByTestId('link-privacy')).toBeVisible();
    await expect(page.getByTestId('link-terms')).toBeVisible();
    await expect(page.getByTestId('link-about')).toBeVisible();
  });
});
