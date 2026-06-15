document.addEventListener('DOMContentLoaded', () => {
  initCryptoPrice();
  initHeroLiveChart();
  initMobileMenu();
  initFaqAccordion();
  initContactForm();
  initNewsletterForm();

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

      // All valid — proceed to payment
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
