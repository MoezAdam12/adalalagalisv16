/**
 * test.config.ts
 * ملف تكوين الاختبارات للواجهة الأمامية
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SharedModule } from '../app/shared/shared.module';

/**
 * تكوين الاختبارات الأساسي
 * يوفر الوحدات والخدمات الشائعة المستخدمة في معظم اختبارات الوحدات
 */
export const TestConfig = {
  /**
   * تكوين الاختبارات الأساسي
   * @returns تكوين TestBed الأساسي
   */
  getBaseTestConfig() {
    return {
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        TranslateModule.forRoot(),
        BrowserAnimationsModule,
        ReactiveFormsModule,
        FormsModule,
        MatSnackBarModule,
        SharedModule
      ],
      providers: []
    };
  },

  /**
   * إعداد TestBed بالتكوين الأساسي
   * @param additionalConfig تكوين إضافي لدمجه مع التكوين الأساسي
   */
  configureTestingModule(additionalConfig = {}) {
    const baseConfig = this.getBaseTestConfig();
    const mergedConfig = {
      imports: [...(baseConfig.imports || []), ...(additionalConfig.imports || [])],
      declarations: [...(additionalConfig.declarations || [])],
      providers: [...(baseConfig.providers || []), ...(additionalConfig.providers || [])],
      schemas: [...(additionalConfig.schemas || [])]
    };

    TestBed.configureTestingModule(mergedConfig);
  }
};

/**
 * أدوات مساعدة للاختبارات
 */
export class TestHelpers {
  /**
   * إنشاء نسخة وهمية من خدمة
   * @param methods قائمة الدوال التي يجب تنفيذها
   * @returns نسخة وهمية من الخدمة
   */
  static createMockService(methods = {}) {
    return jasmine.createSpyObj('MockService', {
      ...methods
    });
  }

  /**
   * إنشاء استجابة وهمية لـ HttpClient
   * @param body محتوى الاستجابة
   * @param status رمز حالة الاستجابة
   * @returns كائن استجابة وهمي
   */
  static createHttpResponse(body: any, status = 200) {
    return {
      body,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      headers: { get: () => 'application/json' },
      ok: status >= 200 && status < 300,
      type: 3,
      url: 'https://api.adalalegalis.com/api'
    };
  }

  /**
   * انتظار فترة زمنية محددة
   * @param ms عدد المللي ثانية للانتظار
   * @returns وعد يتم حله بعد الفترة الزمنية المحددة
   */
  static wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * تنفيذ اختبار غير متزامن
   * @param callback دالة الاختبار
   * @param timeout مهلة الاختبار بالمللي ثانية
   */
  static async(callback: Function, timeout = 5000) {
    return (done: DoneFn) => {
      callback().then(done).catch(done.fail);
    };
  }

  /**
   * محاكاة حدث تغيير القيمة في عنصر إدخال
   * @param element عنصر الإدخال
   * @param value القيمة الجديدة
   */
  static simulateInputChange(element: HTMLInputElement, value: string) {
    element.value = value;
    element.dispatchEvent(new Event('input'));
    element.dispatchEvent(new Event('change'));
  }

  /**
   * محاكاة حدث نقر على عنصر
   * @param element العنصر المراد النقر عليه
   */
  static simulateClick(element: HTMLElement) {
    element.click();
    element.dispatchEvent(new Event('click'));
  }
}

/**
 * بيانات اختبار وهمية
 */
export const MockData = {
  /**
   * بيانات مستخدم وهمية
   */
  users: [
    {
      id: '1',
      username: 'admin',
      email: 'admin@adalalegalis.com',
      firstName: 'مدير',
      lastName: 'النظام',
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'admin'],
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: '2',
      username: 'lawyer',
      email: 'lawyer@adalalegalis.com',
      firstName: 'محامي',
      lastName: 'قانوني',
      role: 'lawyer',
      permissions: ['read', 'write'],
      createdAt: '2023-01-02T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z'
    },
    {
      id: '3',
      username: 'client',
      email: 'client@example.com',
      firstName: 'عميل',
      lastName: 'قانوني',
      role: 'client',
      permissions: ['read'],
      createdAt: '2023-01-03T00:00:00.000Z',
      updatedAt: '2023-01-03T00:00:00.000Z'
    }
  ],

  /**
   * بيانات قضايا وهمية
   */
  cases: [
    {
      id: '1',
      title: 'قضية مدنية',
      description: 'قضية مدنية متعلقة بنزاع عقاري',
      caseNumber: 'C-2023-001',
      caseType: 'civil',
      status: 'active',
      clientId: '3',
      assignedTo: '2',
      courtName: 'المحكمة المدنية',
      filingDate: '2023-02-01T00:00:00.000Z',
      hearingDate: '2023-03-15T10:00:00.000Z',
      createdAt: '2023-02-01T00:00:00.000Z',
      updatedAt: '2023-02-01T00:00:00.000Z'
    },
    {
      id: '2',
      title: 'قضية تجارية',
      description: 'قضية تجارية متعلقة بعقد توريد',
      caseNumber: 'C-2023-002',
      caseType: 'commercial',
      status: 'pending',
      clientId: '3',
      assignedTo: '2',
      courtName: 'المحكمة التجارية',
      filingDate: '2023-02-15T00:00:00.000Z',
      hearingDate: '2023-04-01T11:00:00.000Z',
      createdAt: '2023-02-15T00:00:00.000Z',
      updatedAt: '2023-02-15T00:00:00.000Z'
    }
  ],

  /**
   * بيانات عقود وهمية
   */
  contracts: [
    {
      id: '1',
      title: 'عقد إيجار',
      description: 'عقد إيجار سكني',
      contractNumber: 'CNT-2023-001',
      contractType: 'rental',
      status: 'active',
      clientId: '3',
      assignedTo: '2',
      startDate: '2023-01-01T00:00:00.000Z',
      endDate: '2024-01-01T00:00:00.000Z',
      value: 50000,
      currency: 'SAR',
      createdAt: '2022-12-15T00:00:00.000Z',
      updatedAt: '2022-12-15T00:00:00.000Z'
    },
    {
      id: '2',
      title: 'عقد عمل',
      description: 'عقد عمل لوظيفة قانونية',
      contractNumber: 'CNT-2023-002',
      contractType: 'employment',
      status: 'draft',
      clientId: '3',
      assignedTo: '2',
      startDate: '2023-03-01T00:00:00.000Z',
      endDate: '2024-03-01T00:00:00.000Z',
      value: 120000,
      currency: 'SAR',
      createdAt: '2023-02-20T00:00:00.000Z',
      updatedAt: '2023-02-20T00:00:00.000Z'
    }
  ],

  /**
   * بيانات استشارات قانونية وهمية
   */
  consultations: [
    {
      id: '1',
      title: 'استشارة قانونية عقارية',
      description: 'استشارة حول شراء عقار تجاري',
      consultationType: 'real_estate',
      status: 'completed',
      clientId: '3',
      assignedTo: '2',
      date: '2023-02-10T14:00:00.000Z',
      duration: 60,
      fee: 500,
      currency: 'SAR',
      notes: 'تم تقديم النصائح اللازمة للعميل',
      createdAt: '2023-02-05T00:00:00.000Z',
      updatedAt: '2023-02-10T15:00:00.000Z'
    },
    {
      id: '2',
      title: 'استشارة قانونية تجارية',
      description: 'استشارة حول تأسيس شركة',
      consultationType: 'commercial',
      status: 'scheduled',
      clientId: '3',
      assignedTo: '2',
      date: '2023-03-20T10:00:00.000Z',
      duration: 90,
      fee: 800,
      currency: 'SAR',
      notes: '',
      createdAt: '2023-03-15T00:00:00.000Z',
      updatedAt: '2023-03-15T00:00:00.000Z'
    }
  ],

  /**
   * بيانات مهام وهمية
   */
  tasks: [
    {
      id: '1',
      title: 'إعداد مذكرة قانونية',
      description: 'إعداد مذكرة قانونية للقضية رقم C-2023-001',
      taskType: 'legal_memo',
      status: 'in_progress',
      priority: 'high',
      assignedTo: '2',
      assignedBy: '1',
      relatedTo: { type: 'case', id: '1' },
      dueDate: '2023-03-10T00:00:00.000Z',
      completedAt: null,
      createdAt: '2023-03-01T00:00:00.000Z',
      updatedAt: '2023-03-05T00:00:00.000Z'
    },
    {
      id: '2',
      title: 'مراجعة عقد',
      description: 'مراجعة عقد الإيجار رقم CNT-2023-001',
      taskType: 'contract_review',
      status: 'completed',
      priority: 'medium',
      assignedTo: '2',
      assignedBy: '1',
      relatedTo: { type: 'contract', id: '1' },
      dueDate: '2023-02-20T00:00:00.000Z',
      completedAt: '2023-02-18T00:00:00.000Z',
      createdAt: '2023-02-15T00:00:00.000Z',
      updatedAt: '2023-02-18T00:00:00.000Z'
    }
  ]
};
