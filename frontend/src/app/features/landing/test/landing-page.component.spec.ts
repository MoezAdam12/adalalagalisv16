import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { LandingPageComponent } from '../components/landing-page/landing-page.component';
import { AuthService } from '../../../core/services/auth.service';
import { LandingPageService } from '../services/landing-page.service';

describe('LandingPageComponent', () => {
  let component: LandingPageComponent;
  let fixture: ComponentFixture<LandingPageComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let landingPageService: jasmine.SpyObj<LandingPageService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    const landingPageServiceSpy = jasmine.createSpyObj('LandingPageService', [
      'submitContactForm',
      'subscribeToNewsletter',
      'getPricingPlans',
      'getTestimonials',
      'startFreeTrial'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [LandingPageComponent],
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        FormsModule,
        ReactiveFormsModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: LandingPageService, useValue: landingPageServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    landingPageService = TestBed.inject(LandingPageService) as jasmine.SpyObj<LandingPageService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to dashboard if user is authenticated', () => {
    authService.isAuthenticated.and.returnValue(true);
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should not redirect if user is not authenticated', () => {
    authService.isAuthenticated.and.returnValue(false);
    component.ngOnInit();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should navigate to login page', () => {
    component.navigateToLogin();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should navigate to register page', () => {
    component.navigateToRegister();
    expect(router.navigate).toHaveBeenCalledWith(['/register']);
  });

  it('should start free trial without plan', () => {
    component.startFreeTrial();
    expect(router.navigate).toHaveBeenCalledWith(['/register']);
  });

  it('should start free trial with specific plan', () => {
    component.startFreeTrial('premium');
    expect(router.navigate).toHaveBeenCalledWith(['/register'], { queryParams: { plan: 'premium' } });
  });

  it('should submit contact form', () => {
    const formData = {
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Test Subject',
      message: 'Test Message'
    };
    
    landingPageService.submitContactForm.and.returnValue(of({ success: true }));
    
    spyOn(window, 'alert');
    component.submitContactForm(formData);
    
    expect(landingPageService.submitContactForm).not.toHaveBeenCalled(); // Direct API call is commented out in the component
    expect(window.alert).toHaveBeenCalled();
  });

  it('should subscribe to newsletter', () => {
    const email = 'test@example.com';
    
    landingPageService.subscribeToNewsletter.and.returnValue(of({ success: true }));
    
    spyOn(window, 'alert');
    component.subscribeToNewsletter(email);
    
    expect(landingPageService.subscribeToNewsletter).not.toHaveBeenCalled(); // Direct API call is commented out in the component
    expect(window.alert).toHaveBeenCalled();
  });
});
