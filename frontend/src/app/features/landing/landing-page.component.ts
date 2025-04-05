import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Check if user is already logged in, redirect to dashboard if true
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
    
    // Initialize any scripts needed for the landing page
    this.initializeScripts();
  }

  /**
   * Navigate to login page
   */
  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Navigate to registration page
   */
  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  /**
   * Start free trial
   * @param plan Optional plan parameter to pre-select a specific plan
   */
  startFreeTrial(plan?: string): void {
    // Navigate to registration with optional plan parameter
    if (plan) {
      this.router.navigate(['/register'], { queryParams: { plan: plan } });
    } else {
      this.router.navigate(['/register']);
    }
  }

  /**
   * Contact form submission
   * @param formData Form data from contact form
   */
  submitContactForm(formData: any): void {
    // Here you would normally send the data to the backend API
    console.log('Contact form submitted:', formData);
    // Show success message or handle errors
    alert('شكراً لتواصلك معنا! سنقوم بالرد عليك في أقرب وقت ممكن.');
  }

  /**
   * Newsletter subscription
   * @param email Email address for newsletter
   */
  subscribeToNewsletter(email: string): void {
    // Here you would normally send the data to the backend API
    console.log('Newsletter subscription:', email);
    // Show success message or handle errors
    alert('شكراً لاشتراكك في نشرتنا الإخبارية!');
  }

  /**
   * Initialize scripts for the landing page
   */
  private initializeScripts(): void {
    // Add event listener for navbar scroll effect
    window.addEventListener('scroll', () => {
      const navbar = document.querySelector('.navbar') as HTMLElement;
      if (window.scrollY > 50) {
        navbar?.classList.add('scrolled');
      } else {
        navbar?.classList.remove('scrolled');
      }
    });

    // Add event listener for back to top button
    window.addEventListener('scroll', () => {
      const backToTopButton = document.querySelector('.back-to-top') as HTMLElement;
      if (window.scrollY > 300) {
        backToTopButton?.classList.add('active');
      } else {
        backToTopButton?.classList.remove('active');
      }
    });

    // Initialize smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
          e.preventDefault();
          
          const targetId = href;
          const targetElement = document.querySelector(targetId);
          
          if (targetElement) {
            window.scrollTo({
              top: targetElement.offsetTop - 80,
              behavior: 'smooth'
            });
            
            // Close mobile menu if open
            const navbarCollapse = document.querySelector('.navbar-collapse');
            if (navbarCollapse?.classList.contains('show')) {
              navbarCollapse.classList.remove('show');
            }
          }
        }
      });
    });
  }
}
