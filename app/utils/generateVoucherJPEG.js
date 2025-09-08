import puppeteer from 'puppeteer';
import { generateVoucherCard, generateGiftCard } from './unifiedEmailTemplate.js';

// Generate individual voucher JPEG using existing card designs
export async function generateIndividualVoucherJPEGs(vouchers, order) {
  console.log(`🖼️ [JPEG Generator] 🚀 Starting individual JPEG generation for ${vouchers.length} vouchers`);
  
  const jpegAttachments = [];
  
  // Use existing browser session for efficiency
  let browser;
  
  try {
    console.log('🖼️ [JPEG Generator] 🌐 Launching Puppeteer browser...');
    
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN || '/app/.chrome-for-testing/chrome-linux64/chrome',
      ignoreHTTPSErrors: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    console.log('✅ [JPEG Generator] Browser launched successfully');
    
    // Process each voucher
    for (let i = 0; i < vouchers.length; i++) {
      const voucher = vouchers[i];
      const isGift = voucher.type === 'gift';
      const cardType = isGift ? 'Gift Card' : 'Voucher';
      
      try {
        console.log(`🎫 [JPEG Generator] Processing ${cardType} ${i + 1}/${vouchers.length}: ${voucher.code}`);
        
        const page = await browser.newPage();
        await page.setViewport({ width: 400, height: 600, deviceScaleFactor: 2 });
        
        // Use existing card generation functions - SAME DESIGN!
        let cardHTML;
        if (isGift) {
          cardHTML = generateGiftCard(voucher, order?.totalPrice || 0);
        } else {
          cardHTML = generateVoucherCard(voucher);
        }
        
        // Wrap in complete HTML document for JPEG generation
        const fullHTML = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Jiffy Lube ${cardType} - ${voucher.code}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
          </head>
          <body style="margin: 0; padding: 20px; background-color: #f9f9f9; font-family: 'Barlow Condensed', sans-serif;">
            ${cardHTML}
          </body>
          </html>
        `;
        
        console.log(`📝 [JPEG Generator] Using existing ${cardType} design for ${voucher.code}`);
        
        await page.setContent(fullHTML, { waitUntil: 'networkidle0' });
        
        // Wait for fonts and images to load
        await page.evaluate(async () => {
          const images = Array.from(document.querySelectorAll('img'));
          await Promise.all(images.map(img => {
            if (img.complete) return;
            return new Promise(resolve => {
              img.addEventListener('load', resolve);
              img.addEventListener('error', resolve);
            });
          }));
        });
        
        // Take screenshot
        const jpegBuffer = await page.screenshot({
          type: 'jpeg',
          quality: 90,
          fullPage: true,
          omitBackground: false
        });
        
        console.log(`📸 [JPEG Generator] Screenshot captured for ${voucher.code} (${jpegBuffer.length} bytes)`);
        
        const filename = isGift 
          ? `GiftCard_${voucher.code}.jpeg`
          : `Voucher_${voucher.code}.jpeg`;
        
        jpegAttachments.push({
          filename: filename,
          content: jpegBuffer,
          contentType: 'image/jpeg'
        });
        
        console.log(`✅ [JPEG Generator] ${filename} created successfully - SAME DESIGN AS EMAIL!`);
        
        await page.close();
        
      } catch (error) {
        console.error(`❌ [JPEG Generator] Error creating JPEG for ${voucher.code}:`, error.message);
        // Continue with other vouchers
      }
    }
    
  } catch (browserError) {
    console.error('❌ [JPEG Generator] Browser error:', browserError.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 [JPEG Generator] Browser closed');
    }
  }
  
  console.log(`🎯 [JPEG Generator] ✅ COMPLETED: Generated ${jpegAttachments.length}/${vouchers.length} individual JPEG attachments`);
  console.log(`🎨 [JPEG Generator] Design: EXACTLY SAME as email template cards!`);
  
  return jpegAttachments;
}
