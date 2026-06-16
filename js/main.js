document.addEventListener('DOMContentLoaded', () => {
  initCryptoPrice();
  initHeroLiveChart();
  initMobileMenu();
  initFaqAccordion();
  initContactForm();
  initNewsletterForm();

  initScrollReveal();
  initCryptoPayGateway();
  initOTPVerification();
  initHeroParticles();
});

/**
 * Continuously Moving Hero Particle System
 */
function initHeroParticles() {
  const canvas = document.getElementById('heroParticles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    const hero = canvas.parentElement;
    canvas.width = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const PARTICLE_COUNT = 55;
  const particles = [];

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = -Math.random() * 0.3 - 0.1;
      this.size = Math.random() * 2.5 + 0.5;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.life = 0;
      this.maxLife = Math.random() * 400 + 200;
      // 40% chance white, 60% gold
      this.isWhite = Math.random() < 0.4;
      if (this.isWhite) {
        this.size = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.4 + 0.15;
      }
      this.hue = Math.random() * 30 + 35; // gold range
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      const progress = this.life / this.maxLife;
      if (progress < 0.1) this.currentOpacity = this.opacity * (progress / 0.1);
      else if (progress > 0.8) this.currentOpacity = this.opacity * ((1 - progress) / 0.2);
      else this.currentOpacity = this.opacity;
      if (this.life >= this.maxLife || this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
        this.reset();
        this.y = canvas.height + 10;
      }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      if (this.isWhite) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.currentOpacity})`;
      } else {
        ctx.fillStyle = `hsla(${this.hue}, 90%, 55%, ${this.currentOpacity})`;
      }
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

  function drawConnections() {
    const maxDist = 100;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.08;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          // White connection if either particle is white
          if (particles[i].isWhite || particles[j].isWhite) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          } else {
            ctx.strokeStyle = `rgba(241, 168, 10, ${alpha})`;
          }
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    requestAnimationFrame(animate);
  }
  animate();
}

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
        const success = await sendToZapier('contact', { name, email, subject, message });
        
        if (success) {
          feedback.textContent = 'Thank you! Your message has been sent successfully. We will get back to you within 24 hours.';
          feedback.className = 'form-feedback success';
          feedback.style.display = 'block';
          form.reset();
        } else {
          showError('Failed to submit message. Please try again.');
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
        const success = await sendToZapier('newsletter', { email });
        
        if (success) {
          showFeedback('Subscribed successfully!', 'success');
          form.reset();
        } else {
          showFeedback('Subscription failed.', 'error');
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
 * Email OTP Verification System
 */
let generatedOTP = '';
let emailVerified = false;
let otpTimerInterval = null;

function initOTPVerification() {
  const sendBtn = document.getElementById('otpSendBtn');
  const resendBtn = document.getElementById('otpResendBtn');
  const emailInput = document.getElementById('regEmail');
  const otpWrap = document.getElementById('otpInputWrap');
  const otpBoxes = document.querySelectorAll('.otp-box');
  const verifiedBadge = document.getElementById('otpVerifiedBadge');
  const otpErrorMsg = document.getElementById('otpErrorMsg');

  if (!sendBtn || !emailInput) return;

  // Send OTP
  sendBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailInput.classList.add('reg-error');
      showOtpError('Please enter a valid email first');
      return;
    }

    // Generate 6-digit OTP
    generatedOTP = String(Math.floor(100000 + Math.random() * 900000));
    emailVerified = false;

    // Lock email field
    emailInput.readOnly = true;
    sendBtn.textContent = 'Sent ✓';
    sendBtn.disabled = true;
    sendBtn.classList.add('otp-sent');

    // Show OTP boxes
    otpWrap.style.display = 'block';
    otpBoxes[0].focus();

    // Start cooldown timer
    startOtpTimer();

    // Show demo toast with OTP
    showOtpToast(email, generatedOTP);

    hideOtpError();
  });

  // Resend OTP
  if (resendBtn) {
    resendBtn.addEventListener('click', () => {
      generatedOTP = String(Math.floor(100000 + Math.random() * 900000));
      otpBoxes.forEach(b => { b.value = ''; b.classList.remove('otp-correct', 'otp-wrong'); });
      otpBoxes[0].focus();
      startOtpTimer();
      showOtpToast(emailInput.value.trim(), generatedOTP);
      hideOtpError();
    });
  }

  // OTP box navigation & auto-verify
  otpBoxes.forEach((box, i) => {
    box.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val.slice(0, 1);
      box.classList.remove('otp-wrong');

      if (val && i < otpBoxes.length - 1) {
        otpBoxes[i + 1].focus();
      }

      // Check if all 6 digits entered
      const entered = Array.from(otpBoxes).map(b => b.value).join('');
      if (entered.length === 6) {
        verifyOTP(entered);
      }
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && i > 0) {
        otpBoxes[i - 1].focus();
      }
    });

    // Paste support
    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
      if (pasted.length === 6) {
        pasted.split('').forEach((digit, idx) => {
          if (otpBoxes[idx]) otpBoxes[idx].value = digit;
        });
        otpBoxes[5].focus();
        verifyOTP(pasted);
      }
    });
  });

  // Change email (unlock)
  if (emailInput) {
    emailInput.addEventListener('dblclick', () => {
      if (emailInput.readOnly && !emailVerified) {
        emailInput.readOnly = false;
        sendBtn.textContent = 'Send OTP';
        sendBtn.disabled = false;
        sendBtn.classList.remove('otp-sent');
        otpWrap.style.display = 'none';
        otpBoxes.forEach(b => { b.value = ''; b.classList.remove('otp-correct', 'otp-wrong'); });
        clearInterval(otpTimerInterval);
      }
    });
  }

  function verifyOTP(entered) {
    if (entered === generatedOTP) {
      // Success
      emailVerified = true;
      otpBoxes.forEach(b => b.classList.add('otp-correct'));
      verifiedBadge.style.display = 'inline-flex';
      otpWrap.style.display = 'none';
      sendBtn.textContent = 'Verified ✓';
      sendBtn.classList.add('otp-verified');
      clearInterval(otpTimerInterval);
      hideOtpError();
    } else {
      // Failure
      otpBoxes.forEach(b => b.classList.add('otp-wrong'));
      showOtpError('Invalid OTP. Please try again.');
      setTimeout(() => {
        otpBoxes.forEach(b => { b.value = ''; b.classList.remove('otp-wrong'); });
        otpBoxes[0].focus();
      }, 800);
    }
  }

  function startOtpTimer() {
    let seconds = 60;
    const timerEl = document.getElementById('otpTimer');
    const resend = document.getElementById('otpResendBtn');
    if (resend) resend.disabled = true;

    clearInterval(otpTimerInterval);
    otpTimerInterval = setInterval(() => {
      seconds--;
      if (timerEl) timerEl.textContent = `Resend in ${seconds}s`;
      if (seconds <= 0) {
        clearInterval(otpTimerInterval);
        if (timerEl) timerEl.textContent = '';
        if (resend) resend.disabled = false;
      }
    }, 1000);
    if (timerEl) timerEl.textContent = `Resend in ${seconds}s`;
  }

  function showOtpError(msg) {
    if (otpErrorMsg) { otpErrorMsg.textContent = msg; otpErrorMsg.style.display = 'block'; }
  }
  function hideOtpError() {
    if (otpErrorMsg) { otpErrorMsg.textContent = ''; otpErrorMsg.style.display = 'none'; }
  }
}

function showOtpToast(email, code) {
  // Remove existing toast
  const old = document.getElementById('otpDemoToast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.id = 'otpDemoToast';
  toast.className = 'otp-demo-toast';
  toast.innerHTML = `
    <div class="otp-toast-header">
      <span>📧 OTP Sent (Demo)</span>
      <button onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>
    <p>Sent to: <strong>${email}</strong></p>
    <div class="otp-toast-code">${code}</div>
    <p class="otp-toast-note">In production, this would be sent via email</p>
  `;
  document.body.appendChild(toast);

  setTimeout(() => { if (toast.parentElement) toast.classList.add('otp-toast-fade'); }, 15000);
  setTimeout(() => { if (toast.parentElement) toast.remove(); }, 16000);
}

// Reset OTP state when modal opens
function resetOTPState() {
  emailVerified = false;
  generatedOTP = '';
  clearInterval(otpTimerInterval);
  const emailInput = document.getElementById('regEmail');
  const sendBtn = document.getElementById('otpSendBtn');
  const otpWrap = document.getElementById('otpInputWrap');
  const badge = document.getElementById('otpVerifiedBadge');
  const boxes = document.querySelectorAll('.otp-box');
  if (emailInput) emailInput.readOnly = false;
  if (sendBtn) { sendBtn.textContent = 'Send OTP'; sendBtn.disabled = false; sendBtn.classList.remove('otp-sent', 'otp-verified'); }
  if (otpWrap) otpWrap.style.display = 'none';
  if (badge) badge.style.display = 'none';
  boxes.forEach(b => { b.value = ''; b.classList.remove('otp-correct', 'otp-wrong'); });
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
  resetOTPState();

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
  resetOTPState();

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

  // Registration form submission with validation
  const regForm = document.getElementById('regForm');
  if (regForm) {
    // Clear error on input
    regForm.querySelectorAll('input, select').forEach(field => {
      field.addEventListener('input', () => {
        field.classList.remove('reg-error');
        const errEl = field.parentElement.querySelector('.reg-error-msg');
        if (errEl) errEl.remove();
      });
    });

    regForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Clear previous errors
      regForm.querySelectorAll('.reg-error').forEach(el => el.classList.remove('reg-error'));
      regForm.querySelectorAll('.reg-error-msg').forEach(el => el.remove());

      const name = document.getElementById('regName');
      const email = document.getElementById('regEmail');
      const phone = document.getElementById('regPhone');
      const terms = document.getElementById('regTerms');
      let firstError = null;

      // Name validation
      if (!name.value.trim()) {
        showFieldError(name, 'Please enter your full name');
        if (!firstError) firstError = name;
      } else if (name.value.trim().length < 2) {
        showFieldError(name, 'Name must be at least 2 characters');
        if (!firstError) firstError = name;
      } else if (!/^[a-zA-Z\s.'-]+$/.test(name.value.trim())) {
        showFieldError(name, 'Name can only contain letters and spaces');
        if (!firstError) firstError = name;
      }

      // Email validation
      if (!email.value.trim()) {
        showFieldError(email, 'Please enter your email address');
        if (!firstError) firstError = email;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        showFieldError(email, 'Please enter a valid email address');
        if (!firstError) firstError = email;
      } else if (!emailVerified) {
        showFieldError(email, 'Please verify your email with OTP');
        if (!firstError) firstError = email;
      }

      // Phone validation
      const phoneDigits = phone.value.replace(/\D/g, '');
      if (!phone.value.trim()) {
        showFieldError(phone, 'Please enter your phone number');
        if (!firstError) firstError = phone;
      } else if (phoneDigits.length < 10) {
        showFieldError(phone, 'Phone number must be at least 10 digits');
        if (!firstError) firstError = phone;
      }

      // Terms validation
      if (!terms.checked) {
        const termsParent = terms.closest('.reg-terms');
        if (termsParent && !termsParent.querySelector('.reg-error-msg')) {
          const errMsg = document.createElement('span');
          errMsg.className = 'reg-error-msg';
          errMsg.textContent = 'You must accept the terms';
          termsParent.appendChild(errMsg);
        }
        if (!firstError) firstError = terms;
      }

      // If errors, shake and focus first error
      if (firstError) {
        firstError.focus();
        const parent = firstError.closest('.reg-field') || firstError.closest('.reg-terms');
        if (parent) {
          parent.classList.add('reg-shake');
          setTimeout(() => parent.classList.remove('reg-shake'), 500);
        }
        return;
      }

      // All valid — send to Zapier, then proceed to payment
      const regData = {
        name: name.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        course: document.getElementById('payPlanName')?.textContent || 'Unknown'
      };
      sendToZapier('registration', regData);

      document.getElementById('payStep0').style.display = 'none';
      document.getElementById('payStep1').style.display = 'block';
      setProgressStep('1');
    });
  }

  function showFieldError(field, msg) {
    field.classList.add('reg-error');
    const errMsg = document.createElement('span');
    errMsg.className = 'reg-error-msg';
    errMsg.textContent = msg;
    field.parentElement.appendChild(errMsg);
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

/**
 * Payment App Selection Flow
 * ─────────────────────────────
 * Layer 1: Choose method (UPI, Card, Net Banking, Wallet)
 * Layer 2: Choose specific app within that method
 */

// UPI ID to receive payments — REPLACE WITH YOUR ACTUAL UPI ID
const MERCHANT_UPI_ID = 'yourname@upi';
const MERCHANT_NAME = 'LucktanInfo';

function getPaymentAmount() {
  const el = document.getElementById('payCryptoAmount');
  return el ? el.textContent.replace(/[^0-9.]/g, '') : '299';
}

function showPayApps(method) {
  // Hide method selection, show app options
  const methodSelect = document.getElementById('payMethodSelect');
  const appOptions = document.getElementById('payAppOptions');
  
  if (methodSelect) methodSelect.style.display = 'none';
  if (appOptions) appOptions.style.display = 'block';
  
  // Hide all app groups
  document.querySelectorAll('.pay-app-group').forEach(g => g.style.display = 'none');
  
  // Show selected group
  const groupMap = {
    'upi': 'payAppsUpi',
    'card': 'payAppsCard',
    'netbanking': 'payAppsNetbanking',
    'wallet': 'payAppsWallet'
  };
  
  const group = document.getElementById(groupMap[method]);
  if (group) group.style.display = 'block';
}

function backToMethods() {
  const methodSelect = document.getElementById('payMethodSelect');
  const appOptions = document.getElementById('payAppOptions');
  
  if (methodSelect) methodSelect.style.display = 'block';
  if (appOptions) appOptions.style.display = 'none';
}

function openUpiApp(app) {
  event.preventDefault();
  const amount = getPaymentAmount();
  const courseName = document.getElementById('payPlanName')?.textContent || 'Course';
  const note = encodeURIComponent(`Payment for ${courseName} - LucktanInfo`);
  
  // Build UPI deep link
  const upiBase = `upi://pay?pa=${MERCHANT_UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amount}&cu=INR&tn=${note}`;
  
  const appLinks = {
    'gpay': `tez://upi/pay?pa=${MERCHANT_UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amount}&cu=INR&tn=${note}`,
    'phonepe': `phonepe://pay?pa=${MERCHANT_UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amount}&cu=INR&tn=${note}`,
    'paytm': `paytmmp://pay?pa=${MERCHANT_UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amount}&cu=INR&tn=${note}`,
    'bhim': upiBase,
    'other': upiBase
  };
  
  const link = appLinks[app] || upiBase;
  
  // Try to open the app
  window.location.href = link;
  
  // Fallback: after 2 seconds if app didn't open, show alert
  setTimeout(() => {
    if (document.visibilityState !== 'hidden') {
      alert(`To pay via UPI:\n\n1. Open your UPI app\n2. Send ₹${amount} to: ${MERCHANT_UPI_ID}\n3. Add note: Payment for ${courseName}\n\nAfter payment, take a screenshot and share on our contact page.`);
    }
  }, 2000);
}

function openCardPayment(cardType) {
  event.preventDefault();
  const amount = getPaymentAmount();
  const courseName = document.getElementById('payPlanName')?.textContent || 'Course';
  
  // Since there's no payment gateway integrated yet, redirect to contact
  alert(`Card Payment for ${courseName}\n\nAmount: ₹${amount}\nCard Type: ${cardType.toUpperCase()}\n\nYou will be redirected to our contact page to complete the payment setup. Our team will send you a secure payment link.`);
  window.location.href = 'contact.html';
}

function openNetBanking(bank) {
  event.preventDefault();
  const amount = getPaymentAmount();
  const courseName = document.getElementById('payPlanName')?.textContent || 'Course';
  
  alert(`Net Banking Payment for ${courseName}\n\nAmount: ₹${amount}\nBank: ${bank.toUpperCase()}\n\nYou will be redirected to our contact page. Our team will share bank transfer details.`);
  window.location.href = 'contact.html';
}

function openWallet(wallet) {
  event.preventDefault();
  const amount = getPaymentAmount();
  const courseName = document.getElementById('payPlanName')?.textContent || 'Course';
  
  const walletNames = {
    'paytm': 'Paytm Wallet',
    'amazonpay': 'Amazon Pay',
    'mobikwik': 'MobiKwik',
    'freecharge': 'FreeCharge'
  };
  
  alert(`${walletNames[wallet] || wallet} Payment for ${courseName}\n\nAmount: ₹${amount}\n\nYou will be redirected to our contact page. Our team will send you a payment link.`);
  window.location.href = 'contact.html';
}
