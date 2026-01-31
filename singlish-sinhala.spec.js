const { test, expect } = require('@playwright/test');
const { loadTestCases } = require('./utils/excel-loader');

const SELECTORS = {
  input: '#input',
  output: '#output',
  error: '#error',
};

async function typeAndWaitForFinal(page, text) {
  await page.fill(SELECTORS.input, '');
  await page.type(SELECTORS.input, text, { delay: 40 });
  await page.waitForTimeout(350);
}

async function assertRealTimeUpdate(page, inputText, expectedFinal) {
  await page.fill(SELECTORS.input, '');
  for (const ch of inputText) {
    await page.type(SELECTORS.input, ch, { delay: 30 });
    // break early if output starts appearing
    const out = (await page.locator(SELECTORS.output).innerText().catch(() => '')).trim();
    if (out.length > 0) break;
  }
  await expect(page.locator(SELECTORS.output)).toHaveText(expectedFinal, { timeout: 5000 });
}

test.describe('Singlish → Sinhala conversion — core scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('Short input updates in real-time and converts correctly', async ({ page }) => {
    const input = 'Mama kiyala hari';
    const expected = 'මම කියලා හරි';
    await assertRealTimeUpdate(page, input, expected);
  });

  test('Medium input preserves Zoom and mixed language', async ({ page }) => {
    const input = 'Mama Zoom meeting ekata awilla. Please send me the link.';
    const expected = 'මම Zoom රැස්වීමට ආවෙ. කරුණාකර මට link එක එවන්න.';
    await typeAndWaitForFinal(page, input);
    await expect(page.locator(SELECTORS.output)).toHaveText(expected, { timeout: 5000 });
  });

  test('Long input (repeated snippet) converts correctly', async ({ page }) => {
    const snippet = 'Mama kalin kiyala thiyena deyak sandaha post karanawa. ';
    const longInput = snippet.repeat(12); // ~420 chars
    const expected = 'මම කලින් කියලා තිබෙන දේක් සඳහා post කරනවා. '.repeat(12).trim();
    await typeAndWaitForFinal(page, longInput);
    await expect(page.locator(SELECTORS.output)).toHaveText(expected, { timeout: 8000 });
  });

  test('Currency, date/time recognized and normalized', async ({ page }) => {
    const input = 'Balance: Rs. 1,234.56 on 31/01/2026 at 10:30 PM';
    const expected = 'උත්තමය: රු. 1,234.56 - 2026-01-31 22:30';
    await typeAndWaitForFinal(page, input);
    await expect(page.locator(SELECTORS.output)).toHaveText(expected, { timeout: 6000 });
  });

  test('Multiple sentence types handled', async ({ page }) => {
    const input = 'I like it. I do not like it. Do you like it? Please check it now.';
    const expected = 'මට ඒක කැමතියි. මට ඒක කැමතියි නැහැ. ඔයාට ඒක කැමෙනවද? කරුණාකර දැන් පරීක්ෂා කරන්න.';
    await typeAndWaitForFinal(page, input);
    await expect(page.locator(SELECTORS.output)).toHaveText(expected, { timeout: 6000 });
  });

  test('Singular and plural forms translate correctly', async ({ page }) => {
    await typeAndWaitForFinal(page, 'This is a book');
    await expect(page.locator(SELECTORS.output)).toHaveText('මෙය පොතකි', { timeout: 4000 });

    await typeAndWaitForFinal(page, 'These are books');
    await expect(page.locator(SELECTORS.output)).toHaveText('මෙන්න පොත් වේ', { timeout: 4000 });
  });

  test('Slang/informal tokens are flagged or preserved', async ({ page }) => {
    const input = "brb, I'm gonna call you";
    await typeAndWaitForFinal(page, input);
    const out = (await page.locator(SELECTORS.output).innerText().catch(() => ''));
    const errVisible = await page.locator(SELECTORS.error).isVisible().catch(() => false);
    expect(errVisible || out.includes('brb') || out.includes('gonna')).toBeTruthy();
  });

  test('Typo prevents correct translation', async ({ page }) => {
    const input = 'Mama kyla hri';
    await typeAndWaitForFinal(page, input);
    const out = (await page.locator(SELECTORS.output).innerText().catch(() => ''));
    const errVisible = await page.locator(SELECTORS.error).isVisible().catch(() => false);
    expect(errVisible || out.includes('Mama kyla hri')).toBeTruthy();
  });

  test('Numbers/punctuation only inputs handled gracefully', async ({ page }) => {
    const input = '1234567890 !!!';
    await typeAndWaitForFinal(page, input);
    const out = (await page.locator(SELECTORS.output).innerText().catch(() => ''));
    const errVisible = await page.locator(SELECTORS.error).isVisible().catch(() => false);
    expect(errVisible || out === input).toBeTruthy();
  });

  test.describe('Data-driven tests from CSV/XLSX', () => {
    const cases = loadTestCases(require('path').join(__dirname, 'data', 'test-cases.csv'));
    for (const c of cases) {
      test(`${c.id} - ${c.type} - ${c.notes || ''}`, async ({ page }) => {
        await page.goto('http://localhost:3000');
        await typeAndWaitForFinal(page, c.input);
        if (c.type === 'positive') {
          await expect(page.locator(SELECTORS.output)).toHaveText(c.expected, { timeout: 5000 });
        } else {
          const out = (await page.locator(SELECTORS.output).innerText().catch(() => ''));
          const errVisible = await page.locator(SELECTORS.error).isVisible().catch(() => false);
          expect(errVisible || out === c.expected || out === c.input).toBeTruthy();
        }
      });
    }
  });
});
