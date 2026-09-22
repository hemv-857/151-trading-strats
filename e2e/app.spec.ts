import { test, expect } from "@playwright/test";

test.describe("151 Trading Strategies - E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for app to hydrate
    await page.waitForLoadState("networkidle");
  });

  test("loads dashboard with hero and asset classes", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("151 Trading Strategies");
    await expect(page.locator("text=Quant Research Terminal")).toBeVisible();

    // Check asset class cards exist
    const assetCards = page.locator('[class*="asset-class"]').or(page.locator("text=Options")).or(page.locator("text=Stocks"));
    await expect(assetCards.first()).toBeVisible();
  });

  test("navigation between views works", async ({ page }) => {
    // Click Library in sidebar
    await page.click('button:has-text("Library")');
    await expect(page.locator("text=Strategy Library")).toBeVisible();

    // Click Backtest Lab
    await page.click('button:has-text("Backtest Lab")');
    await expect(page.locator("text=Quantitative Backtest Engine")).toBeVisible();

    // Click Options Lab
    await page.click('button:has-text("Options Lab")');
    await expect(page.locator("text=Options Payoff Lab")).toBeVisible();

    // Click Glossary
    await page.click('button:has-text("Glossary")');
    await expect(page.locator("text=Quant Finance Glossary")).toBeVisible();

    // Click About
    await page.click('button:has-text("About")');
    await expect(page.locator("text=151 Trading Strategies")).toBeVisible();

    // Click Compare
    await page.click('button:has-text("Compare")');
    await expect(page.locator("text=Strategy Comparison")).toBeVisible();

    // Click Compare Backtests
    await page.click('button:has-text("Compare Backtests")');
    await expect(page.locator("text=Compare Backtests")).toBeVisible();
  });

  test("strategy library - search and filter", async ({ page }) => {
    await page.click('button:has-text("Library")');
    await expect(page.locator("text=Strategy Library")).toBeVisible();

    // Search for "momentum"
    await page.fill('input[placeholder*="Search"]', "momentum");
    await expect(page.locator("text=Price-momentum")).toBeVisible();

    // Clear search
    await page.fill('input[placeholder*="Search"]', "");
    await expect(page.locator("text=Long call")).toBeVisible();
  });

  test("backtest lab - run synthetic backtest", async ({ page }) => {
    await page.click('button:has-text("Backtest Lab")');
    await expect(page.locator("text=Quantitative Backtest Engine")).toBeVisible();

    // Select a strategy
    await page.click('button:has-text("Single Moving Average")');

    // Click Run Backtest
    await page.click('button:has-text("Run Backtest")');

    // Wait for results
    await expect(page.locator("text=Total Return")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Sharpe")).toBeVisible();
    await expect(page.locator("text=Max Drawdown")).toBeVisible();
  });

  test("options lab - select preset and view payoff", async ({ page }) => {
    await page.click('button:has-text("Options Lab")');
    await expect(page.locator("text=Options Payoff Lab")).toBeVisible();

    // Select a preset
    await page.click('button:has-text("Long Call")');

    // Check payoff diagram renders
    await expect(page.locator("text=Payoff Diagram")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Greeks")).toBeVisible();
  });

  test("strategy detail drawer opens on click", async ({ page }) => {
    await page.click('button:has-text("Library")');
    await expect(page.locator("text=Strategy Library")).toBeVisible();

    // Click on a strategy card
    await page.click('text=Long call');
    
    // Check drawer opens
    await expect(page.locator("text=Long call")).toBeVisible();
    await expect(page.locator("text=Formula")).toBeVisible();
    await expect(page.locator("text=Key Concepts")).toBeVisible();

    // Close drawer
    await page.click('button[aria-label="Close"]');
    await expect(page.locator("text=Strategy Library")).toBeVisible();
  });

  test("keyboard shortcuts work", async ({ page }) => {
    // Press 1 for dashboard
    await page.keyboard.press("1");
    await expect(page.locator("h1")).toContainText("151 Trading Strategies");

    // Press 2 for library
    await page.keyboard.press("2");
    await expect(page.locator("text=Strategy Library")).toBeVisible();

    // Press / to focus search
    await page.keyboard.press("/");
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeFocused();

    // Press ? for shortcuts modal
    await page.keyboard.press("?");
    await expect(page.locator("text=Keyboard Shortcuts")).toBeVisible();

    // Press Esc to close modal
    await page.keyboard.press("Escape");
    await expect(page.locator("text=Keyboard Shortcuts")).not.toBeVisible();
  });

  test("compare backtests view", async ({ page }) => {
    await page.click('button:has-text("Compare Backtests")');
    await expect(page.locator("text=Compare Backtests")).toBeVisible();

    // Select first strategy
    await page.click('button:has-text("Single Moving Average")');
    
    // Add second slot
    await page.click('button:has-text("Add Strategy")');

    // Select second strategy in slot 2
    const slots = page.locator('[class*="strategy-slot"]');
    await slots.nth(1).click('button:has-text("Two Moving Averages")');

    // Click Compare
    await page.click('button:has-text("Compare")');

    // Wait for results
    await expect(page.locator("text=Equity Curve Comparison")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Metrics Comparison")).toBeVisible();
  });

  test("favorites work", async ({ page }) => {
    await page.click('button:has-text("Library")');
    
    // Favorite a strategy (heart icon)
    const heartButton = page.locator('button[aria-label*="favorite"]').first();
    await heartButton.click();
    
    // Check favorites filter shows count
    await expect(page.locator("text=Favorites").first()).toContainText("1");
  });

  test("ticker tape displays", async ({ page }) => {
    // Check ticker tape is visible
    await expect(page.locator("text=SPX")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=NDX")).toBeVisible();
    await expect(page.locator("text=VIX")).toBeVisible();
  });

  test("theme is dark", async ({ page }) => {
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);
  });
});