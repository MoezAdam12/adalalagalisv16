import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
      <app-header 
        [currentLang]="currentLang" 
        (toggleSidenav)="toggleSidenav()" 
        (changeLang)="switchLanguage($event)">
      </app-header>
      
      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav #sidenav mode="side" [opened]="sidenavOpened" class="app-sidenav">
          <app-sidenav></app-sidenav>
        </mat-sidenav>
        
        <mat-sidenav-content class="sidenav-content">
          <div class="main-content">
            <router-outlet></router-outlet>
          </div>
          <app-footer></app-footer>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
    }
    
    .sidenav-container {
      flex: 1;
    }
    
    .app-sidenav {
      width: 250px;
    }
    
    .sidenav-content {
      display: flex;
      flex-direction: column;
      min-height: 100%;
    }
    
    .main-content {
      flex: 1;
      padding: 20px;
    }
    
    [dir="rtl"] .mat-drawer {
      transform-origin: 100% 50% !important;
    }
  `]
})
export class AppComponent implements OnInit {
  currentLang = 'ar';
  sidenavOpened = true;
  
  constructor(private translate: TranslateService) {
    // Set default language
    this.translate.setDefaultLang('ar');
    this.translate.use('ar');
    
    // Handle RTL/LTR based on language
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
  }
  
  ngOnInit() {
    // Check for saved language preference
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
      this.switchLanguage(savedLang);
    }
  }
  
  switchLanguage(lang: string) {
    this.currentLang = lang;
    this.translate.use(lang);
    
    // Update document direction
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
    
    // Save preference
    localStorage.setItem('language', lang);
  }
  
  toggleSidenav() {
    this.sidenavOpened = !this.sidenavOpened;
  }
}
