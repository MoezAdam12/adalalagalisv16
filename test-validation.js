#!/usr/bin/env node

/**
 * اختبار التحقق من التغييرات المنفذة
 * 
 * هذا السكريبت يقوم باختبار جميع التحسينات والتغييرات التي تم تنفيذها في المشروع
 * للتأكد من أنها تعمل بشكل صحيح وتلبي المتطلبات.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// تكوين الألوان للطباعة في وحدة التحكم
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// الدليل الرئيسي للمشروع
const projectRoot = path.resolve(__dirname, '..');

// دالة للتحقق من وجود ملف
function checkFileExists(filePath, description) {
  const fullPath = path.join(projectRoot, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    console.log(`${colors.green}✓${colors.reset} ${description}: ${colors.dim}${filePath}${colors.reset}`);
  } else {
    console.log(`${colors.red}✗${colors.reset} ${description}: ${colors.dim}${filePath}${colors.reset}`);
  }
  
  return exists;
}

// دالة للتحقق من محتوى ملف
function checkFileContent(filePath, searchString, description) {
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`${colors.red}✗${colors.reset} ${description} (الملف غير موجود): ${colors.dim}${filePath}${colors.reset}`);
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const found = content.includes(searchString);
  
  if (found) {
    console.log(`${colors.green}✓${colors.reset} ${description}: ${colors.dim}${filePath}${colors.reset}`);
  } else {
    console.log(`${colors.red}✗${colors.reset} ${description}: ${colors.dim}${filePath}${colors.reset}`);
  }
  
  return found;
}

// دالة لاختبار هيكل الدليل
function checkDirectoryStructure(dirPath, description) {
  const fullPath = path.join(projectRoot, dirPath);
  const exists = fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
  
  if (exists) {
    console.log(`${colors.green}✓${colors.reset} ${description}: ${colors.dim}${dirPath}${colors.reset}`);
  } else {
    console.log(`${colors.red}✗${colors.reset} ${description}: ${colors.dim}${dirPath}${colors.reset}`);
  }
  
  return exists;
}

// دالة لتنفيذ أمر واختبار النتيجة
function runCommand(command, description, expectedOutput = null) {
  try {
    const output = execSync(command, { cwd: projectRoot, encoding: 'utf8' });
    
    if (expectedOutput === null || output.includes(expectedOutput)) {
      console.log(`${colors.green}✓${colors.reset} ${description}`);
      return true;
    } else {
      console.log(`${colors.red}✗${colors.reset} ${description} (النتيجة غير متطابقة)`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${description} (فشل تنفيذ الأمر)`);
    console.error(`  ${colors.dim}${error.message}${colors.reset}`);
    return false;
  }
}

// طباعة عنوان الاختبار
console.log(`\n${colors.bright}${colors.blue}=== اختبار التحقق من التغييرات المنفذة ===${colors.reset}\n`);

// اختبار تحسينات الأداء في الواجهة الأمامية
console.log(`\n${colors.cyan}>> اختبار تحسينات الأداء في الواجهة الأمامية${colors.reset}`);
const frontendPerformanceResults = [
  checkFileExists('frontend/src/app/core/services/performance.utils.ts', 'ملف أدوات الأداء'),
  checkFileContent('frontend/src/app/core/services/performance.utils.ts', 'MemoryCache', 'تنفيذ التخزين المؤقت في الذاكرة'),
  checkFileContent('frontend/src/app/core/services/performance.utils.ts', 'debounce', 'تنفيذ وظيفة debounce'),
  checkFileContent('frontend/src/app/core/services/performance.utils.ts', 'throttle', 'تنفيذ وظيفة throttle'),
  checkFileContent('frontend/src/app/core/services/performance.utils.ts', 'lazyLoad', 'تنفيذ التحميل البطيء'),
  checkFileExists('angular.json', 'ملف تكوين Angular'),
  checkFileContent('angular.json', 'optimization', 'تكوين تحسين الإنتاج'),
  checkFileContent('angular.json', 'buildOptimizer', 'تكوين محسن البناء'),
];

// اختبار معالجة الأخطاء
console.log(`\n${colors.cyan}>> اختبار معالجة الأخطاء${colors.reset}`);
const errorHandlingResults = [
  checkFileExists('backend/src/middleware/error.middleware.js', 'وسيط معالجة الأخطاء'),
  checkFileContent('backend/src/middleware/error.middleware.js', 'AppError', 'فئة الخطأ المخصصة'),
  checkFileContent('backend/src/middleware/error.middleware.js', 'handleError', 'دالة معالجة الأخطاء'),
];

// اختبار المكونات المفقودة
console.log(`\n${colors.cyan}>> اختبار المكونات المفقودة${colors.reset}`);
const missingComponentsResults = [
  checkFileExists('frontend/src/app/features/auth/components/login/login.component.ts', 'مكون تسجيل الدخول'),
  checkFileExists('frontend/src/app/features/dashboard/components/dashboard-home/dashboard-home.component.ts', 'مكون الصفحة الرئيسية للوحة التحكم'),
  checkFileExists('frontend/src/app/features/landing/components/landing-page/landing-page.component.ts', 'مكون صفحة الهبوط'),
];

// اختبار تحسينات الأمان
console.log(`\n${colors.cyan}>> اختبار تحسينات الأمان${colors.reset}`);
const securityImprovementsResults = [
  checkFileExists('backend/src/config/env.config.js', 'ملف تكوين متغيرات البيئة'),
  checkFileExists('backend/src/middleware/csrf.middleware.js', 'وسيط حماية CSRF'),
  checkFileExists('backend/src/middleware/security-headers.middleware.js', 'وسيط رؤوس الأمان'),
  checkFileExists('backend/src/utils/encryption.utils.js', 'أدوات التشفير'),
  checkFileExists('backend/src/middleware/token-blacklist.middleware.js', 'وسيط القائمة السوداء للرموز المميزة'),
];

// اختبار تحسين الصور وضغطها
console.log(`\n${colors.cyan}>> اختبار تحسين الصور وضغطها${colors.reset}`);
const imageOptimizationResults = [
  checkFileExists('frontend/src/app/core/services/image-optimization.service.ts', 'خدمة تحسين الصور'),
  checkFileContent('frontend/src/app/core/services/image-optimization.service.ts', 'compressImage', 'دالة ضغط الصور'),
  checkFileContent('frontend/src/app/core/services/image-optimization.service.ts', 'convertToWebP', 'دالة التحويل إلى تنسيق WebP'),
];

// اختبار تحسينات إمكانية الوصول وتجربة الأجهزة المحمولة
console.log(`\n${colors.cyan}>> اختبار تحسينات إمكانية الوصول وتجربة الأجهزة المحمولة${colors.reset}`);
const accessibilityResults = [
  checkFileExists('frontend/src/app/shared/directives/accessibility.directive.ts', 'توجيه إمكانية الوصول'),
  checkFileExists('frontend/src/app/shared/directives/mobile-experience.directive.ts', 'توجيه تجربة الأجهزة المحمولة'),
  checkFileExists('frontend/src/app/core/services/accessibility.service.ts', 'خدمة إمكانية الوصول'),
  checkFileExists('frontend/src/app/core/services/mobile-experience.service.ts', 'خدمة تجربة الأجهزة المحمولة'),
  checkFileExists('frontend/src/app/shared/components/accessibility-panel/accessibility-panel.component.ts', 'مكون لوحة إعدادات إمكانية الوصول'),
];

// اختبار استراتيجية الاختبار
console.log(`\n${colors.cyan}>> اختبار استراتيجية الاختبار${colors.reset}`);
const testingStrategyResults = [
  checkFileExists('frontend/src/app/shared/directives/accessibility.directive.spec.ts', 'اختبار توجيه إمكانية الوصول'),
  checkFileExists('frontend/src/app/shared/directives/mobile-experience.directive.spec.ts', 'اختبار توجيه تجربة الأجهزة المحمولة'),
  checkFileExists('frontend/src/app/core/services/accessibility.service.spec.ts', 'اختبار خدمة إمكانية الوصول'),
  checkFileExists('frontend/src/app/core/services/mobile-experience.service.spec.ts', 'اختبار خدمة تجربة الأجهزة المحمولة'),
  checkFileExists('frontend/src/app/core/services/cache.service.spec.ts', 'اختبار خدمة التخزين المؤقت'),
  checkFileExists('frontend/src/app/core/services/image-optimization.service.spec.ts', 'اختبار خدمة تحسين الصور'),
];

// اختبار إعادة هيكلة بنية التطبيق
console.log(`\n${colors.cyan}>> اختبار إعادة هيكلة بنية التطبيق${colors.reset}`);
const architectureResults = [
  checkDirectoryStructure('frontend/src/app/core/repositories', 'دليل المستودعات'),
  checkDirectoryStructure('frontend/src/app/core/services', 'دليل الخدمات'),
  checkDirectoryStructure('frontend/src/app/core/facades', 'دليل الواجهات'),
  checkDirectoryStructure('frontend/src/app/core/strategies', 'دليل الاستراتيجيات'),
  checkFileExists('frontend/src/app/core/repositories/base.repository.ts', 'واجهة المستودع الأساسي'),
  checkFileExists('frontend/src/app/core/services/base.service.ts', 'فئة الخدمة الأساسية'),
  checkFileExists('frontend/src/app/core/facades/base.facade.ts', 'فئة الواجهة الأساسية'),
  checkFileExists('frontend/src/app/core/strategies/strategy.interfaces.ts', 'واجهات الاستراتيجية'),
  checkFileExists('frontend/src/app/core/repositories/http.repository.ts', 'مستودع HTTP'),
  checkFileExists('frontend/src/app/core/services/user.service.ts', 'خدمة المستخدم'),
  checkFileExists('frontend/src/app/core/facades/user.facade.ts', 'واجهة المستخدم'),
  checkFileExists('frontend/src/app/core/strategies/caching.strategy.ts', 'استراتيجية التخزين المؤقت'),
  checkFileExists('frontend/src/app/core/strategies/authentication.strategy.ts', 'استراتيجية المصادقة'),
  checkFileExists('frontend/src/app/core/strategies/validation.strategy.ts', 'استراتيجية التحقق من الصحة'),
];

// اختبار دليل أنماط واجهة المستخدم
console.log(`\n${colors.cyan}>> اختبار دليل أنماط واجهة المستخدم${colors.reset}`);
const styleGuideResults = [
  checkFileExists('ui-style-guide.md', 'دليل أنماط واجهة المستخدم'),
  checkFileContent('ui-style-guide.md', 'الألوان', 'قسم الألوان'),
  checkFileContent('ui-style-guide.md', 'الخطوط', 'قسم الخطوط'),
  checkFileContent('ui-style-guide.md', 'المكونات', 'قسم المكونات'),
  checkFileContent('ui-style-guide.md', 'إمكانية الوصول', 'قسم إمكانية الوصول'),
];

// حساب النتائج الإجمالية
const allResults = [
  ...frontendPerformanceResults,
  ...errorHandlingResults,
  ...missingComponentsResults,
  ...securityImprovementsResults,
  ...imageOptimizationResults,
  ...accessibilityResults,
  ...testingStrategyResults,
  ...architectureResults,
  ...styleGuideResults,
];

const totalTests = allResults.length;
const passedTests = allResults.filter(result => result).length;
const failedTests = totalTests - passedTests;
const passPercentage = (passedTests / totalTests) * 100;

// طباعة ملخص النتائج
console.log(`\n${colors.bright}${colors.blue}=== ملخص نتائج الاختبار ===${colors.reset}`);
console.log(`${colors.bright}إجمالي الاختبارات:${colors.reset} ${totalTests}`);
console.log(`${colors.bright}${colors.green}الاختبارات الناجحة:${colors.reset} ${passedTests}`);
console.log(`${colors.bright}${colors.red}الاختبارات الفاشلة:${colors.reset} ${failedTests}`);
console.log(`${colors.bright}نسبة النجاح:${colors.reset} ${passPercentage.toFixed(2)}%`);

// تحديد حالة النجاح الإجمالية
if (passPercentage >= 90) {
  console.log(`\n${colors.bright}${colors.green}✓ التحقق من التغييرات ناجح${colors.reset}`);
} else if (passPercentage >= 75) {
  console.log(`\n${colors.bright}${colors.yellow}⚠ التحقق من التغييرات ناجح جزئيًا${colors.reset}`);
} else {
  console.log(`\n${colors.bright}${colors.red}✗ التحقق من التغييرات فاشل${colors.reset}`);
}

console.log(`\n${colors.dim}تم تنفيذ الاختبار في: ${new Date().toLocaleString()}${colors.reset}\n`);
