const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { loginUrl, orderUrl } = require('./config');
const { saveSession, loadSession } = require('./utils/auth');

puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--window-size=600,400']
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 600,
    height: 400
  });
  await loadSession(page);

  try {
    await page.goto(loginUrl, { waitUntil: 'networkidle2', timeout: 0 });
  } catch (err) {
    console.error('❌ Gagal membuka halaman login:', err.message);
    await browser.close();
    process.exit(1);
  }

  if (page.url().includes('login')) {
    console.log('Silakan login dan verifikasi OTP manual...');

    try {
      await page.waitForFunction(
        () =>
        //   !window.location.href.includes('login') 
        //   &&
          !document.body.innerText.toLowerCase().includes('link verifikasi')
          ,
        { timeout: 10 * 60 * 1000 }
      );

      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      console.log('Login dan verifikasi berhasil!');
      await saveSession(page);
      

      console.log('🔽 Meminimize browser...');
      const browserProcess = browser.process();
      if (browserProcess && browserProcess.pid) {
        // Windows
        if (process.platform === 'win32') {
          const { exec } = require('child_process');
          exec(`powershell -Command "Add-Type -TypeDefinition 'using System; using System.Diagnostics; using System.Runtime.InteropServices; public class Win32 { [DllImport(\\"user32.dll\\")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow); [DllImport(\\"user32.dll\\")] public static extern IntPtr FindWindow(string lpClassName, string lpWindowName); }'; $chromeWindows = Get-Process chrome | Where-Object { $_.MainWindowTitle -ne '' }; foreach ($window in $chromeWindows) { [Win32]::ShowWindow($window.MainWindowHandle, 2) }"`, (error) => {
            if (error) {
              console.log('⚠️ Gagal minimize browser secara otomatis');
            } else {
              console.log('✅ Browser berhasil diminimize');
            }
          });
        }
        // macOS
        else if (process.platform === 'darwin') {
          const { exec } = require('child_process');
          exec('osascript -e "tell application \\"Google Chrome\\" to set miniaturized of every window to true"', (error) => {
            if (error) {
              console.log('⚠️ Gagal minimize browser secara otomatis');
            } else {
              console.log('✅ Browser berhasil diminimize');
            }
          });
        }
        // Linux
        else if (process.platform === 'linux') {
          const { exec } = require('child_process');
          exec('xdotool search --name "Chrome" windowminimize', (error) => {
            if (error) {
              console.log('⚠️ Gagal minimize browser secara otomatis');
            } else {
              console.log('✅ Browser berhasil diminimize');
            }
          });
        }
      }
      
    } catch (err) {
      console.error('Timeout: Gagal login/verifikasi.');
      await browser.close();
      process.exit(1);
    }
  }

  async function changePaginationSize() {
    try {
      console.log('📄 Mengubah pagination size menjadi 200 item per halaman...');
      
      await page.waitForSelector('.page-size-dropdown-container .eds-button', { 
        visible: true, 
        timeout: 10000 
      });
      
      await page.click('.page-size-dropdown-container .eds-button');
      console.log('🔽 Dropdown pagination dibuka');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const success = await page.evaluate(() => {
        const spans = document.querySelectorAll('span');
        for (const span of spans) {
          if (span.textContent.trim() === '200') {
            span.click();
            return true;
          }
        }
        return false;
      });
      
      if (success) {
        console.log('✅ Pagination size berhasil diubah ke 200');
        await new Promise(resolve => setTimeout(resolve, 3000));
        await page.waitForSelector('[data-testid="shipping-channel-filter"]', { 
          visible: true, 
          timeout: 10000 
        });
      } else {
        console.log('⚠️ Opsi "200" tidak ditemukan');
      }
      
    } catch (err) {
      console.log('⚠️ Gagal mengubah pagination size:', err.message);
    }
  }

  async function processMassOrderCheckbox() {
    try {
      const hasOrders = await page.$('[data-testid="mass-ship-checkbox-all"]');
      if (!hasOrders) {
        console.log('❌ Tidak ada checkbox mass order — mungkin belum ada pesanan untuk filter ini.');
        return;
      }

      await page.waitForSelector('[data-testid="mass-ship-checkbox-all"]', { visible: true, timeout: 10000 });

      const isChecked = await page.$eval(
        '[data-testid="mass-ship-checkbox-all"] input',
        checkbox => checkbox.checked || checkbox.value === 'true'
      );

      if (!isChecked) {
        console.log('🔘 Checkbox mass order belum dicentang. Melakukan klik...');
        await page.click('[data-testid="mass-ship-checkbox-all"]');
        console.log('✅ Checkbox mass order berhasil dicentang');
      } else {
        console.log('☑️ Checkbox mass order sudah dicentang.');
      }

    } catch (err) {
      console.log('❌ Gagal memproses checkbox mass order:', err.message);
    }
  }

  async function closeModalIfExists() {
    try {
      console.log('🔍 Mengecek modal yang perlu ditutup...');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const modalClosed = await page.evaluate(() => {
        const collapseElements = document.querySelectorAll('div.collapse');
        for (const element of collapseElements) {
          if (element.textContent.trim() === 'Tutup' || element.textContent.includes('Tutup')) {
            element.click();
            return true;
          }
        }
        
        const divs = document.querySelectorAll('div[data-v-e6484800].collapse');
        for (const div of divs) {
          if (div.textContent.includes('Tutup')) {
            div.click();
            return true;
          }
        }
        
        const allDivs = document.querySelectorAll('div');
        for (const div of allDivs) {
          if (div.textContent.trim() === 'Tutup' && div.classList.contains('collapse')) {
            div.click();
            return true;
          }
        }
        
        return false;
      });
      
      if (modalClosed) {
        console.log('✅ Modal berhasil ditutup');
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else {
        console.log('ℹ️ Tidak ada modal yang perlu ditutup');
      }
      
    } catch (err) {
      console.log('⚠️ Error saat mencoba menutup modal:', err.message);
    }
  }

  async function clickMassShipButton() {
    try {
      console.log('🚚 Mencari button "Atur Antar ke Counter Massal"...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const buttonFound = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent.includes('Atur Antar ke Counter Massal')) {
            if (!button.disabled && !button.classList.contains('disabled')) {
              button.click();
              return { success: true, disabled: false };
            } else {
              return { success: false, disabled: true };
            }
          }
        }
        return { success: false, disabled: false, notFound: true };
      });
      
      if (buttonFound.success) {
        console.log('✅ Button "Atur Antar ke Counter Massal" berhasil diklik');
        
        await closeModalIfExists();
        
      } else if (buttonFound.disabled) {
        console.log('⚠️ Button "Atur Antar ke Counter Massal" ditemukan tapi masih disabled');
      } else if (buttonFound.notFound) {
        console.log('❌ Button "Atur Antar ke Counter Massal" tidak ditemukan');
      }
      
    } catch (err) {
      console.log('❌ Gagal mengklik button "Atur Antar ke Counter Massal":', err.message);
    }
  }

  async function processShippingFilters() {
    try {
      console.log('🚚 Memulai proses filter jasa kirim...');

      await page.waitForSelector('[data-testid="shipping-channel-filter"]', { visible: true, timeout: 30000 });

      const filterOptions = await page.$$eval('[data-testid="shipping-channel-filter"] label', labels => {
        return labels.map((label, index) => {
          const text = label.innerText.trim();
          const checkbox = label.querySelector('input[type="checkbox"]');
          return {
            index,
            text,
            isChecked: checkbox ? checkbox.checked : false,
            selector: `[data-testid="shipping-channel-filter"] label:nth-child(${index + 1})`
          };
        });
      });
  
      console.log('📋 Filter yang ditemukan:', filterOptions.length);

      const filtersWithOrders = filterOptions.filter(filter => !filter.text.match(/\(0\)$/));
      
      console.log(`📦 Filter dengan pesanan yang akan diproses: ${filtersWithOrders.length} dari ${filterOptions.length}`);
      
      for (let i = 0; i < filtersWithOrders.length; i++) {
        const filter = filtersWithOrders[i];
        
        try {
          console.log(`🔄 Memproses filter ${i + 1}/${filtersWithOrders.length}: ${filter.text}`);

          if (!filter.isChecked) {
            await page.evaluate((selector) => {
              const element = document.querySelector(selector);
              if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, filter.selector);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            await page.click(filter.selector);
            console.log(`✅ Filter "${filter.text}" berhasil dicentang`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            console.log(`☑️ Filter "${filter.text}" sudah dicentang sebelumnya`);
          }
          
          await changePaginationSize();
          await processMassOrderCheckbox();
          await clickMassShipButton(); 
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (filterErr) {
          console.error(`❌ Gagal memproses filter "${filter.text}":`, filterErr.message);
          continue; 
        }
      }
      
      const skippedCount = filterOptions.length - filtersWithOrders.length;
      if (skippedCount > 0) {
        console.log(`⏭️ Dilewati ${skippedCount} filter tanpa pesanan`);
      }
      
      console.log('🎉 Semua filter jasa kirim telah diproses!');
      
    } catch (err) {
      console.error('❌ Gagal memproses filter jasa kirim:', err.message);
    }
  }

  async function processMassOrder() {
    try {
      await page.goto(orderUrl, { waitUntil: 'networkidle2', timeout: 0 });
      console.log(`Mengecek pesanan pada ${new Date().toLocaleTimeString()}`);
      
      await processShippingFilters();
  
    } catch (err) {
      console.error('Gagal memproses pesanan:', err.message);
    }
  }
  
  await processMassOrder();

  const interval = setInterval(async () => {
    await processMassOrder();
  }, 5 * 60 * 1000);

  process.on('SIGINT', async () => {
    console.log('\n👋 Menutup browser...');
    clearInterval(interval);
    await browser.close();
    process.exit();
  });
})();