import path from 'node:path';
import { chromium } from '/tmp/pwtmp/node_modules/playwright-core/index.mjs';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function clickSubmit(page) {
  const submitButtons = page.locator('button[type="submit"]');
  const count = await submitButtons.count();
  if (count === 0) {
    throw new Error('No submit button found in MCP Apps chat UI');
  }
  await submitButtons.nth(count - 1).click();
}

async function main() {
  const apiKey = requireEnv('GOOGLE_API_KEY');
  const logs = [];

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    logs.push(`[pageerror] ${err.message}`);
  });

  await page.addInitScript((key) => {
    localStorage.setItem(
      'forge-settings',
      JSON.stringify({
        state: {
          geminiApiKey: key,
          openaiApiKey: '',
          anthropicApiKey: '',
        },
        version: 0,
      })
    );
  }, apiKey);

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

  await page.getByRole('button', { name: 'Test' }).click();
  await page.getByRole('combobox').selectOption('http');
  await page.getByPlaceholder('http://localhost:8080/mcp').fill('http://localhost:3000/mcp');
  await page.getByRole('button', { name: 'Connect' }).click();
  await page.waitForFunction(() => document.body.innerText.includes('sample-mcp-apps-chatflow'));

  await page.getByRole('button', { name: 'MCP Apps' }).click();

  const chatInput = page.getByPlaceholder('Ask something to render UI…');
  await chatInput.fill('Show me the sales selector for Maharashtra revenue monthly 2025.');
  await clickSubmit(page);

  await page.waitForFunction(() => document.querySelectorAll('iframe').length >= 1, null, {
    timeout: 60000,
  });

  let iframeHandle = await page.locator('iframe').nth(0).elementHandle();
  let frame = await iframeHandle.contentFrame();
  await frame.waitForSelector('#metricSelect', { timeout: 30000 });
  await frame.selectOption('#metricSelect', 'revenue');
  await frame.selectOption('#yearSelect', '2025');
  await frame.getByText('Maharashtra').click();
  await frame.getByRole('button', { name: 'Submit' }).click();
  await frame.waitForFunction(() => {
    const status = document.getElementById('statusBar');
    return status && /successfully/i.test(status.textContent || '');
  }, null, { timeout: 30000 });

  await chatInput.fill('Visualize the sales data.');
  await clickSubmit(page);

  await page.waitForFunction(() => document.querySelectorAll('iframe').length >= 2, null, {
    timeout: 60000,
  });

  const iframeCount = await page.locator('iframe').count();
  iframeHandle = await page.locator('iframe').nth(iframeCount - 1).elementHandle();
  frame = await iframeHandle.contentFrame();
  await frame.waitForFunction(() => {
    const subtitle = document.getElementById('reportSubtitle');
    return subtitle && !/Loading data/i.test(subtitle.textContent || '');
  }, null, { timeout: 30000 });

  const subtitle = await frame.locator('#reportSubtitle').innerText();
  const total = await frame.locator('#totalValue').innerText();
  const average = await frame.locator('#avgValue').innerText();
  const topState = await frame.locator('#topStateName').innerText();
  const chartCanvases = await frame.locator('canvas').count();

  const screenshotPath = path.join(
    '/Users/fadex/Downloads/coding-apps/forge/output/playwright',
    'sales-demo.png'
  );
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const filteredLogs = logs.filter(
    (line) =>
      line.includes('McpAppsPanel') ||
      line.includes('[Bridge]') ||
      line.includes('bridge received:') ||
      line.includes('ui/notifications/tool-result') ||
      line.includes('ui/notifications/tool-input')
  );

  console.log(
    JSON.stringify(
      {
        connected: true,
        iframeCount,
        subtitle,
        total,
        average,
        topState,
        chartCanvases,
        screenshotPath,
        filteredLogs: filteredLogs.slice(-30),
      },
      null,
      2
    )
  );

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
