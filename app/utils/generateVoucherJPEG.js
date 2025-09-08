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
        
        // Use existing card generation functions - SAME DESIGN WITH HEADER & FOOTER!
        let cardHTML;
        if (isGift) {
          cardHTML = generateGiftCard(voucher, order?.totalPrice || 0);
        } else {
          cardHTML = generateVoucherCard(voucher);
        }
        
        // Wrap in complete email structure with header and footer
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
          <body>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="font-family: 'Barlow Condensed', sans-serif; background-color:#f9f9f9; padding:20px 0;">
              <tr>
                <td align="center">

                  <!-- Email Header - SAME AS EMAIL -->
                  <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#862633; padding:10px; text-align:center;">
                    <tr>
                      <td style="color:white; text-align:center;">
                        <img src="https://res.cloudinary.com/dgk3gaml0/image/upload/v1756224071/gtgy8nrnhkbcemgyh1ps.png" width="50%" height="40" style="margin-right:10px; object-fit: contain;" />
                      </td>
                    </tr>
                  </table>

                  <!-- Main Content -->
                  <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:white; padding:35px 30px;">
                    <tr>
                      <td align="center" style="color:#000000; font-size:28px; font-weight:bold; padding-bottom:10px;">
                        <span style="color:#862633;">Thank you </span> for your purchase!
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="color:#000000; font-size:16px; padding-bottom:10px; font-weight:500;">
                        Your Jiffy Lube® ${cardType.toLowerCase()} is ready to use.
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="color:#000000; font-size:16px; line-height:1.5; padding-bottom:5px; font-weight:400;">
                        Just bring this with you on your next visit to a participating location.
                      </td>
                    </tr>
                  </table>

                  <!-- Voucher/Gift Card Section -->
                  <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:white; padding:20px;">
                    <tr>
                      <td align="center">
                        ${cardHTML}
                      </td>
                    </tr>
                  </table>

                  <!-- Find a Location Section -->
                  <table width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="background:#f5f5f5; border-radius:8px; padding:30px 20px; margin:40px 0">
                    <tr>
                      <td align="center" style="font-size:20px; font-weight:bold; color:#000000; padding-bottom:20px;">
                        Find a Participating Location Near You
                      </td>
                    </tr>
                    <tr>
                      <td align="center">
                        <a href="https://redemption-portal-487066d362b4.herokuapp.com" 
                          style="display:block; background:#862633; color:#ffffff; 
                                  text-decoration:none; font-size:16px; font-weight:bold; 
                                  padding:14px 30px; border-radius:6px; width:100%; box-sizing:border-box">
                          FIND A LOCATION
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- How to Redeem Section -->
                  <table width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="background:#ffffff; padding:20px; border-left:3px solid #862633; margin:20px 0;">
                    <tr>
                      <td align="left" style="font-size:24px; font-weight:bold; color:#000000; padding-bottom:10px;">
                        How to Redeem?
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size:14px; color:#555555; line-height:1.6; text-align:left;">
                        Keep this for yourself or share with friends and family. 
                        It's a smart way to save and help others stay road-ready too. 
                        Look forward to seeing you soon at your local Jiffy Lube!
                      </td>
                    </tr>
                  </table>

                  <!-- Email Footer - SAME AS EMAIL -->
                  <table width="600" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
                    <tr>
                      <td style="color:white; font-size:24px; font-weight:bold; text-align:center;">
                        <span style="display:inline-block;">
                          <img src="https://res.cloudinary.com/dgk3gaml0/image/upload/v1756224350/kuc37dmifsg42ojqxwc1.png" width="50%" height="60" style="margin-right:10px; object-fit: contain;" />
                        </span>
                      </td>
                    </tr>
                  </table>
                  <div style="color: black; font-size: 11px; line-height: 1.4; max-width: 500px; margin: 0 auto; font-style: italic; text-align:center; padding-top:10px;">
                    *Valid for up to 5 quarts of oil, extra fee for additional quarts. Not valid with any other offer for same service. Only valid at participating ACE Jiffy Lube locations. Shop supply fees and applicable taxes are not included and must be paid at time of service.
                  </div>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `;
        
        console.log(`📝 [JPEG Generator] Using existing ${cardType} design WITH HEADER & FOOTER for ${voucher.code}`);
        
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
        
        console.log(`✅ [JPEG Generator] ${filename} created successfully - WITH EMAIL HEADER & FOOTER!`);
        
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
  console.log(`🎨 [JPEG Generator] Design: COMPLETE EMAIL STRUCTURE with header, card & footer!`);
  
  return jpegAttachments;
}
