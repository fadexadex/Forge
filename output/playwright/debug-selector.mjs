import { chromium } from '/tmp/pwtmp/node_modules/playwright-core/index.mjs';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function clickSubmit(page) {
  const buttons = page.locator('button[type="submit"]');
  const count = await buttons.count();
  if (!count) throw new Error('No submit button found');
  await buttons.nth(count - 1).click();
}

async function main() {
  const apiKey = requireEnv('GOOGLE_API_KEY');
  const logs = [];
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();

  page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
  await page.addInitScript((key) => {
    localStorage.setItem(
      'forge-settings',
      JSON.stringify({
        state: { geminiApiKey: key, openaiApiKey: '', anthropicApiKey: '' },
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
  await page.getByPlaceholder('Ask something to render UI…').fill('Open the sales selector for Maharashtra revenue monthly 2025.');
  await clickSubmit(page);
  await page.waitForTimeout(15000);

  const iframeCount = await page.locator('iframe').count();
  const frames = [];
  for (let i = 0; i < iframeCount; i += 1) {
    const iframeHandle = await page.locator('iframe').nth(i).elementHandle();
    const frame = await iframeHandle.contentFrame();
    let html = '';
    let text = '';
    if (frame) {
      html = await frame.locator('html').innerHTML().catch(() => '');
      text = await frame.locator('body').innerText().catch(() => '');
    }
    frames.push({
      index: i,
      hasFrame: !!frame,
      text: text.slice(0, 1000),
      html: html.slice(0, 2000),
    });
  }

  console.log(JSON.stringify({ iframeCount, frames, logs: logs.slice(-50) }, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
