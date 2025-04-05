// Adalalegalis Landing Page JavaScript
// Author: Manus AI
// Date: April 3, 2025

document.addEventListener('DOMContentLoaded', function() {
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Back to top button
    const backToTopButton = document.querySelector('.back-to-top');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopButton.classList.add('active');
        } else {
            backToTopButton.classList.remove('active');
        }
    });
    
    backToTopButton.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') !== '#') {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                    
                    // Close mobile menu if open
                    const navbarCollapse = document.querySelector('.navbar-collapse');
                    if (navbarCollapse.classList.contains('show')) {
                        navbarCollapse.classList.remove('show');
                    }
                }
            }
        });
    });
    
    // Form submission handling
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const formDataObj = {};
            formData.forEach((value, key) => {
                formDataObj[key] = value;
            });
            
            // Here you would normally send the data to the backend
            // For now, we'll just show a success message
            alert('شكراً لتواصلك معنا! سنقوم بالرد عليك في أقرب وقت ممكن.');
            this.reset();
        });
    }
    
    // Newsletter subscription handling
    const newsletterForm = document.querySelector('.footer-newsletter form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get email
            const email = this.querySelector('input[type="email"]').value;
            
            // Here you would normally send the data to the backend
            // For now, we'll just show a success message
            alert('شكراً لاشتراكك في نشرتنا الإخبارية!');
            this.reset();
        });
    }
    
    // Trial button click handling
    const trialButtons = document.querySelectorAll('a[href="#"].btn-success');
    trialButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Here you would normally redirect to the trial registration page
            // For now, we'll just show a message
            alert('سيتم توجيهك إلى صفحة التسجيل للتجربة المجانية.');
        });
    });
    
    // Login button click handling
    const loginButton = document.querySelector('a[href="#"].btn-outline-light');
    if (loginButton) {
        loginButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Here you would normally redirect to the login page
            // For now, we'll just show a message
            alert('سيتم توجيهك إلى صفحة تسجيل الدخول.');
        });
    }
    
    // Initialize any Bootstrap components
    // Tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function(popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
});

// Function to create placeholder images for development
function createPlaceholderImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (!img.src || img.src.endsWith('logo.png') || img.src.endsWith('logo-white.png')) {
            // Skip logos
            return;
        }
        
        const width = img.width || 800;
        const height = img.height || 600;
        const text = img.alt || 'Adalalegalis';
        
        // Use placeholder.com for development
        img.src = `https://via.placeholder.com/${width}x${height}?text=${encodeURIComponent(text)}`;
    });
}

// Call this function if images are not available during development
// Uncomment the line below during development
// window.addEventListener('load', createPlaceholderImages);
