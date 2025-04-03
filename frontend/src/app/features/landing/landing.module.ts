import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Components
import { LandingPageComponent } from './components/landing-page/landing-page.component';

// Services
import { LandingPageService } from './services/landing-page.service';

@NgModule({
  declarations: [
    LandingPageComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  exports: [
    LandingPageComponent
  ],
  providers: [
    LandingPageService
  ]
})
export class LandingModule { }
