import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
        page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
        page.on('requestfailed', request => console.log('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText));

        await page.goto('http://localhost:4000/', { waitUntil: 'networkidle0' });
        
        const content = await page.content();
        console.log('DOM length:', content.length);
        
        await browser.close();
    } catch (e) {
        console.error('SCRIPT ERROR:', e);
    }
})();
