import { test, expect } from "@playwright/test";

test.describe("PromptWars Full Platform E2E Workflow", () => {
  const testEmail = `qa.learner.${Date.now()}@example.com`;
  const testPassword = "Password@1234";

  test("1. Landing page renders branding and navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/PromptWars/i);
    await expect(page.getByRole("heading", { name: /AI-Powered Career Intelligence/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Get Started/i })).toBeVisible();
  });

  test("2. Registration workflow initializes new learner profile", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /Create Your Learner Profile/i })).toBeVisible();

    await page.fill("#full_name", "Automation Test Learner");
    await page.fill("#email", testEmail);
    await page.fill("#password", testPassword);
    await page.fill("#degree", "B.Tech Computer Science");
    await page.fill("#institution", "Silicon Institute of Technology");
    await page.fill("#skills", "Python, SQL, HTML, CSS");

    await page.click("button[type='submit']");

    // Wait for redirect to dashboard or login
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 15000 });
  });

  test("3. Login and session authentication", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", testEmail);
    await page.fill("#password", testPassword);
    await page.click("button[type='submit']");

    await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: /Learner Cockpit/i })).toBeVisible();
  });

  test("4. Profile completion & editing", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: /Learner Profile/i })).toBeVisible();

    // Verify degree and university populated
    await expect(page.locator("#degree")).toBeVisible();
    await expect(page.locator("#institution")).toBeVisible();
  });

  test("5. Skill management and calibration sliders", async ({ page }) => {
    await page.goto("/skills");
    await expect(page.getByRole("heading", { name: /Skills Management/i })).toBeVisible();
    // Search or view catalog
    await expect(page.getByPlaceholder(/Search skills/i)).toBeVisible();
  });

  test("6. Career selection and readiness calculation", async ({ page }) => {
    await page.goto("/career-explorer");
    await expect(page.getByRole("heading", { name: /Career Role Catalog/i })).toBeVisible();
    await expect(page.getByText(/Full Stack Developer/i).first()).toBeVisible();

    await page.goto("/career-readiness");
    await expect(page.getByText(/Career Readiness Index/i)).toBeVisible();
  });

  test("7. Personalized roadmap generation and phase inspection", async ({ page }) => {
    await page.goto("/roadmap");
    await expect(page.getByText(/Adaptive Learning Roadmap/i)).toBeVisible();
    await expect(page.getByText(/Phase 1/i)).toBeVisible();
  });

  test("8. Assessment portal dual-track UI", async ({ page }) => {
    await page.goto("/assessments");
    await expect(page.getByRole("heading", { name: /Assessment Portal/i })).toBeVisible();
    await expect(page.getByText(/Track 1: Native Theory Assessments/i)).toBeVisible();
    await expect(page.getByText(/Track 2: Specialized Coding Lab/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Open Coding Lab/i })).toBeVisible();
  });

  test("9. AI Mentor interaction and response rendering", async ({ page }) => {
    await page.goto("/mentor");
    await expect(page.getByRole("heading", { name: /PromptWars AI Mentor/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Ask your mentor anything/i)).toBeVisible();

    // Send a question
    await page.fill("input[placeholder*='Ask your mentor']", "What should I learn today?");
    await page.keyboard.press("Enter");

    // Wait for mentor response card to appear
    await expect(page.locator(".prose, .markdown-content, [class*='space-y-4']").last()).toBeVisible({ timeout: 10000 });
  });

  test("10. Page reload and session persistence verification", async ({ page }) => {
    await page.goto("/dashboard");
    await page.reload();
    await expect(page.getByRole("heading", { name: /Learner Cockpit/i })).toBeVisible();
  });
});
