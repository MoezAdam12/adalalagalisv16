import { Component, OnInit } from '@angular/core';
import { AccessibilityService } from '../../../core/services/accessibility.service';

/**
 * مكون لوحة إمكانية الوصول
 * يوفر واجهة مستخدم لتعديل إعدادات إمكانية الوصول
 */
@Component({
  selector: 'app-accessibility-panel',
  templateUrl: './accessibility-panel.component.html',
  styleUrls: ['./accessibility-panel.component.scss']
})
export class AccessibilityPanelComponent implements OnInit {
  // إعدادات إمكانية الوصول
  accessibilitySettings: any;
  
  // خيارات عائلة الخط
  fontFamilyOptions = [
    { value: 'default', label: 'الخط الافتراضي' },
    { value: 'dyslexic', label: 'خط عسر القراءة' },
    { value: 'readable', label: 'خط سهل القراءة' },
    { value: 'monospace', label: 'خط أحادي المسافة' }
  ];

  constructor(private accessibilityService: AccessibilityService) { }

  ngOnInit(): void {
    // الاشتراك في تغييرات إعدادات إمكانية الوصول
    this.accessibilityService.accessibilitySettings$.subscribe(settings => {
      this.accessibilitySettings = settings;
    });
  }

  /**
   * تحديث إعداد إمكانية الوصول
   * @param setting اسم الإعداد
   * @param value قيمة الإعداد
   */
  updateSetting(setting: string, value: any): void {
    const update = { [setting]: value };
    this.accessibilityService.updateSettings(update);
    
    // إعلان التغيير لقارئات الشاشة
    const settingName = this.getSettingDisplayName(setting);
    const stateText = typeof value === 'boolean' ? (value ? 'مفعل' : 'معطل') : value;
    this.accessibilityService.announceForScreenReader(`تم تغيير ${settingName} إلى ${stateText}`);
  }

  /**
   * تبديل إعداد منطقي
   * @param setting اسم الإعداد
   */
  toggleSetting(setting: string): void {
    const currentValue = this.accessibilitySettings[setting];
    this.updateSetting(setting, !currentValue);
  }

  /**
   * إعادة تعيين جميع الإعدادات إلى القيم الافتراضية
   */
  resetAllSettings(): void {
    // إعادة تعيين جميع الإعدادات
    this.accessibilityService.updateSettings({
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReader: false,
      keyboardNavigation: true,
      autoFocus: true,
      textToSpeech: false,
      fontFamily: 'default'
    });
    
    // إعلان إعادة التعيين لقارئات الشاشة
    this.accessibilityService.announceForScreenReader('تمت إعادة تعيين جميع إعدادات إمكانية الوصول');
  }

  /**
   * الحصول على اسم العرض للإعداد
   * @param setting اسم الإعداد
   * @returns اسم العرض
   */
  private getSettingDisplayName(setting: string): string {
    const displayNames = {
      highContrast: 'وضع التباين العالي',
      largeText: 'وضع النص الكبير',
      reducedMotion: 'تقليل الحركة',
      screenReader: 'دعم قارئ الشاشة',
      keyboardNavigation: 'التنقل بلوحة المفاتيح',
      autoFocus: 'التركيز التلقائي',
      textToSpeech: 'تحويل النص إلى كلام',
      fontFamily: 'عائلة الخط'
    };
    
    return displayNames[setting] || setting;
  }
}
