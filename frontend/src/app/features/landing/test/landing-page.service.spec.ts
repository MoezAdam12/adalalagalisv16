import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { LandingPageService } from '../services/landing-page.service';
import { environment } from '../../../environments/environment';

describe('LandingPageService', () => {
  let service: LandingPageService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LandingPageService]
    });
    service = TestBed.inject(LandingPageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should submit contact form', () => {
    const formData = {
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Test Subject',
      message: 'Test Message'
    };
    const mockResponse = { success: true };

    service.submitContactForm(formData).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/contact`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(formData);
    req.flush(mockResponse);
  });

  it('should subscribe to newsletter', () => {
    const email = 'test@example.com';
    const mockResponse = { success: true };

    service.subscribeToNewsletter(email).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/newsletter/subscribe`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email });
    req.flush(mockResponse);
  });

  it('should get pricing plans', () => {
    const mockPlans = [
      { id: 1, name: 'Basic', price: 299 },
      { id: 2, name: 'Professional', price: 599 },
      { id: 3, name: 'Enterprise', price: 999 }
    ];

    service.getPricingPlans().subscribe(plans => {
      expect(plans).toEqual(mockPlans);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/plans`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPlans);
  });

  it('should get testimonials', () => {
    const mockTestimonials = [
      { id: 1, name: 'أحمد الشمري', position: 'شريك في مكتب الشمري للمحاماة', content: 'نظام Adalalegalis غيّر طريقة عملنا بشكل كامل.' },
      { id: 2, name: 'سارة العتيبي', position: 'مديرة مكتب العتيبي للاستشارات القانونية', content: 'الدعم الفني ممتاز والفريق متعاون جدًا.' }
    ];

    service.getTestimonials().subscribe(testimonials => {
      expect(testimonials).toEqual(mockTestimonials);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/testimonials`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTestimonials);
  });

  it('should start free trial', () => {
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Password123',
      companyName: 'Test Company',
      plan: 'professional'
    };
    const mockResponse = { success: true, token: 'test-token' };

    service.startFreeTrial(userData).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(userData);
    req.flush(mockResponse);
  });
});
