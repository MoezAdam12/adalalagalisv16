import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent implements OnInit {
  isAuthenticated = false;
  isScrolled = false;
  currentYear = new Date().getFullYear();
  
  // بيانات الشرائح
  slides = [
    {
      title: 'إدارة القضايا القانونية بكفاءة',
      description: 'منصة متكاملة لإدارة جميع جوانب القضايا القانونية من البداية إلى النهاية.',
      image: 'assets/images/landing/slide1.jpg',
      buttonText: 'اكتشف المزيد',
      buttonLink: '#features'
    },
    {
      title: 'تتبع المواعيد والجلسات',
      description: 'لا تفوت أي موعد أو جلسة مهمة مع نظام التنبيهات المتقدم.',
      image: 'assets/images/landing/slide2.jpg',
      buttonText: 'تعرف على المميزات',
      buttonLink: '#features'
    },
    {
      title: 'إدارة العقود والاستشارات',
      description: 'إنشاء وإدارة العقود والاستشارات القانونية بسهولة وفعالية.',
      image: 'assets/images/landing/slide3.jpg',
      buttonText: 'ابدأ الآن',
      buttonLink: '#pricing'
    }
  ];
  
  // بيانات المميزات
  features = [
    {
      icon: 'fa-gavel',
      title: 'إدارة القضايا',
      description: 'إدارة شاملة للقضايا مع تتبع جميع التفاصيل والمستندات والجلسات.'
    },
    {
      icon: 'fa-file-contract',
      title: 'إدارة العقود',
      description: 'إنشاء وإدارة العقود القانونية مع قوالب قابلة للتخصيص وتنبيهات التجديد.'
    },
    {
      icon: 'fa-comments',
      title: 'الاستشارات القانونية',
      description: 'تقديم وإدارة الاستشارات القانونية للعملاء بكفاءة وسهولة.'
    },
    {
      icon: 'fa-tasks',
      title: 'إدارة المهام',
      description: 'تنظيم وتتبع المهام والمواعيد النهائية لضمان إنجاز العمل في الوقت المحدد.'
    },
    {
      icon: 'fa-calendar-alt',
      title: 'التقويم والمواعيد',
      description: 'جدولة وتتبع المواعيد والجلسات والمهام في تقويم متكامل.'
    },
    {
      icon: 'fa-chart-line',
      title: 'التقارير والتحليلات',
      description: 'تحليلات متقدمة وتقارير مفصلة لمساعدتك في اتخاذ قرارات أفضل.'
    }
  ];
  
  // بيانات الأسعار
  pricingPlans = [
    {
      name: 'الأساسية',
      price: '99',
      period: 'شهرياً',
      features: [
        'إدارة القضايا (حتى 50 قضية)',
        'إدارة العقود (حتى 30 عقد)',
        'الاستشارات القانونية (حتى 20 استشارة شهرياً)',
        'إدارة المهام الأساسية',
        'التقويم والمواعيد',
        'دعم فني عبر البريد الإلكتروني'
      ],
      buttonText: 'ابدأ الآن',
      isPopular: false
    },
    {
      name: 'الاحترافية',
      price: '199',
      period: 'شهرياً',
      features: [
        'إدارة القضايا (غير محدود)',
        'إدارة العقود (غير محدود)',
        'الاستشارات القانونية (غير محدود)',
        'إدارة المهام المتقدمة',
        'التقويم والمواعيد مع التكامل مع Google Calendar',
        'التقارير والتحليلات',
        'دعم فني على مدار الساعة',
        'تخصيص واجهة المستخدم'
      ],
      buttonText: 'ابدأ الآن',
      isPopular: true
    },
    {
      name: 'المؤسسات',
      price: '399',
      period: 'شهرياً',
      features: [
        'جميع ميزات الخطة الاحترافية',
        'إدارة متعددة المستخدمين',
        'إدارة الأذونات والصلاحيات',
        'تكامل API مخصص',
        'تدريب وإعداد مخصص',
        'نسخ احتياطي وأمان متقدم',
        'مدير حساب مخصص'
      ],
      buttonText: 'اتصل بنا',
      isPopular: false
    }
  ];
  
  // بيانات الشهادات
  testimonials = [
    {
      quote: 'منصة Adalalegalis غيرت طريقة إدارتنا للقضايا القانونية. أصبح كل شيء أكثر تنظيماً وكفاءة.',
      author: 'أحمد محمد',
      position: 'محامي، مكتب المحاماة الدولي',
      image: 'assets/images/landing/testimonial1.jpg'
    },
    {
      quote: 'ساعدتنا المنصة على توفير الوقت والجهد في إدارة العقود والاستشارات القانونية. أنصح بها بشدة.',
      author: 'سارة أحمد',
      position: 'مستشار قانوني، شركة الاتحاد للاستثمار',
      image: 'assets/images/landing/testimonial2.jpg'
    },
    {
      quote: 'واجهة سهلة الاستخدام وميزات قوية. أصبحت إدارة مكتبنا القانوني أكثر فعالية بفضل Adalalegalis.',
      author: 'خالد العمري',
      position: 'شريك إداري، مكتب العمري وشركاه للمحاماة',
      image: 'assets/images/landing/testimonial3.jpg'
    }
  ];
  
  // بيانات الأسئلة الشائعة
  faqs = [
    {
      question: 'ما هي منصة Adalalegalis؟',
      answer: 'Adalalegalis هي منصة متكاملة لإدارة المكاتب القانونية، توفر أدوات لإدارة القضايا والعقود والاستشارات القانونية والمهام والمواعيد وغيرها من الجوانب المهمة في العمل القانوني.',
      isOpen: true
    },
    {
      question: 'هل يمكنني تجربة المنصة قبل الاشتراك؟',
      answer: 'نعم، نوفر فترة تجريبية مجانية لمدة 14 يوماً للتعرف على جميع ميزات المنصة واختبار مدى ملاءمتها لاحتياجاتك.',
      isOpen: false
    },
    {
      question: 'كيف يمكنني الاشتراك في المنصة؟',
      answer: 'يمكنك الاشتراك في المنصة من خلال النقر على زر "ابدأ الآن" واختيار الخطة المناسبة لك، ثم إكمال عملية التسجيل وإدخال بيانات الدفع.',
      isOpen: false
    },
    {
      question: 'هل يمكنني ترقية اشتراكي في أي وقت؟',
      answer: 'نعم، يمكنك ترقية اشتراكك في أي وقت من لوحة التحكم الخاصة بك. سيتم احتساب الفرق في السعر بشكل تناسبي للفترة المتبقية من اشتراكك الحالي.',
      isOpen: false
    },
    {
      question: 'هل بياناتي آمنة على المنصة؟',
      answer: 'نعم، نحن نأخذ أمان البيانات على محمل الجد. نستخدم تشفير من طرف إلى طرف لحماية بياناتك، ونلتزم بأعلى معايير الأمان وحماية الخصوصية.',
      isOpen: false
    }
  ];
  
  // مؤشر الشريحة الحالية
  currentSlide = 0;
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
  }
  
  /**
   * الاستماع لحدث التمرير
   */
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }
  
  /**
   * التنقل إلى الشريحة التالية
   */
  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }
  
  /**
   * التنقل إلى الشريحة السابقة
   */
  prevSlide() {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }
  
  /**
   * التنقل إلى شريحة محددة
   * @param index مؤشر الشريحة
   */
  goToSlide(index: number) {
    this.currentSlide = index;
  }
  
  /**
   * فتح/إغلاق سؤال شائع
   * @param index مؤشر السؤال
   */
  toggleFaq(index: number) {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;
  }
  
  /**
   * التنقل إلى صفحة تسجيل الدخول
   */
  login() {
    this.router.navigate(['/auth/login']);
  }
  
  /**
   * التنقل إلى صفحة التسجيل
   */
  register() {
    this.router.navigate(['/auth/register']);
  }
  
  /**
   * التنقل إلى لوحة التحكم
   */
  dashboard() {
    this.router.navigate(['/dashboard']);
  }
  
  /**
   * التمرير إلى قسم محدد
   * @param sectionId معرف القسم
   */
  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
