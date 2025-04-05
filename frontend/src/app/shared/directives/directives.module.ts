import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccessibilityDirective } from './accessibility.directive';
import { MobileExperienceDirective } from './mobile-experience.directive';

/**
 * وحدة التوجيهات المشتركة
 * تجمع جميع التوجيهات المشتركة في التطبيق
 */
@NgModule({
  declarations: [
    AccessibilityDirective,
    MobileExperienceDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    AccessibilityDirective,
    MobileExperienceDirective
  ]
})
export class DirectivesModule { }
