/**
 * e2e-test-suite.js
 * مجموعة اختبارات شاملة (E2E) للتطبيق
 */

const { test, expect } = require('@playwright/test');

// اختبار تسجيل الدخول
test.describe('اختبارات المصادقة', () => {
  test('يجب أن يتمكن المستخدم من تسجيل الدخول بنجاح', async ({ page }) => {
    // الانتقال إلى صفحة تسجيل الدخول
    await page.goto('/login');
    
    // التحقق من وجود نموذج تسجيل الدخول
    await expect(page.locator('form')).toBeVisible();
    
    // إدخال بيانات تسجيل الدخول
    await page.fill('input[formControlName="email"]', 'admin@adalalegalis.com');
    await page.fill('input[formControlName="password"]', 'password123');
    
    // النقر على زر تسجيل الدخول
    await page.click('button[type="submit"]');
    
    // التحقق من الانتقال إلى لوحة التحكم بعد تسجيل الدخول
    await expect(page).toHaveURL('/dashboard');
    
    // التحقق من وجود اسم المستخدم في الصفحة
    await expect(page.locator('.user-info')).toContainText('مدير النظام');
  });
  
  test('يجب أن يظهر خطأ عند إدخال بيانات غير صحيحة', async ({ page }) => {
    // الانتقال إلى صفحة تسجيل الدخول
    await page.goto('/login');
    
    // إدخال بيانات غير صحيحة
    await page.fill('input[formControlName="email"]', 'wrong@example.com');
    await page.fill('input[formControlName="password"]', 'wrongpassword');
    
    // النقر على زر تسجيل الدخول
    await page.click('button[type="submit"]');
    
    // التحقق من ظهور رسالة الخطأ
    await expect(page.locator('.mat-snack-bar-container')).toBeVisible();
    await expect(page.locator('.mat-snack-bar-container')).toContainText('بيانات الاعتماد غير صالحة');
    
    // التحقق من البقاء في صفحة تسجيل الدخول
    await expect(page).toHaveURL('/login');
  });
  
  test('يجب أن يتمكن المستخدم من تسجيل الخروج', async ({ page }) => {
    // تسجيل الدخول أولاً
    await page.goto('/login');
    await page.fill('input[formControlName="email"]', 'admin@adalalegalis.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // التحقق من الانتقال إلى لوحة التحكم
    await expect(page).toHaveURL('/dashboard');
    
    // النقر على زر تسجيل الخروج
    await page.click('.logout-button');
    
    // التحقق من الانتقال إلى صفحة تسجيل الدخول
    await expect(page).toHaveURL('/login');
  });
});

// اختبار لوحة التحكم
test.describe('اختبارات لوحة التحكم', () => {
  // تسجيل الدخول قبل كل اختبار
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[formControlName="email"]', 'admin@adalalegalis.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });
  
  test('يجب أن تعرض لوحة التحكم البيانات الإحصائية الصحيحة', async ({ page }) => {
    // التحقق من وجود بطاقات الإحصائيات
    await expect(page.locator('.stats-card')).toHaveCount(4);
    
    // التحقق من وجود عناوين البطاقات
    const cardTitles = await page.locator('.stats-card .card-title').allTextContents();
    expect(cardTitles).toContain('القضايا');
    expect(cardTitles).toContain('العقود');
    expect(cardTitles).toContain('الاستشارات');
    expect(cardTitles).toContain('المهام');
  });
  
  test('يجب أن تعمل روابط التنقل في القائمة الجانبية', async ({ page }) => {
    // النقر على رابط القضايا
    await page.click('text=القضايا');
    await expect(page).toHaveURL('/cases');
    
    // النقر على رابط العقود
    await page.click('text=العقود');
    await expect(page).toHaveURL('/contracts');
    
    // النقر على رابط الاستشارات
    await page.click('text=الاستشارات');
    await expect(page).toHaveURL('/consultations');
    
    // النقر على رابط المهام
    await page.click('text=المهام');
    await expect(page).toHaveURL('/tasks');
  });
});

// اختبار إدارة القضايا
test.describe('اختبارات إدارة القضايا', () => {
  // تسجيل الدخول والانتقال إلى صفحة القضايا قبل كل اختبار
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[formControlName="email"]', 'admin@adalalegalis.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.click('text=القضايا');
    await expect(page).toHaveURL('/cases');
  });
  
  test('يجب أن تعرض قائمة القضايا', async ({ page }) => {
    // التحقق من وجود جدول القضايا
    await expect(page.locator('table')).toBeVisible();
    
    // التحقق من وجود عناوين الأعمدة
    const columnHeaders = await page.locator('th').allTextContents();
    expect(columnHeaders).toContain('رقم القضية');
    expect(columnHeaders).toContain('العنوان');
    expect(columnHeaders).toContain('النوع');
    expect(columnHeaders).toContain('الحالة');
    expect(columnHeaders).toContain('العميل');
    expect(columnHeaders).toContain('تاريخ الجلسة');
    
    // التحقق من وجود بيانات القضايا
    await expect(page.locator('tbody tr')).toHaveCount.greaterThan(0);
  });
  
  test('يجب أن تعمل وظيفة البحث عن القضايا', async ({ page }) => {
    // إدخال نص البحث
    await page.fill('input[placeholder="بحث..."]', 'قضية مدنية');
    
    // النقر على زر البحث
    await page.click('button.search-button');
    
    // التحقق من نتائج البحث
    await expect(page.locator('tbody tr')).toHaveCount.greaterThan(0);
    await expect(page.locator('tbody')).toContainText('قضية مدنية');
  });
});

// اختبار إدارة العقود
test.describe('اختبارات إدارة العقود', () => {
  // تسجيل الدخول والانتقال إلى صفحة العقود قبل كل اختبار
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[formControlName="email"]', 'admin@adalalegalis.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.click('text=العقود');
    await expect(page).toHaveURL('/contracts');
  });
  
  test('يجب أن تعرض قائمة العقود', async ({ page }) => {
    // التحقق من وجود جدول العقود
    await expect(page.locator('table')).toBeVisible();
    
    // التحقق من وجود عناوين الأعمدة
    const columnHeaders = await page.locator('th').allTextContents();
    expect(columnHeaders).toContain('رقم العقد');
    expect(columnHeaders).toContain('العنوان');
    expect(columnHeaders).toContain('النوع');
    expect(columnHeaders).toContain('الحالة');
    expect(columnHeaders).toContain('العميل');
    expect(columnHeaders).toContain('تاريخ البدء');
    expect(columnHeaders).toContain('تاريخ الانتهاء');
    
    // التحقق من وجود بيانات العقود
    await expect(page.locator('tbody tr')).toHaveCount.greaterThan(0);
  });
});

// اختبار التوافق بين المتصفحات
test.describe('اختبارات التوافق بين المتصفحات', () => {
  test('يجب أن يعمل التطبيق على متصفح كروم', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    const page = await context.newPage();
    
    await page.goto('/login');
    await expect(page.locator('form')).toBeVisible();
    
    await context.close();
  });
  
  test('يجب أن يعمل التطبيق على متصفح فايرفوكس', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
    });
    const page = await context.newPage();
    
    await page.goto('/login');
    await expect(page.locator('form')).toBeVisible();
    
    await context.close();
  });
  
  test('يجب أن يعمل التطبيق على متصفح سفاري', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
    });
    const page = await context.newPage();
    
    await page.goto('/login');
    await expect(page.locator('form')).toBeVisible();
    
    await context.close();
  });
});

// اختبار تجربة الهاتف المحمول
test.describe('اختبارات تجربة الهاتف المحمول', () => {
  test('يجب أن يعمل التطبيق على الهاتف المحمول', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    });
    const page = await context.newPage();
    
    await page.goto('/login');
    
    // التحقق من أن نموذج تسجيل الدخول مرئي ومتوافق مع الشاشات الصغيرة
    await expect(page.locator('form')).toBeVisible();
    
    // التحقق من أن عناصر النموذج تتكيف مع حجم الشاشة
    const formWidth = await page.locator('form').evaluate(form => form.offsetWidth);
    expect(formWidth).toBeLessThanOrEqual(375);
    
    await context.close();
  });
  
  test('يجب أن تعمل القائمة الجانبية بشكل صحيح على الهاتف المحمول', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    });
    const page = await context.newPage();
    
    // تسجيل الدخول
    await page.goto('/login');
    await page.fill('input[formControlName="email"]', 'admin@adalalegalis.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // التحقق من أن زر القائمة مرئي على الشاشات الصغيرة
    await expect(page.locator('.menu-toggle-button')).toBeVisible();
    
    // النقر على زر القائمة لفتح القائمة الجانبية
    await page.click('.menu-toggle-button');
    
    // التحقق من أن القائمة الجانبية مرئية
    await expect(page.locator('.sidebar')).toBeVisible();
    
    await context.close();
  });
});

// اختبار الأداء
test.describe('اختبارات الأداء', () => {
  test('يجب أن يتم تحميل صفحة تسجيل الدخول بسرعة', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/login');
    
    const loadTime = Date.now() - startTime;
    console.log(`وقت تحميل صفحة تسجيل الدخول: ${loadTime}ms`);
    
    // التحقق من أن وقت التحميل أقل من 3 ثوانٍ
    expect(loadTime).toBeLessThan(3000);
  });
  
  test('يجب أن يتم تحميل لوحة التحكم بسرعة بعد تسجيل الدخول', async ({ page }) => {
    // تسجيل الدخول
    await page.goto('/login');
    await page.fill('input[formControlName="email"]', 'admin@adalalegalis.com');
    await page.fill('input[formControlName="password"]', 'password123');
    
    const startTime = Date.now();
    
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
    
    const loadTime = Date.now() - startTime;
    console.log(`وقت تحميل لوحة التحكم: ${loadTime}ms`);
    
    // التحقق من أن وقت التحميل أقل من 5 ثوانٍ
    expect(loadTime).toBeLessThan(5000);
  });
});
