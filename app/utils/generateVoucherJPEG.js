import puppeteer from 'puppeteer';

// Helper functions for date and currency formatting
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function addMonths(dateStr, months) {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

// Generate individual voucher JPEG
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
        
        // Generate HTML for individual card
        const cardHTML = generateCardHTML(voucher, isGift, order?.totalPrice || 0);
        
        console.log(`📝 [JPEG Generator] Generated HTML for ${voucher.code} (${cardHTML.length} chars)`);
        
        await page.setContent(cardHTML, { waitUntil: 'networkidle0' });
        
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
        
        console.log(`✅ [JPEG Generator] ${filename} created successfully`);
        
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
  
  return jpegAttachments;
}

// Generate HTML for individual voucher card
function generateCardHTML(voucher, isGift, totalPrice) {
  if (isGift) {
    return generateGiftCardHTML(voucher, totalPrice);
  } else {
    return generateVoucherCardHTML(voucher);
  }
}

// Generate voucher card HTML
function generateVoucherCardHTML(voucher) {
  const validThrough = voucher?.createdAt
    ? formatDate(addMonths(voucher.createdAt, 3))
    : "08/16/2026";
  const issuedOn = voucher?.createdAt
    ? formatDate(voucher.createdAt)
    : "03/16/2025";
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Jiffy Lube Voucher - ${voucher.code}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f9f9f9; font-family: 'Barlow Condensed', sans-serif;">
      <div style="width:350px; padding:5px; background-color:#862633; margin: 0 auto;">
        <table width="350" cellpadding="0" cellspacing="0" border="0" style="border:2px solid #ffffff; border-style:dashed; background:#862633; padding:20px; border-radius:0 8px 8px 8px;">
          <tr>
            <td align="center" style="padding-bottom:14px;">
              <h1 style="font-size:26px; font-weight:bold; color:#ffffff; margin:0;">${voucher.productTitle || 'Oil Change Voucher'}</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="background:#ffffff; color:#862633; font-size:36px; font-weight:bold; padding:15px 10px; border-radius:8px;">
              ${voucher.code}
            </td>
          </tr>
          <tr>
            <td style="color:#ffffff; font-size:16px; padding:15px 0 0 0; text-align:center;">
              Valid Through: <strong>${validThrough}</strong>
            </td>
          </tr>
          <tr>
            <td style="color:#ffffff; font-size:14px; padding:5px 0; text-align:center;">
              Issued On: ${issuedOn}
            </td>
          </tr>
          <tr>
            <td style="color:#ffffff; font-size:12px; padding:15px 0 0 0; text-align:center; line-height:1.3;">
              Present this voucher at any participating Jiffy Lube location
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;
}

// Generate gift card HTML
function generateGiftCardHTML(voucher, totalPrice) {
  const validThrough = voucher?.createdAt
    ? formatDate(addMonths(voucher.createdAt, 12))
    : "08/16/2027";
  const issuedOn = voucher?.createdAt
    ? formatDate(voucher.createdAt)
    : "03/16/2025";
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Jiffy Lube Gift Card - ${voucher.code}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f9f9f9; font-family: 'Barlow Condensed', sans-serif;">
      <div style="width:350px; padding:5px; background: linear-gradient(135deg, #d4af37 0%, #ffd700 100%); margin: 0 auto;">
        <table width="350" cellpadding="0" cellspacing="0" border="0" style="border:2px solid #ffffff; border-style:dashed; background: linear-gradient(135deg, #d4af37 0%, #ffd700 100%); padding:20px; border-radius:8px;">
          <tr>
            <td align="center" style="padding-bottom:14px;">
              <h1 style="font-size:26px; font-weight:bold; color:#2c2c2c; margin:0; text-shadow: 1px 1px 2px rgba(255,255,255,0.3);">GIFT CARD</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="background:#ffffff; color:#d4af37; font-size:28px; font-weight:bold; padding:15px 10px; border-radius:8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              ${voucher.code}
            </td>
          </tr>
          <tr>
            <td align="center" style="color:#2c2c2c; font-size:20px; font-weight:bold; padding:15px 0 5px 0;">
              Value: ${formatCurrency(totalPrice)}
            </td>
          </tr>
          <tr>
            <td style="color:#2c2c2c; font-size:16px; padding:10px 0 0 0; text-align:center; font-weight:500;">
              Valid Through: <strong>${validThrough}</strong>
            </td>
          </tr>
          <tr>
            <td style="color:#2c2c2c; font-size:14px; padding:5px 0; text-align:center;">
              Issued On: ${issuedOn}
            </td>
          </tr>
          <tr>
            <td style="color:#2c2c2c; font-size:12px; padding:15px 0 0 0; text-align:center; line-height:1.3; font-weight:400;">
              Redeemable at any participating Jiffy Lube location
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;
}
