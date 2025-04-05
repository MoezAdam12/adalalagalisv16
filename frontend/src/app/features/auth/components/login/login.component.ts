import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  returnUrl: string;
  showPassword = false;
  requiresTwoFactor = false;
  twoFactorForm: FormGroup;
  
  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
    private errorHandler: ErrorHandlerService
  ) {
    // إعادة التوجيه إلى لوحة التحكم إذا كان المستخدم مسجل الدخول بالفعل
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnInit() {
    // إنشاء نموذج تسجيل الدخول
    this.loginForm = this.formBuilder.group({
      tenantAccountNumber: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });

    // إنشاء نموذج المصادقة الثنائية
    this.twoFactorForm = this.formBuilder.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    // الحصول على عنوان URL للعودة من معلمات الاستعلام أو استخدام '/dashboard' كقيمة افتراضية
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  // للوصول السهل إلى حقول النموذج
  get f() { return this.loginForm.controls; }
  get tf() { return this.twoFactorForm.controls; }

  onSubmit() {
    this.submitted = true;

    // التوقف إذا كان النموذج غير صالح
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.authService.login(
      this.f.tenantAccountNumber.value,
      this.f.email.value, 
      this.f.password.value, 
      this.f.rememberMe.value
    )
      .subscribe({
        next: (response) => {
          if (response.requiresTwoFactor) {
            // إذا كان المستخدم قد قام بتمكين المصادقة الثنائية، عرض نموذج المصادقة الثنائية
            this.requiresTwoFactor = true;
            this.loading = false;
          } else {
            // إذا لم يتم تمكين المصادقة الثنائية، إعادة التوجيه إلى عنوان URL للعودة
            this.notificationService.showNotification({
              type: 'success',
              message: 'تم تسجيل الدخول بنجاح',
              description: `مرحبًا بك، ${response.user.name}!`,
              duration: 3000
            });
            this.router.navigate([this.returnUrl]);
          }
        },
        error: (error) => {
          this.errorHandler.handleError(error);
          this.loading = false;
        }
      });
  }

  onSubmitTwoFactor() {
    this.submitted = true;

    // التوقف إذا كان نموذج المصادقة الثنائية غير صالح
    if (this.twoFactorForm.invalid) {
      return;
    }

    this.loading = true;
    this.authService.verifyTwoFactorCode(this.tf.code.value)
      .subscribe({
        next: (response) => {
          this.notificationService.showNotification({
            type: 'success',
            message: 'تم تسجيل الدخول بنجاح',
            description: `مرحبًا بك، ${response.user.name}!`,
            duration: 3000
          });
          this.router.navigate([this.returnUrl]);
        },
        error: (error) => {
          this.errorHandler.handleError(error);
          this.loading = false;
        }
      });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  forgotPassword() {
    this.router.navigate(['/auth/forgot-password']);
  }

  register() {
    this.router.navigate(['/auth/register']);
  }
}
