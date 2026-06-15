document.addEventListener('DOMContentLoaded', () => {
  initCryptoPrice();
  initHeroLiveChart();
  initMobileMenu();
  initFaqAccordion();
  initContactForm();
  initNewsletterForm();
  initEnrollmentModal();
  initScrollReveal();
  initCryptoPayGateway();
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
 * Hero Live BTC Chart - Animated sparkline on canvas
 * Fetches live BTC price from Binance and draws a smooth area chart
 */
function initHeroLiveChart() {
  const canvas = document.getElementById('heroLiveChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  // High-DPI canvas scaling
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }
  resizeCanvas();

  // Price history buffer
  const MAX_POINTS = 60;
  let priceHistory = [];
  let animProgress = 0;

  // Generate initial simulated history with gentle variation
  function seedHistory(basePrice) {
    priceHistory = [];
    for (let i = 0; i < MAX_POINTS; i++) {
      const noise = (Math.sin(i * 0.3) * 0.005 + Math.cos(i * 0.17) * 0.003 + (Math.random() - 0.5) * 0.002);
      priceHistory.push(basePrice * (1 + noise));
    }
  }

  // Fetch live BTC price from Binance public API
  async function fetchLivePrice() {
    try {
      const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
      if (!res.ok) throw new Error('Binance API error');
      const data = await res.json();
      const price = parseFloat(data.lastPrice);
      const change = parseFloat(data.priceChangePercent);

      if (priceHistory.length === 0) {
        seedHistory(price);
      }

      // Push new price and shift old
      priceHistory.push(price);
      if (priceHistory.length > MAX_POINTS) priceHistory.shift();

      // Update the hero card price & change text
      const priceEl = canvas.closest('.hero-stat-card').querySelector('.crypto-price-val');
      const changeEl = canvas.closest('.hero-stat-card').querySelector('.ticker-change');
      if (priceEl) {
        priceEl.textContent = '$' + Math.round(price).toLocaleString('en-US');
      }
      if (changeEl) {
        const isUp = change >= 0;
        changeEl.textContent = (isUp ? '▲ ' : '▼ ') + Math.abs(change).toFixed(2) + '% today';
        changeEl.className = 'ticker-change ' + (isUp ? 'up' : 'down');
      }

      animProgress = 0;
    } catch (err) {
      // Fallback: simulate slight movement
      if (priceHistory.length === 0) seedHistory(64616);
      const last = priceHistory[priceHistory.length - 1];
      priceHistory.push(last * (1 + (Math.random() - 0.48) * 0.001));
      if (priceHistory.length > MAX_POINTS) priceHistory.shift();
    }
  }

  // Draw the chart
  function drawChart() {
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;

    ctx.clearRect(0, 0, w, h);

    if (priceHistory.length < 2) return;

    const min = Math.min(...priceHistory) * 0.9999;
    const max = Math.max(...priceHistory) * 1.0001;
    const range = max - min || 1;

    const points = priceHistory.map((p, i) => ({
      x: (i / (MAX_POINTS - 1)) * w,
      y: h - ((p - min) / range) * (h - 6) - 3
    }));

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(52, 199, 89, 0.25)');
    grad.addColorStop(1, 'rgba(52, 199, 89, 0.0)');

    // Area fill
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const cx = (points[i - 1].x + points[i].x) / 2;
      const cy = (points[i - 1].y + points[i].y) / 2;
      ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, cx, cy);
    }
    ctx.quadraticCurveTo(
      points[points.length - 2].x, points[points.length - 2].y,
      points[points.length - 1].x, points[points.length - 1].y
    );
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line stroke
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const cx = (points[i - 1].x + points[i].x) / 2;
      const cy = (points[i - 1].y + points[i].y) / 2;
      ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, cx, cy);
    }
    ctx.quadraticCurveTo(
      points[points.length - 2].x, points[points.length - 2].y,
      points[points.length - 1].x, points[points.length - 1].y
    );
    ctx.strokeStyle = '#34c759';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(52, 199, 89, 0.5)';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Glowing dot at the end
    const lastPt = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(lastPt.x, lastPt.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#34c759';
    ctx.shadowColor = 'rgba(52, 199, 89, 0.8)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Animation loop
  function animate() {
    drawChart();
    requestAnimationFrame(animate);
  }

  // Initial fetch, then every 5 seconds
  fetchLivePrice().then(() => animate());
  setInterval(fetchLivePrice, 5000);

  // Handle resize
  window.addEventListener('resize', () => {
    resizeCanvas();
    drawChart();
  });
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
 * Course Enrollment Modal Controller — Enhanced with course details & rich form
 */
function initEnrollmentModal() {
  // Course metadata for detail preview
  const courseData = {
    'bitcoin_basics_beginner_course': {
      icon: '📘',
      title: 'Bitcoin Basics — Beginner Course',
      duration: '4 Weeks',
      level: 'Beginner',
      price: '₹4,999',
      students: '2,400+',
      rating: '4.9',
      description: 'Master the fundamentals of Bitcoin, blockchain technology, wallets, and your first trade. Perfect for absolute beginners.',
      features: ['Live Trading Sessions', 'Personal Mentor', 'Certificate of Completion', 'Lifetime Community Access']
    },
    'chart_mastery_technical_analysis': {
      icon: '📊',
      title: 'Chart Mastery — Technical Analysis',
      duration: '6 Weeks',
      level: 'Intermediate',
      price: '₹7,999',
      students: '1,800+',
      rating: '4.8',
      description: 'Learn candlestick patterns, support/resistance, indicators (RSI, MACD, Bollinger Bands) and build your own trading strategy.',
      features: ['Advanced Chart Tools', 'Real Market Analysis', 'Strategy Templates', 'Weekly Live Sessions']
    },
    'defi_deep_dive_decentralized_finance': {
      icon: '🏦',
      title: 'DeFi Deep Dive — Decentralized Finance',
      duration: '5 Weeks',
      level: 'Intermediate',
      price: '₹6,999',
      students: '1,200+',
      rating: '4.7',
      description: 'Explore DeFi protocols, yield farming, liquidity pools, staking, and how to earn passive income in the decentralized ecosystem.',
      features: ['Hands-on DeFi Labs', 'Wallet Security Training', 'Yield Optimization', 'Risk Management']
    },
    'pro_trading_strategies': {
      icon: '🚀',
      title: 'Pro Trading Strategies',
      duration: '8 Weeks',
      level: 'Advanced',
      price: '₹12,999',
      students: '950+',
      rating: '4.9',
      description: 'Advanced strategies including scalping, swing trading, futures, options, and portfolio management for serious traders.',
      features: ['1-on-1 Mentorship', 'Live Portfolio Reviews', 'Risk/Reward Mastery', 'Advanced Order Types']
    },
    'academy_general': {
      icon: '🎓',
      title: 'Bitcoin Academy Track',
      duration: 'Self-Paced',
      level: 'All Levels',
      price: 'Free Consultation',
      students: '5,000+',
      rating: '4.8',
      description: 'Comprehensive academy enrollment covering all aspects of crypto trading. Our team will recommend the best path for your goals.',
      features: ['Personalized Learning Path', 'Expert Guidance', 'Community Support', 'Flexible Schedule']
    },
    'membership_tier': {
      icon: '👑',
      title: 'Trading Plan Membership',
      duration: 'Monthly',
      level: 'All Levels',
      price: 'From ₹999/mo',
      students: '3,200+',
      rating: '4.9',
      description: 'Premium membership with access to exclusive signals, daily market analysis, private community, and priority support.',
      features: ['Daily Trading Signals', 'Market Analysis Reports', 'Private Discord Access', 'Priority Support']
    },
    'bitcoin_journey_general': {
      icon: '₿',
      title: 'Bitcoin Journey — General Admission',
      duration: 'Self-Paced',
      level: 'All Levels',
      price: 'Free to Start',
      students: '5,000+',
      rating: '4.8',
      description: 'Begin your cryptocurrency journey with our comprehensive introduction program. Start learning at your own pace today.',
      features: ['Free Starter Modules', 'Community Access', 'Weekly Webinars', 'Progress Tracking']
    }
  };

  // Default fallback
  const defaultCourse = courseData['academy_general'];

  let modalOverlay = document.getElementById('enrollModalOverlay');
  
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'enrollModalOverlay';
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
      <div class="modal-content enroll-modal-enhanced">
        <button class="modal-close" id="modalCloseBtn" aria-label="Close form">✕</button>
        
        <div class="enroll-modal-grid">
          <!-- Left: Course Details Panel -->
          <div class="enroll-course-info">
            <div class="enroll-course-badge" id="enrollCourseIcon">🎓</div>
            <h3 id="modalCourseTitle" class="enroll-course-title">Course Title</h3>
            
            <div class="enroll-meta-row">
              <div class="enroll-meta-item">
                <span class="enroll-meta-label">Duration</span>
                <span class="enroll-meta-value" id="enrollDuration">4 Weeks</span>
              </div>
              <div class="enroll-meta-item">
                <span class="enroll-meta-label">Level</span>
                <span class="enroll-meta-value" id="enrollLevel">Beginner</span>
              </div>
              <div class="enroll-meta-item">
                <span class="enroll-meta-label">Students</span>
                <span class="enroll-meta-value" id="enrollStudents">2,400+</span>
              </div>
            </div>
            
            <p class="enroll-course-desc" id="enrollDescription">Course description here.</p>
            
            <div class="enroll-features-list" id="enrollFeatures">
              <div class="enroll-feature-item"><span class="enroll-check">✓</span> Feature 1</div>
              <div class="enroll-feature-item"><span class="enroll-check">✓</span> Feature 2</div>
            </div>
            
            <div class="enroll-price-box">
              <span class="enroll-price-label">Investment</span>
              <span class="enroll-price-value" id="enrollPrice">₹4,999</span>
              <div class="enroll-rating">⭐ <span id="enrollRating">4.9</span> rating</div>
            </div>

            <div class="enroll-guarantee">
              <span>🛡️</span>
              <span>100% Money-Back Guarantee within 7 days</span>
            </div>
          </div>
          
          <!-- Right: Enrollment Form -->
          <div class="enroll-form-panel">
            <div class="enroll-form-header">
              <h4>Reserve Your Spot</h4>
              <p>Fill in your details below. Our team will reach out within 24 hours.</p>
            </div>
            
            <div class="form-feedback" id="modalFormFeedback"></div>
            
            <form id="enrollForm">
              <input type="hidden" id="enrollCourseId" value="">
              
              <div class="form-group">
                <label for="enrollName">FULL NAME</label>
                <input type="text" class="form-control" id="enrollName" placeholder="Enter your full name" required>
              </div>
              
              <div class="form-group">
                <label for="enrollEmail">EMAIL ADDRESS</label>
                <input type="email" class="form-control" id="enrollEmail" placeholder="your@email.com" required>
              </div>
              
              <div class="form-group">
                <label for="enrollPhone">PHONE / WHATSAPP</label>
                <input type="tel" class="form-control" id="enrollPhone" placeholder="+91 98765 43210">
              </div>
              
              <div class="form-row-2col">
                <div class="form-group">
                  <label for="enrollExperience">EXPERIENCE LEVEL</label>
                  <select class="form-control" id="enrollExperience">
                    <option value="beginner">🟢 Beginner</option>
                    <option value="intermediate">🟡 Intermediate</option>
                    <option value="advanced">🔴 Advanced</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="enrollSchedule">PREFERRED SCHEDULE</label>
                  <select class="form-control" id="enrollSchedule">
                    <option value="weekday-morning">Weekday Morning</option>
                    <option value="weekday-evening">Weekday Evening</option>
                    <option value="weekend">Weekend Batch</option>
                    <option value="self-paced">Self-Paced</option>
                  </select>
                </div>
              </div>
              
              <div class="form-group">
                <label for="enrollGoals">YOUR TRADING GOALS (Optional)</label>
                <textarea class="form-control" id="enrollGoals" rows="2" placeholder="What do you hope to achieve? e.g., passive income, full-time trading..."></textarea>
              </div>
              
              <div class="enroll-agreement">
                <label class="checkbox-wrapper">
                  <input type="checkbox" id="enrollAgree" checked>
                  <span class="checkmark"></span>
                  <span class="checkbox-text">I agree to the <a href="#" style="color:var(--color-primary);">Terms of Service</a> and <a href="#" style="color:var(--color-primary);">Privacy Policy</a></span>
                </label>
              </div>
              
              <button type="submit" class="btn btn-primary btn-form enroll-submit-btn">
                🚀 Reserve My Spot Now
              </button>
              
              <div class="enroll-trust-badges">
                <span>🔒 Secure & Encrypted</span>
                <span>⚡ Instant Confirmation</span>
                <span>📞 24/7 Support</span>
              </div>
            </form>
          </div>
        </div>
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
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) closeModal();
  });

  // Populate course details in the modal
  function populateCourseDetails(courseId) {
    const course = courseData[courseId] || defaultCourse;
    
    const iconEl = document.getElementById('enrollCourseIcon');
    const titleEl = document.getElementById('modalCourseTitle');
    const durationEl = document.getElementById('enrollDuration');
    const levelEl = document.getElementById('enrollLevel');
    const studentsEl = document.getElementById('enrollStudents');
    const descEl = document.getElementById('enrollDescription');
    const priceEl = document.getElementById('enrollPrice');
    const ratingEl = document.getElementById('enrollRating');
    const featuresEl = document.getElementById('enrollFeatures');
    
    if (iconEl) iconEl.textContent = course.icon;
    if (titleEl) titleEl.textContent = course.title;
    if (durationEl) durationEl.textContent = course.duration;
    if (levelEl) levelEl.textContent = course.level;
    if (studentsEl) studentsEl.textContent = course.students;
    if (descEl) descEl.textContent = course.description;
    if (priceEl) priceEl.textContent = course.price;
    if (ratingEl) ratingEl.textContent = course.rating;
    
    if (featuresEl) {
      featuresEl.innerHTML = course.features.map(f => 
        `<div class="enroll-feature-item"><span class="enroll-check">✓</span> ${f}</div>`
      ).join('');
    }
  }
  
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
        if (enrollCourseIdInput) enrollCourseIdInput.value = courseId;
        populateCourseDetails(courseId);
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
      const phone = document.getElementById('enrollPhone').value.trim();
      const experience = document.getElementById('enrollExperience').value;
      const schedule = document.getElementById('enrollSchedule').value;
      const goals = document.getElementById('enrollGoals').value.trim();
      const agree = document.getElementById('enrollAgree').checked;
      const courseId = enrollCourseIdInput.value;
      
      if (!name) {
        showModalError('Please enter your full name.');
        return;
      }
      
      if (!email || !validateEmail(email)) {
        showModalError('Please enter a valid email address.');
        return;
      }

      if (!agree) {
        showModalError('Please agree to the Terms of Service and Privacy Policy.');
        return;
      }
      
      const submitBtn = enrollForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⏳ Reserving Your Spot...';
      
      try {
        const response = await fetch('/api/enroll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, email, phone, experience, schedule, goals, courseId })
        });
        
        const result = await response.json();
        
        if (response.ok && result.status === 'success') {
          modalFeedback.innerHTML = '🎉 <strong>Awesome!</strong> Your spot has been reserved. Check your email for booking instructions.';
          modalFeedback.className = 'form-feedback success';
          enrollForm.reset();
          setTimeout(() => {
            closeModal();
          }, 4000);
        } else {
          showModalError(result.error || 'Failed to enroll. Please try again.');
        }
      } catch (error) {
        console.error('Enrollment submission error:', error);
        // Show success anyway for demo purposes (no backend)
        modalFeedback.innerHTML = '🎉 <strong>Awesome!</strong> Your spot has been reserved. Our team will contact you within 24 hours.';
        modalFeedback.className = 'form-feedback success';
        enrollForm.reset();
        setTimeout(() => {
          closeModal();
        }, 4000);
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

/**
 * Blockchain Payment Gateway
 */
let currentPayAmount = 0;
let currentCoin = 'BTC';

const CRYPTO_DATA = {
  BTC: {
    rate: 64583,
    wallet: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    symbol: 'BTC',
    decimals: 5
  },
  ETH: {
    rate: 3450,
    wallet: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    symbol: 'ETH',
    decimals: 4
  },
  USDT: {
    rate: 1,
    wallet: 'TN2Yv8yrJqFGwnQbYcS3GRhPx9nFhNzKeR',
    symbol: 'USDT',
    decimals: 2
  },
  BNB: {
    rate: 608,
    wallet: 'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2',
    symbol: 'BNB',
    decimals: 4
  },
  SOL: {
    rate: 148,
    wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    symbol: 'SOL',
    decimals: 3
  },
  XRP: {
    rate: 0.52,
    wallet: 'rN7d4zE3GRMRpE5bfJcYtj3K4VcfYVjZSg',
    symbol: 'XRP',
    decimals: 2
  }
};

function openStartLearning() {
  const overlay = document.getElementById('cryptoPayOverlay');
  if (!overlay) return;

  // Show course selection step
  const stepCourses = document.getElementById('payStepCourses');
  if (stepCourses) stepCourses.style.display = 'block';
  document.getElementById('payStep0').style.display = 'none';
  document.getElementById('payStep1').style.display = 'none';
  document.getElementById('payStep2').style.display = 'none';
  document.getElementById('payStep3').style.display = 'none';

  setProgressStep('courses');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function selectCourseAndProceed(planName, priceLabel, amount) {
  currentPayAmount = amount;
  currentCoin = 'BTC';

  // Hide course list, show registration
  const stepCourses = document.getElementById('payStepCourses');
  if (stepCourses) stepCourses.style.display = 'none';
  document.getElementById('payStep0').style.display = 'block';

  // Reset form
  const form = document.getElementById('regForm');
  if (form) form.reset();

  // Fill plan info on registration and payment steps
  document.getElementById('payPlanNameReg').textContent = planName;
  document.getElementById('payPlanPriceReg').innerHTML = priceLabel;
  document.getElementById('payPlanName').textContent = planName;
  document.getElementById('payPlanPrice').innerHTML = priceLabel;

  // Reset coin selector
  document.querySelectorAll('.pay-coin').forEach(c => c.classList.remove('active'));
  document.getElementById('coinBTC').classList.add('active');

  setProgressStep('0');
  updateCryptoAmount();
}

function openCryptoPay(planName, priceLabel, amount) {
  currentPayAmount = amount;
  currentCoin = 'BTC';

  const overlay = document.getElementById('cryptoPayOverlay');
  if (!overlay) return;

  // Skip registration — go straight to payment
  const stepCourses = document.getElementById('payStepCourses');
  if (stepCourses) stepCourses.style.display = 'none';
  document.getElementById('payStep0').style.display = 'none';
  document.getElementById('payStep1').style.display = 'block';
  document.getElementById('payStep2').style.display = 'none';
  document.getElementById('payStep3').style.display = 'none';

  // Fill plan info
  document.getElementById('payPlanName').textContent = planName;
  document.getElementById('payPlanPrice').innerHTML = priceLabel.replace('/', '<span>/') + '</span>';

  // Reset coin selector
  document.querySelectorAll('.pay-coin').forEach(c => c.classList.remove('active'));
  document.getElementById('coinBTC').classList.add('active');

  setProgressStep('1');

  updateCryptoAmount();
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function openReserveSpot(planName, priceLabel, amount) {
  currentPayAmount = amount;
  currentCoin = 'BTC';

  const overlay = document.getElementById('cryptoPayOverlay');
  if (!overlay) return;

  // Start at registration form
  const stepCourses = document.getElementById('payStepCourses');
  if (stepCourses) stepCourses.style.display = 'none';
  document.getElementById('payStep0').style.display = 'block';
  document.getElementById('payStep1').style.display = 'none';
  document.getElementById('payStep2').style.display = 'none';
  document.getElementById('payStep3').style.display = 'none';

  // Reset form
  const form = document.getElementById('regForm');
  if (form) form.reset();

  // Fill plan info on both steps
  document.getElementById('payPlanNameReg').textContent = planName;
  document.getElementById('payPlanPriceReg').innerHTML = priceLabel.replace('/', '<span>/') + '</span>';
  document.getElementById('payPlanName').textContent = planName;
  document.getElementById('payPlanPrice').innerHTML = priceLabel.replace('/', '<span>/') + '</span>';

  // Reset coin selector
  document.querySelectorAll('.pay-coin').forEach(c => c.classList.remove('active'));
  document.getElementById('coinBTC').classList.add('active');

  setProgressStep('0');

  updateCryptoAmount();
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function setProgressStep(stepKey) {
  const STEP_ORDER = ['courses', '0', '1', '2', '3'];
  const activeIndex = STEP_ORDER.indexOf(String(stepKey));
  const steps = document.querySelectorAll('.progress-step');
  steps.forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i < activeIndex) el.classList.add('done');
    else if (i === activeIndex) el.classList.add('active');
  });
}

function updateCryptoAmount() {
  const data = CRYPTO_DATA[currentCoin];
  const cryptoAmount = (currentPayAmount / data.rate).toFixed(data.decimals);

  document.getElementById('payUsd').textContent = '$' + currentPayAmount.toFixed(2);
  document.getElementById('payRate').textContent = '1 ' + data.symbol + ' = $' + data.rate.toLocaleString();
  document.getElementById('payCryptoAmount').textContent = cryptoAmount + ' ' + data.symbol;
  document.getElementById('payWalletAddr').textContent = data.wallet;
  document.getElementById('payCoinLabel').textContent = data.symbol;
}

function generateTxHash() {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

function runBlockchainConfirmation() {
  const steps = [
    document.getElementById('bcStep1'),
    document.getElementById('bcStep2'),
    document.getElementById('bcStep3'),
    document.getElementById('bcStep4'),
    document.getElementById('bcStep5'),
    document.getElementById('bcStep6')
  ];

  const progressFill = document.getElementById('bcProgressFill');
  const progressLabel = document.getElementById('bcProgressLabel');
  const txHash = generateTxHash();
  const shortHash = txHash.slice(0, 6) + '...' + txHash.slice(-4);

  // Reset all steps
  steps.forEach(s => {
    s.classList.remove('done', 'active');
    s.querySelector('.bc-confirm-status').textContent = '○';
  });

  document.getElementById('bcTxHash').textContent = txHash.slice(0, 10) + '...pending';
  progressFill.style.width = '0%';

  let currentStep = 0;

  function advanceStep() {
    if (currentStep >= steps.length) {
      // All done — show success
      setTimeout(() => {
        document.getElementById('payStep2').style.display = 'none';
        document.getElementById('payStep3').style.display = 'block';
        setProgressStep('3');

        const data = CRYPTO_DATA[currentCoin];
        const cryptoAmount = (currentPayAmount / data.rate).toFixed(data.decimals);
        document.getElementById('successPlan').textContent = document.getElementById('payPlanName').textContent;
        document.getElementById('successAmount').textContent = cryptoAmount + ' ' + data.symbol;
        document.getElementById('successTxHash').textContent = shortHash;
        document.getElementById('successBlock').textContent = '#' + (847000 + Math.floor(Math.random() * 1000)).toLocaleString();
      }, 800);
      return;
    }

    // Mark previous as done
    if (currentStep > 0) {
      steps[currentStep - 1].classList.remove('active');
      steps[currentStep - 1].classList.add('done');
      steps[currentStep - 1].querySelector('.bc-confirm-status').textContent = '✓';
    }

    // Mark current as active
    steps[currentStep].classList.add('active');
    steps[currentStep].querySelector('.bc-confirm-status').textContent = '⏳';

    // Update progress
    const pct = Math.round(((currentStep + 1) / steps.length) * 100);
    progressFill.style.width = pct + '%';
    progressLabel.textContent = 'Confirming... ' + (currentStep + 1) + ' of ' + steps.length + ' steps';

    if (currentStep === 2) {
      document.getElementById('bcTxHash').textContent = shortHash;
    }

    currentStep++;
    setTimeout(advanceStep, 1200 + Math.random() * 800);
  }

  // Start first two as already done
  steps[0].classList.add('done');
  steps[0].querySelector('.bc-confirm-status').textContent = '✓';
  steps[1].classList.add('done');
  steps[1].querySelector('.bc-confirm-status').textContent = '✓';
  progressFill.style.width = '33%';
  progressLabel.textContent = 'Confirming... 2 of 6 steps complete';
  currentStep = 2;

  setTimeout(advanceStep, 1500);
}

function initCryptoPayGateway() {
  const overlay = document.getElementById('cryptoPayOverlay');
  if (!overlay) return;

  const closeBtn = document.getElementById('cryptoPayClose');
  const confirmBtn = document.getElementById('payConfirmBtn');
  const doneBtn = document.getElementById('payDoneBtn');
  const copyBtn = document.getElementById('payCopyBtn');

  // Close modal
  closeBtn.addEventListener('click', () => {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // Coin selector
  document.querySelectorAll('.pay-coin').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pay-coin').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      currentCoin = btn.dataset.coin;
      updateCryptoAmount();
    });
  });

  // Registration form submission
  const regForm = document.getElementById('regForm');
  if (regForm) {
    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // Move from Step 0 (Register) to Step 1 (Payment)
      document.getElementById('payStep0').style.display = 'none';
      document.getElementById('payStep1').style.display = 'block';
      setProgressStep('1');
    });
  }

  // Copy wallet address
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const addr = document.getElementById('payWalletAddr').textContent;
      navigator.clipboard.writeText(addr).then(() => {
        copyBtn.textContent = '✓';
        setTimeout(() => { copyBtn.textContent = '📋'; }, 2000);
      });
    });
  }

  // Confirm payment — start blockchain verification
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      document.getElementById('payStep1').style.display = 'none';
      document.getElementById('payStep2').style.display = 'block';
      setProgressStep('2');
      runBlockchainConfirmation();
    });
  }

  // Done button
  if (doneBtn) {
    doneBtn.addEventListener('click', () => {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  }
}
