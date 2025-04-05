import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ErrorHandlingService } from './error-handling.service';
import { MessageService } from 'primeng/api';

/**
 * اختبارات خدمة معالجة الأخطاء
 */
describe('ErrorHandlingService', () => {
  let service: ErrorHandlingService;
  let httpTestingController: HttpTestingController;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;

  // إعداد الاختبار قبل كل حالة اختبار
  beforeEach(() => {
    // إنشاء تجسس على خدمة الرسائل
    messageServiceSpy = jasmine.createSpyObj('MessageService', ['add']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ErrorHandlingService,
        { provide: MessageService, useValue: messageServiceSpy }
      ]
    });
    
    service = TestBed.inject(ErrorHandlingService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  // التنظيف بعد كل اختبار
  afterEach(() => {
    httpTestingController.verify();
  });

  // التحقق من إنشاء الخدمة بنجاح
  it('يجب إنشاء الخدمة', () => {
    expect(service).toBeTruthy();
  });

  // التحقق من معالجة خطأ HTTP
  it('يجب معالجة خطأ HTTP بشكل صحيح', () => {
    const errorResponse = {
      status: 404,
      statusText: 'Not Found',
      error: { message: 'Resource not found' }
    };
    
    // استدعاء طريقة معالجة الخطأ
    service.handleHttpError(errorResponse as any);
    
    // التحقق من استدعاء خدمة الرسائل
    expect(messageServiceSpy.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'خطأ',
      detail: 'لم يتم العثور على المورد المطلوب',
      life: 5000
    });
  });

  // التحقق من معالجة خطأ التحقق من الصحة
  it('يجب معالجة خطأ التحقق من الصحة بشكل صحيح', () => {
    const validationErrors = {
      name: 'الاسم مطلوب',
      email: 'البريد الإلكتروني غير صالح'
    };
    
    // استدعاء طريقة معالجة الخطأ
    service.handleValidationErrors(validationErrors);
    
    // التحقق من استدعاء خدمة الرسائل
    expect(messageServiceSpy.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'خطأ في التحقق من الصحة',
      detail: 'الاسم مطلوب, البريد الإلكتروني غير صالح',
      life: 5000
    });
  });

  // التحقق من معالجة خطأ عام
  it('يجب معالجة خطأ عام بشكل صحيح', () => {
    const error = new Error('حدث خطأ غير متوقع');
    
    // استدعاء طريقة معالجة الخطأ
    service.handleError(error);
    
    // التحقق من استدعاء خدمة الرسائل
    expect(messageServiceSpy.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'خطأ',
      detail: 'حدث خطأ غير متوقع',
      life: 5000
    });
  });

  // التحقق من تسجيل الخطأ
  it('يجب تسجيل الخطأ بشكل صحيح', () => {
    const error = new Error('حدث خطأ غير متوقع');
    
    // تجسس على console.error
    spyOn(console, 'error');
    
    // استدعاء طريقة تسجيل الخطأ
    service.logError(error);
    
    // التحقق من استدعاء console.error
    expect(console.error).toHaveBeenCalledWith('خطأ:', error);
  });

  // التحقق من إرسال الخطأ إلى الخادم
  it('يجب إرسال الخطأ إلى الخادم بشكل صحيح', () => {
    const error = new Error('حدث خطأ غير متوقع');
    
    // استدعاء طريقة إرسال الخطأ
    service.reportErrorToServer(error).subscribe(response => {
      expect(response.success).toBeTruthy();
    });
    
    // محاكاة استجابة الخادم
    const req = httpTestingController.expectOne('/api/error-reporting');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body.message).toEqual('حدث خطأ غير متوقع');
    req.flush({ success: true });
  });

  // التحقق من عرض رسالة خطأ
  it('يجب عرض رسالة خطأ بشكل صحيح', () => {
    // استدعاء طريقة عرض رسالة خطأ
    service.showErrorMessage('حدث خطأ في النظام');
    
    // التحقق من استدعاء خدمة الرسائل
    expect(messageServiceSpy.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'خطأ',
      detail: 'حدث خطأ في النظام',
      life: 5000
    });
  });

  // التحقق من عرض رسالة تحذير
  it('يجب عرض رسالة تحذير بشكل صحيح', () => {
    // استدعاء طريقة عرض رسالة تحذير
    service.showWarningMessage('يرجى الانتباه');
    
    // التحقق من استدعاء خدمة الرسائل
    expect(messageServiceSpy.add).toHaveBeenCalledWith({
      severity: 'warn',
      summary: 'تحذير',
      detail: 'يرجى الانتباه',
      life: 5000
    });
  });

  // التحقق من عرض رسالة نجاح
  it('يجب عرض رسالة نجاح بشكل صحيح', () => {
    // استدعاء طريقة عرض رسالة نجاح
    service.showSuccessMessage('تمت العملية بنجاح');
    
    // التحقق من استدعاء خدمة الرسائل
    expect(messageServiceSpy.add).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'نجاح',
      detail: 'تمت العملية بنجاح',
      life: 3000
    });
  });

  // التحقق من عرض رسالة معلومات
  it('يجب عرض رسالة معلومات بشكل صحيح', () => {
    // استدعاء طريقة عرض رسالة معلومات
    service.showInfoMessage('معلومات مهمة');
    
    // التحقق من استدعاء خدمة الرسائل
    expect(messageServiceSpy.add).toHaveBeenCalledWith({
      severity: 'info',
      summary: 'معلومات',
      detail: 'معلومات مهمة',
      life: 3000
    });
  });
});
