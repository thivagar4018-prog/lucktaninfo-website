document.addEventListener('DOMContentLoaded', () => {
  initCryptoPrice();
  initMobileMenu();
  initFaqAccordion();
  initContactForm();
  initNewsletterForm();
  initEnrollmentModal();
  initScrollReveal();
});

/**
 * Real-time Bitcoin Price Fetcher
 * Queries local backend API for live BTC/USDT price and 24h percentage change.
 */
function initCryptoPrice() {
  const priceElements = document.querySelectorAll('.crypto-price-val');
  const changeElements = document.querySelectorAll('.ticker-change');
  
  async function fetchPrice() {
    try {
      // Fetch BTC details from local server API
      const response = await fetch('/api/btc-price');
      if (!response.ok) throw new Error('API response failed');
      
      const data = await response.json();
      
      // Price value formatting
      const price = parseFloat(data.price);
      const changePercent = parseFloat(data.change);
      
      const formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(price);
      
      // Update UI elements
      priceElements.forEach(el => {
        el.textContent = formattedPrice;
      });
      
      // Update change indicator
      const isUp = changePercent >= 0;
      const formattedChange = `${isUp ? '▲' : '▼'} ${Math.abs(changePercent).toFixed(2)}% today`;
      
      changeElements.forEach(el => {
        el.textContent = formattedChange;
        if (isUp) {
          el.className = 'ticker-change up';
        } else {
          el.className = 'ticker-change down';
        }
      });
    } catch (error) {
      console.error('Error fetching live Bitcoin price from API:', error);
      // Keep placeholder or fall back gracefully
    }
  }

  // Initial fetch and set interval every 15 seconds
  fetchPrice();
  setInterval(fetchPrice, 15000);
}

/**
 * Mobile Navigation Menu Toggle
 */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');
  
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('active');
      
      // Toggle burger icon
      const icon = menuBtn.querySelector('i') || menuBtn;
      if (navLinks.classList.contains('active')) {
        icon.textContent = '✕';
      } else {
        icon.textContent = '☰';
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && e.target !== menuBtn) {
        navLinks.classList.remove('active');
        const icon = menuBtn.querySelector('i') || menuBtn;
        icon.textContent = '☰';
      }
    });
  }
}

/**
 * FAQ Accordion Component
 */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    
    if (question && answer) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close all other FAQs
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            otherItem.querySelector('.faq-answer').style.maxHeight = null;
          }
        });
        
        // Toggle current FAQ
        if (isActive) {
          item.classList.remove('active');
          answer.style.maxHeight = null;
        } else {
          item.classList.add('active');
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    }
  });
}

/**
 * Contact Form Handling & Validation
 */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const feedback = document.getElementById('formFeedback');
  
  if (form && feedback) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Reset feedback
      feedback.className = 'form-feedback';
      feedback.style.display = 'none';
      
      // Get field values
      const name = document.getElementById('formName').value.trim();
      const email = document.getElementById('formEmail').value.trim();
      const subject = document.getElementById('formSubject').value;
      const message = document.getElementById('formMessage').value.trim();
      const agree = document.getElementById('formAgree').checked;
      
      // Validate
      if (!name) {
        showError('Please enter your name.');
        return;
      }
      
      if (!email || !validateEmail(email)) {
        showError('Please enter a valid email address.');
        return;
      }
      
      if (!subject || subject === '') {
        showError('Please select a subject.');
        return;
      }
      
      if (!message) {
        showError('Please enter your message.');
        return;
      }
      
      if (!agree) {
        showError('You must agree to the Terms of Service and Privacy Policy.');
        return;
      }
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Sending Message...';
      
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, email, subject, message })
        });
        
        const result = await response.json();
        
        if (response.ok && result.status === 'success') {
          feedback.textContent = 'Thank you! Your message has been sent successfully. We will get back to you within 24 hours.';
          feedback.className = 'form-feedback success';
          form.reset();
        } else {
          showError(result.error || 'Failed to submit message. Please try again.');
        }
      } catch (error) {
        console.error('Contact form submission error:', error);
        showError('A network error occurred. Please check your connection and try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }
  
  function showError(msg) {
    feedback.textContent = msg;
    feedback.className = 'form-feedback error';
  }
  
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
}

/**
 * Footer Newsletter Signup Handling
 */
function initNewsletterForm() {
  const forms = document.querySelectorAll('.footer-newsletter');
  
  forms.forEach(form => {
    let feedback = form.parentNode.querySelector('.newsletter-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'newsletter-feedback';
      form.parentNode.appendChild(feedback);
    }
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      feedback.className = 'newsletter-feedback';
      feedback.style.display = 'none';
      
      const emailInput = form.querySelector('input[type="email"]');
      const email = emailInput.value.trim();
      
      if (!email) {
        showFeedback('Please enter your email.', 'error');
        return;
      }
      
      const submitBtn = form.querySelector('button');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⌛';
      
      try {
        const response = await fetch('/api/newsletter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        });
        
        const result = await response.json();
        
        if (response.ok && result.status === 'success') {
          showFeedback('Subscribed successfully!', 'success');
          form.reset();
        } else {
          showFeedback(result.error || 'Subscription failed.', 'error');
        }
      } catch (error) {
        console.error('Newsletter submission error:', error);
        showFeedback('Error subscribing.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
    
    function showFeedback(msg, type) {
      feedback.textContent = msg;
      feedback.className = `newsletter-feedback ${type}`;
      setTimeout(() => {
        feedback.style.display = 'none';
      }, 5000);
    }
  });
}

/**
 * Course Enrollment Modal Controller
 */
function initEnrollmentModal() {
  let modalOverlay = document.getElementById('enrollModalOverlay');
  
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'enrollModalOverlay';
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
      <div class="modal-content">
        <button class="modal-close" id="modalCloseBtn" aria-label="Close form">✕</button>
        <div class="modal-header">
          <h3>Enroll in <span id="modalCourseTitle">Course</span></h3>
          <p>Provide your details below to reserve your slot. Our trading squad will contact you with booking instructions.</p>
        </div>
        <div class="form-feedback" id="modalFormFeedback"></div>
        <form id="enrollForm">
          <input type="hidden" id="enrollCourseId" value="">
          <div class="form-group">
            <label for="enrollName">YOUR NAME</label>
            <input type="text" class="form-control" id="enrollName" placeholder="Enter Your Name" required>
          </div>
          <div class="form-group">
            <label for="enrollEmail">EMAIL ADDRESS</label>
            <input type="email" class="form-control" id="enrollEmail" placeholder="Enter Your Email" required>
          </div>
          <button type="submit" class="btn btn-primary btn-form" style="margin-top: 10px;">Reserve My Spot ➔</button>
        </form>
      </div>
    `;
    document.body.appendChild(modalOverlay);
  }
  
  const closeBtn = document.getElementById('modalCloseBtn');
  const enrollForm = document.getElementById('enrollForm');
  const modalFeedback = document.getElementById('modalFormFeedback');
  const modalCourseTitle = document.getElementById('modalCourseTitle');
  const enrollCourseIdInput = document.getElementById('enrollCourseId');
  
  const closeModal = () => {
    modalOverlay.classList.remove('active');
    if (enrollForm) enrollForm.reset();
    if (modalFeedback) {
      modalFeedback.className = 'form-feedback';
      modalFeedback.style.display = 'none';
    }
  };
  
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  
  function bindEnrollButtons() {
    const enrollButtons = document.querySelectorAll('.enroll-link, .btn-enroll, .btn-pricing, #navCta, #heroPrimaryBtn, .cta-banner .btn');
    
    enrollButtons.forEach(btn => {
      // Identify card info
      const parentCard = btn.closest('.course-card, .pricing-card');
      let courseTitle = "Bitcoin Academy Track";
      let courseId = "academy_general";
      
      if (parentCard) {
        const titleEl = parentCard.querySelector('h3');
        if (titleEl) {
          courseTitle = titleEl.textContent;
          courseId = courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        }
      } else if (btn.classList.contains('btn-pricing')) {
        courseTitle = "Trading Plan Membership";
        courseId = "membership_tier";
      } else if (btn.id === 'heroPrimaryBtn' || btn.id === 'navCta' || btn.closest('.cta-banner')) {
        courseTitle = "Bitcoin Journey General Admission";
        courseId = "bitcoin_journey_general";
      }
      
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (modalCourseTitle) modalCourseTitle.textContent = courseTitle;
        if (enrollCourseIdInput) enrollCourseIdInput.value = courseId;
        modalOverlay.classList.add('active');
      });
    });
  }
  
  bindEnrollButtons();
  
  if (enrollForm) {
    enrollForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      modalFeedback.className = 'form-feedback';
      modalFeedback.style.display = 'none';
      
      const name = document.getElementById('enrollName').value.trim();
      const email = document.getElementById('enrollEmail').value.trim();
      const courseId = enrollCourseIdInput.value;
      
      if (!name) {
        showModalError('Please enter your name.');
        return;
      }
      
      if (!email || !validateEmail(email)) {
        showModalError('Please enter a valid email address.');
        return;
      }
      
      const submitBtn = enrollForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Reserving Spot...';
      
      try {
        const response = await fetch('/api/enroll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, email, courseId })
        });
        
        const result = await response.json();
        
        if (response.ok && result.status === 'success') {
          modalFeedback.textContent = 'Awesome! Your spot has been reserved. Check your email for booking instructions.';
          modalFeedback.className = 'form-feedback success';
          enrollForm.reset();
          setTimeout(() => {
            closeModal();
          }, 3500);
        } else {
          showModalError(result.error || 'Failed to enroll. Please try again.');
        }
      } catch (error) {
        console.error('Enrollment submission error:', error);
        showModalError('A network error occurred. Please try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }
  
  function showModalError(msg) {
    modalFeedback.textContent = msg;
    modalFeedback.className = 'form-feedback error';
  }
  
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
}

/**
 * Scroll Reveal Animations using IntersectionObserver
 */
function initScrollReveal() {
  const style = document.createElement('style');
  style.innerHTML = `
    .reveal {
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1), transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .reveal.active {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);

  const targets = document.querySelectorAll(
    '.feature-card, .course-card, .testimonial-card, .pricing-card, .showcase-step-card, .contact-info-card, .prop-card, .expert-card, .section-header'
  );
  
  const observerOptions = {
    root: null,
    threshold: 0.15,
    rootMargin: '0px'
  };
  
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  targets.forEach(target => {
    target.classList.add('reveal');
    observer.observe(target);
  });
}
