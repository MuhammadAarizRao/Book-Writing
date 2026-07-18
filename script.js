// =========================================================
// SITE SCRIPT
// Handles the mobile menu (opening/closing it, and the
// "Services" dropdown on small screens) and the gentle
// scroll-reveal animation used across the page.
// =========================================================

// Grab the button that toggles the mobile menu, and the nav itself.
const menuToggle = document.getElementById('menu-toggle');
const siteNav = document.getElementById('site-nav');

// 1) Clicking the hamburger button opens/closes the mobile menu.
menuToggle.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('open');
  menuToggle.classList.toggle('open', isOpen);
  menuToggle.setAttribute('aria-expanded', isOpen);
});

// 2) On mobile, tapping "Services" should expand its submenu
//    instead of following the link immediately.
document.querySelectorAll('#site-nav > ul > li').forEach((listItem) => {
  const submenu = listItem.querySelector('.submenu');
  if (!submenu) return; // this menu item has no dropdown, skip it

  const link = listItem.querySelector('a');
  link.addEventListener('click', (event) => {
    const isMobileWidth = window.matchMedia('(max-width:860px)').matches;
    if (isMobileWidth) {
      event.preventDefault();
      listItem.classList.toggle('subopen');
    }
  });
});

// 3) On mobile, clicking a normal (non-dropdown) nav link should
//    close the mobile menu automatically.
document.querySelectorAll('#site-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    const isMobileWidth = window.matchMedia('(max-width:860px)').matches;
    const linkHasSubmenu = link.closest('li').querySelector('.submenu');

    if (isMobileWidth && !linkHasSubmenu) {
      siteNav.classList.remove('open');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
});

// 4) Scroll-reveal: elements marked data-reveal fade/slide into
//    place the first time they enter the viewport.
const revealTargets = document.querySelectorAll('[data-reveal]');
if (revealTargets.length && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  revealTargets.forEach((el) => revealObserver.observe(el));
} else {
  // Fallback: no IntersectionObserver support, just show everything.
  revealTargets.forEach((el) => el.classList.add('in-view'));
}

// 5) Animated stat counters: numbers count up from 0 to their target
//    the first time they scroll into view, formatted with commas.
const countTargets = document.querySelectorAll('[data-count]');
if (countTargets.length) {
  const formatNumber = (value) => Math.round(value).toLocaleString('en-US');

  const animateCount = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1400;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cubic for a natural "settling" finish
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatNumber(target * eased) + suffix;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = formatNumber(target) + suffix;
      }
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    countTargets.forEach((el) => countObserver.observe(el));
  } else {
    countTargets.forEach((el) => animateCount(el));
  }
}

// 6) Scroll progress bar — fills as the visitor reads down the page.
const scrollProgress = document.getElementById('scroll-progress');
const updateScrollProgress = () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  if (scrollProgress) scrollProgress.style.width = pct + '%';
};
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

// 7) Back-to-top button — appears after scrolling past one viewport.
const backToTop = document.getElementById('back-to-top');
if (backToTop) {
  const toggleBackToTop = () => {
    backToTop.classList.toggle('visible', window.scrollY > window.innerHeight * 0.6);
  };
  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  toggleBackToTop();
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// 8) Active nav link — highlights whichever section is currently in view.
const sectionsWithIds = document.querySelectorAll('section[id]');
const topLevelNavLinks = document.querySelectorAll('#site-nav > ul > li > a[href^="#"]');
if (sectionsWithIds.length && topLevelNavLinks.length && 'IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        topLevelNavLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

  sectionsWithIds.forEach((section) => navObserver.observe(section));
}

// 9) Contact form — validates inline, then submits directly to
//    Supabase (see supabase-config.js). Falls back to a clear
//    error message if Supabase isn't configured or the request fails.
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  const nameField = document.getElementById('cf-name');
  const emailField = document.getElementById('cf-email');
  const messageField = document.getElementById('cf-message');
  const phoneField = document.getElementById('cf-phone');     // optional, only on some pages
  const serviceField = document.getElementById('cf-service'); // optional, only on some pages
  const subjectField = document.getElementById('cf-subject');
  const statusBox = document.getElementById('form-status');
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const setFieldError = (field, hasError) => {
    const wrapper = field.closest('.field');
    if (wrapper) wrapper.classList.toggle('has-error', hasError);
  };

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nameOk = nameField.value.trim().length > 0;
    const emailOk = emailPattern.test(emailField.value.trim());
    const messageOk = messageField.value.trim().length > 0;

    setFieldError(nameField, !nameOk);
    setFieldError(emailField, !emailOk);
    setFieldError(messageField, !messageOk);

    statusBox.className = 'form-status';

    if (!nameOk || !emailOk || !messageOk) {
      statusBox.textContent = 'Please fix the highlighted fields and try again.';
      statusBox.classList.add('error');
      const firstInvalid = contactForm.querySelector('.has-error input, .has-error textarea');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    if (typeof supabaseClient === 'undefined') {
      statusBox.textContent = 'Form is not connected yet — add your Supabase keys to supabase-config.js.';
      statusBox.classList.add('error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
      return;
    }

    const { error } = await supabaseClient.from('contact_submissions').insert([{
      name: nameField.value.trim(),
      email: emailField.value.trim(),
      phone: phoneField ? phoneField.value.trim() : null,
      service: serviceField ? serviceField.value.trim() : null,
      subject: subjectField ? subjectField.value.trim() : null,
      message: messageField.value.trim(),
      source_page: document.title,
    }]);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Message';

    if (error) {
      statusBox.textContent = 'Something went wrong sending your message. Please try again or call us directly.';
      statusBox.classList.add('error');
      console.error('Supabase insert error:', error);
      return;
    }

    statusBox.textContent = "Thanks — your message is in! We'll get back to you within 24 hours.";
    statusBox.classList.add('success');
    contactForm.reset();
  });
}

// 10) Gallery lightbox — click any portfolio item to view it larger.
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');
const galleryItems = document.querySelectorAll('.gallery-item');

if (lightbox && lightboxImg && galleryItems.length) {
  const openLightbox = (imgEl) => {
    const bg = imgEl.style.backgroundImage;
    const match = bg.match(/url\(["']?([^"')]+)["']?\)/);
    if (!match) return;
    lightboxImg.src = match[1];
    lightboxImg.alt = imgEl.closest('.gallery-item').querySelector('span')?.textContent || 'Book cover';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  };

  galleryItems.forEach((item) => {
    const img = item.querySelector('.gallery-img');
    if (!img) return;
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.addEventListener('click', () => openLightbox(img));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(img);
      }
    });
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
}

// 11) Portfolio filter chips — show/hide gallery items by category.
const filterButtons = document.querySelectorAll('.filter-btn');
const filterableItems = document.querySelectorAll('[data-category]');
if (filterButtons.length && filterableItems.length) {
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      filterableItems.forEach((item) => {
        const matches = filter === 'all' || item.getAttribute('data-category') === filter;
        item.classList.toggle('is-hidden', !matches);
      });
    });
  });
}