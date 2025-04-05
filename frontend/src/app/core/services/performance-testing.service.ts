import { Injectable } from '@angular/core';
import { TestingStrategyService } from './testing-strategy.service';

/**
 * خدمة اختبارات الأداء
 * توفر وظائف وأدوات لإنشاء وتنفيذ اختبارات الأداء للتطبيق
 */
@Injectable({
  providedIn: 'root'
})
export class PerformanceTestingService {
  private testScenarios: Map<string, any[]> = new Map();
  
  constructor(private testingStrategy: TestingStrategyService) { }

  /**
   * إنشاء سيناريو اختبار أداء جديد
   * @param scenarioName اسم السيناريو
   * @param description وصف سيناريو الاختبار
   * @returns معرف سيناريو الاختبار
   */
  public createPerformanceScenario(scenarioName: string, description: string): string {
    const scenarioId = `${scenarioName}_${Date.now()}`;
    this.testScenarios.set(scenarioId, []);
    console.log(`تم إنشاء سيناريو اختبار أداء جديد: ${description} للسيناريو: ${scenarioName}`);
    return scenarioId;
  }

  /**
   * إضافة اختبار أداء إلى سيناريو
   * @param scenarioId معرف سيناريو الاختبار
   * @param test اختبار الأداء
   */
  public addPerformanceTest(scenarioId: string, test: {
    name: string;
    description: string;
    testFn: Function;
    iterations?: number;
    concurrentUsers?: number;
    rampUpPeriod?: number;
    duration?: number;
    thresholds?: {
      responseTime?: number;
      throughput?: number;
      errorRate?: number;
    };
    skip?: boolean;
  }): void {
    const scenario = this.testScenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`سيناريو اختبار الأداء غير موجود: ${scenarioId}`);
    }
    
    scenario.push({
      ...test,
      iterations: test.iterations || 1,
      concurrentUsers: test.concurrentUsers || 1,
      rampUpPeriod: test.rampUpPeriod || 0,
      duration: test.duration || 10000,
      thresholds: {
        responseTime: test.thresholds?.responseTime || 1000,
        throughput: test.thresholds?.throughput || 10,
        errorRate: test.thresholds?.errorRate || 0.01
      }
    });
    
    console.log(`تمت إضافة اختبار أداء: ${test.name} إلى سيناريو الاختبار: ${scenarioId}`);
  }

  /**
   * تشغيل سيناريو اختبار أداء
   * @param scenarioId معرف سيناريو الاختبار
   * @returns نتائج الاختبار
   */
  public async runPerformanceScenario(scenarioId: string): Promise<any> {
    const scenario = this.testScenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`سيناريو اختبار الأداء غير موجود: ${scenarioId}`);
    }
    
    console.log(`بدء تشغيل سيناريو اختبار الأداء: ${scenarioId} مع ${scenario.length} اختبار`);
    
    const results = {
      scenarioId,
      total: scenario.length,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      tests: []
    };
    
    const startTime = Date.now();
    
    for (const test of scenario) {
      if (test.skip) {
        results.skipped++;
        results.tests.push({
          name: test.name,
          status: 'skipped',
          duration: 0,
          message: 'تم تخطي الاختبار'
        });
        continue;
      }
      
      try {
        const testStartTime = Date.now();
        const testResults = {
          name: test.name,
          iterations: test.iterations,
          concurrentUsers: test.concurrentUsers,
          duration: 0,
          responseTime: {
            min: Number.MAX_VALUE,
            max: 0,
            avg: 0,
            p95: 0,
            p99: 0
          },
          throughput: 0,
          errorRate: 0,
          errors: []
        };
        
        // محاكاة تنفيذ اختبار الأداء
        const responseTimes = [];
        let successCount = 0;
        let errorCount = 0;
        
        // محاكاة تنفيذ الاختبار لعدد محدد من المستخدمين المتزامنين
        const userPromises = [];
        for (let user = 0; user < test.concurrentUsers; user++) {
          // محاكاة فترة التصاعد
          const userDelay = (test.rampUpPeriod / test.concurrentUsers) * user;
          
          const userPromise = new Promise<void>(async (resolve) => {
            // تأخير بدء المستخدم حسب فترة التصاعد
            if (userDelay > 0) {
              await new Promise(r => setTimeout(r, userDelay));
            }
            
            // تنفيذ الاختبار لعدد محدد من التكرارات
            for (let i = 0; i < test.iterations; i++) {
              const iterationStartTime = Date.now();
              
              try {
                // تنفيذ دالة الاختبار
                await test.testFn({
                  user,
                  iteration: i,
                  startTime: iterationStartTime
                });
                
                const responseTime = Date.now() - iterationStartTime;
                responseTimes.push(responseTime);
                
                // تحديث إحصائيات الاستجابة
                testResults.responseTime.min = Math.min(testResults.responseTime.min, responseTime);
                testResults.responseTime.max = Math.max(testResults.responseTime.max, responseTime);
                
                successCount++;
              } catch (error) {
                errorCount++;
                testResults.errors.push({
                  user,
                  iteration: i,
                  message: error.message || 'خطأ غير معروف',
                  time: new Date().toISOString()
                });
              }
            }
            
            resolve();
          });
          
          userPromises.push(userPromise);
        }
        
        // انتظار اكتمال جميع المستخدمين
        await Promise.all(userPromises);
        
        const testDuration = Date.now() - testStartTime;
        testResults.duration = testDuration;
        
        // حساب متوسط وقت الاستجابة
        if (responseTimes.length > 0) {
          const sum = responseTimes.reduce((a, b) => a + b, 0);
          testResults.responseTime.avg = sum / responseTimes.length;
          
          // حساب الصدارة 95 و 99
          responseTimes.sort((a, b) => a - b);
          const p95Index = Math.floor(responseTimes.length * 0.95);
          const p99Index = Math.floor(responseTimes.length * 0.99);
          testResults.responseTime.p95 = responseTimes[p95Index];
          testResults.responseTime.p99 = responseTimes[p99Index];
        }
        
        // حساب الإنتاجية (عدد الطلبات في الثانية)
        const totalRequests = successCount + errorCount;
        testResults.throughput = (totalRequests / testDuration) * 1000;
        
        // حساب معدل الخطأ
        testResults.errorRate = errorCount / (successCount + errorCount);
        
        // التحقق من تجاوز العتبات
        const thresholdsPassed = 
          testResults.responseTime.avg <= test.thresholds.responseTime &&
          testResults.throughput >= test.thresholds.throughput &&
          testResults.errorRate <= test.thresholds.errorRate;
        
        if (thresholdsPassed) {
          results.passed++;
          results.tests.push({
            ...testResults,
            status: 'passed',
            message: 'تم اجتياز اختبار الأداء'
          });
        } else {
          results.failed++;
          results.tests.push({
            ...testResults,
            status: 'failed',
            message: 'فشل اختبار الأداء بسبب تجاوز العتبات'
          });
        }
      } catch (error) {
        results.failed++;
        results.tests.push({
          name: test.name,
          status: 'failed',
          duration: Date.now() - startTime,
          message: error.message || 'فشل اختبار الأداء',
          error: error
        });
      }
    }
    
    results.duration = Date.now() - startTime;
    
    console.log(`اكتمل تشغيل سيناريو اختبار الأداء: ${scenarioId}`);
    console.log(`النتائج: ${results.passed} ناجح، ${results.failed} فاشل، ${results.skipped} تم تخطيه`);
    
    return results;
  }

  /**
   * تشغيل جميع سيناريوهات اختبار الأداء
   * @returns نتائج الاختبار
   */
  public async runAllPerformanceScenarios(): Promise<any> {
    console.log(`بدء تشغيل جميع سيناريوهات اختبار الأداء: ${this.testScenarios.size} سيناريو`);
    
    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      scenarios: []
    };
    
    const startTime = Date.now();
    
    for (const [scenarioId, _] of this.testScenarios) {
      const scenarioResults = await this.runPerformanceScenario(scenarioId);
      
      results.total += scenarioResults.total;
      results.passed += scenarioResults.passed;
      results.failed += scenarioResults.failed;
      results.skipped += scenarioResults.skipped;
      results.scenarios.push(scenarioResults);
    }
    
    results.duration = Date.now() - startTime;
    
    console.log(`اكتمل تشغيل جميع سيناريوهات اختبار الأداء`);
    console.log(`النتائج الإجمالية: ${results.passed} ناجح، ${results.failed} فاشل، ${results.skipped} تم تخطيه`);
    
    // إرسال النتائج إلى خدمة استراتيجية الاختبار
    this.testingStrategy.setupPerformanceTests('all', results.scenarios);
    
    return results;
  }

  /**
   * إنشاء اختبار أداء تحميل الصفحة
   * @param pageName اسم الصفحة
   * @param url عنوان URL للصفحة
   * @param description وصف الاختبار
   */
  public createPageLoadTest(pageName: string, url: string, description: string): string {
    const scenarioId = this.createPerformanceScenario(`page_load_${pageName}`, description);
    
    this.addPerformanceTest(scenarioId, {
      name: `تحميل صفحة ${pageName}`,
      description: `قياس أداء تحميل صفحة ${pageName}`,
      testFn: async (context) => {
        // محاكاة قياس أداء تحميل الصفحة
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
        return Promise.resolve(true);
      },
      iterations: 10,
      concurrentUsers: 5,
      thresholds: {
        responseTime: 1000,
        throughput: 5,
        errorRate: 0.01
      }
    });
    
    return scenarioId;
  }

  /**
   * إنشاء اختبار أداء استدعاء API
   * @param apiName اسم واجهة API
   * @param endpoint نقطة النهاية
   * @param method طريقة الطلب
   * @param description وصف الاختبار
   */
  public createApiPerformanceTest(apiName: string, endpoint: string, method: string, description: string): string {
    const scenarioId = this.createPerformanceScenario(`api_${apiName}`, description);
    
    this.addPerformanceTest(scenarioId, {
      name: `أداء واجهة API ${apiName}`,
      description: `قياس أداء استدعاء واجهة API ${apiName} (${method} ${endpoint})`,
      testFn: async (context) => {
        // محاكاة قياس أداء استدعاء API
        await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
        return Promise.resolve(true);
      },
      iterations: 50,
      concurrentUsers: 10,
      rampUpPeriod: 5000,
      duration: 30000,
      thresholds: {
        responseTime: 500,
        throughput: 20,
        errorRate: 0.01
      }
    });
    
    return scenarioId;
  }

  /**
   * إنشاء اختبار أداء تحميل البيانات
   * @param dataType نوع البيانات
   * @param dataSize حجم البيانات
   * @param description وصف الاختبار
   */
  public createDataLoadTest(dataType: string, dataSize: string, description: string): string {
    const scenarioId = this.createPerformanceScenario(`data_load_${dataType}`, description);
    
    this.addPerformanceTest(scenarioId, {
      name: `تحميل بيانات ${dataType}`,
      description: `قياس أداء تحميل بيانات ${dataType} بحجم ${dataSize}`,
      testFn: async (context) => {
        // محاكاة قياس أداء تحميل البيانات
        await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 400));
        return Promise.resolve(true);
      },
      iterations: 5,
      concurrentUsers: 3,
      thresholds: {
        responseTime: 2000,
        throughput: 2,
        errorRate: 0.05
      }
    });
    
    return scenarioId;
  }

  /**
   * إنشاء اختبار أداء تحت الحمل
   * @param componentName اسم المكون
   * @param description وصف الاختبار
   */
  public createLoadTest(componentName: string, description: string): string {
    const scenarioId = this.createPerformanceScenario(`load_test_${componentName}`, description);
    
    this.addPerformanceTest(scenarioId, {
      name: `اختبار الحمل لـ ${componentName}`,
      description: `قياس أداء ${componentName} تحت الحمل`,
      testFn: async (context) => {
        // محاكاة قياس الأداء تحت الحمل
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        return Promise.resolve(true);
      },
      iterations: 1,
      concurrentUsers: 50,
      rampUpPeriod: 10000,
      duration: 60000,
      thresholds: {
        responseTime: 3000,
        throughput: 15,
        errorRate: 0.05
      }
    });
    
    return scenarioId;
  }

  /**
   * إنشاء اختبار أداء الضغط
   * @param componentName اسم المكون
   * @param description وصف الاختبار
   */
  public createStressTest(componentName: string, description: string): string {
    const scenarioId = this.createPerformanceScenario(`stress_test_${componentName}`, description);
    
    this.addPerformanceTest(scenarioId, {
      name: `اختبار الضغط لـ ${componentName}`,
      description: `قياس أداء ${componentName} تحت الضغط`,
      testFn: async (context) => {
        // محاكاة قياس الأداء تحت الضغط
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 800));
        return Promise.resolve(true);
      },
      iterations: 1,
      concurrentUsers: 100,
      rampUpPeriod: 20000,
      duration: 120000,
      thresholds: {
        responseTime: 5000,
        throughput: 10,
        errorRate: 0.1
      }
    });
    
    return scenarioId;
  }

  /**
   * إنشاء اختبار أداء التحمل
   * @param componentName اسم المكون
   * @param description وصف الاختبار
   */
  public createEnduranceTest(componentName: string, description: string): string {
    const scenarioId = this.createPerformanceScenario(`endurance_test_${componentName}`, description);
    
    this.addPerformanceTest(scenarioId, {
      name: `اختبار التحمل لـ ${componentName}`,
      description: `قياس أداء ${componentName} على المدى الطويل`,
      testFn: async (context) => {
        // محاكاة قياس الأداء على المدى الطويل
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 300));
        return Promise.resolve(true);
      },
      iterations: 10,
      concurrentUsers: 20,
      rampUpPeriod: 30000,
      duration: 300000,
      thresholds: {
        responseTime: 2000,
        throughput: 10,
        errorRate: 0.02
      }
    });
    
    return scenarioId;
  }
}
