(function() {
    'use strict';
  
    var WIPE_DURATION_MS = 1200;
  
    function initFarmSlider(sectionEl) {
      if (!sectionEl || sectionEl._sliderInitialized) return;
      sectionEl._sliderInitialized = true;
  
      const slideCount = parseInt(sectionEl.dataset.slideCount, 10) || 0;
      if (slideCount <= 1) return;
  
      const slides = Array.from(sectionEl.querySelectorAll('.farm-hero__slide'));
      const thumbTrack = sectionEl.querySelector('[data-thumb-track]');
      const nextBtn = sectionEl.querySelector('[data-hero-next]');
      const prevBtn = sectionEl.querySelector('[data-hero-prev]');
      const currentIndicator = sectionEl.querySelector('[data-current-indicator]');
      const progressBar = sectionEl.querySelector('[data-progress-bar]');
      const progressTrack = sectionEl.querySelector('.farm-hero__page-track');
      const liveBorder = sectionEl.querySelector('.farm-hero__border-live');
  
      const isAutoplayEnabled = sectionEl.dataset.autoplay === 'true';
      const autoplaySpeed = parseInt(sectionEl.dataset.autoplaySpeed, 10) || 6000;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
      const wipeMs = prefersReducedMotion ? 0 : WIPE_DURATION_MS;
      sectionEl.style.setProperty('--hero-wipe-duration', wipeMs + 'ms');
  
      const TOTAL_PERIMETER = 400;
      if (liveBorder) {
        liveBorder.style.strokeDasharray = TOTAL_PERIMETER;
        liveBorder.style.strokeDashoffset = TOTAL_PERIMETER;
      }
  
      let currentIndex = 0;
      let animFrameId = null;
      let startTime = null;
      let isLocked = false;
      let lockTimer = null;
  
      function formatNumber(num) {
        return num < 10 ? '0' + num : '' + num;
      }
  
      // ===== Animate.css fade-up helper =====
      function triggerContentAnimation(slide) {
        if (!slide) return;
  
        const items = slide.querySelectorAll('.farm-hero__anim-item');
        if (!items.length) return;
  
        if (prefersReducedMotion) {
          items.forEach((el) => {
            el.classList.remove('animate__animated', 'animate__fadeInUp');
            el.style.opacity = '1';
          });
          return;
        }
  
        items.forEach((el, index) => {
          // previous classes hatao taaki animation dubara chale
          el.classList.remove('animate__animated', 'animate__fadeInUp');
          el.style.opacity = '';
  
          // staggered delay (optional – soft look)
          el.style.setProperty('--animate-delay', (index * 0.12) + 's');
  
          // force reflow
          void el.offsetWidth;
  
          // Animate.css classes add karo
          el.classList.add('animate__animated', 'animate__fadeInUp');
        });
      }
  
      function syncUI() {
        slides.forEach((slide, idx) => {
          slide.setAttribute('aria-hidden', idx === currentIndex ? 'false' : 'true');
        });
  
        const nextPreviewIndex = (currentIndex + 1) % slideCount;
        if (thumbTrack) {
          thumbTrack.style.transform = `translateX(-${nextPreviewIndex * 100}%)`;
        }
  
        if (currentIndicator) {
          currentIndicator.textContent = formatNumber(currentIndex + 1);
        }
        if (progressBar) {
          progressBar.style.width = (((currentIndex + 1) / slideCount) * 100) + '%';
        }
        if (progressTrack) {
          progressTrack.setAttribute('aria-valuenow', currentIndex + 1);
        }
      }
  
      function goTo(targetIndex, instant) {
        if (isLocked && !instant) return false;
  
        let nextIndex = targetIndex;
        if (nextIndex < 0) nextIndex = slideCount - 1;
        else if (nextIndex >= slideCount) nextIndex = 0;
  
        if (nextIndex === currentIndex && !instant) return false;
  
        const outgoing = slides[currentIndex];
        const incoming = slides[nextIndex];
        currentIndex = nextIndex;
  
        if (instant) sectionEl.classList.add('is-instant');
  
        slides.forEach((slide) => {
          if (slide !== outgoing && slide !== incoming) {
            slide.classList.remove('is-active', 'is-prev');
          }
        });
  
        // Instant reset
        incoming.classList.remove('is-active');
        void incoming.offsetWidth;
  
        if (outgoing !== incoming) {
          outgoing.classList.remove('is-active');
          outgoing.classList.add('is-prev');
        }
        incoming.classList.add('is-active');
  
        if (instant) {
          void incoming.offsetWidth;
          sectionEl.classList.remove('is-instant');
        } else {
          isLocked = true;
          clearTimeout(lockTimer);
          lockTimer = setTimeout(() => { isLocked = false; }, wipeMs);
        }
  
        // Content animation trigger (har slide change + initial)
        triggerContentAnimation(incoming);
  
        syncUI();
        startTime = null;
        return true;
      }
  
      function loop(timestamp) {
        if (!isAutoplayEnabled || prefersReducedMotion) return;
  
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / autoplaySpeed, 1);
  
        if (liveBorder) {
          liveBorder.style.strokeDashoffset = TOTAL_PERIMETER - (progress * TOTAL_PERIMETER);
        }
  
        if (elapsed >= autoplaySpeed) {
          goTo(currentIndex + 1);
          startTime = timestamp;
        }
  
        animFrameId = requestAnimationFrame(loop);
      }
  
      function startAnimation() {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        startTime = null;
        animFrameId = requestAnimationFrame(loop);
      }
  
      function stopAnimation() {
        if (animFrameId) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }
      }
  
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (goTo(currentIndex + 1)) startAnimation();
        });
      }
  
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (goTo(currentIndex - 1)) startAnimation();
        });
      }
  
      sectionEl.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
          if (goTo(currentIndex + 1)) startAnimation();
        } else if (e.key === 'ArrowLeft') {
          if (goTo(currentIndex - 1)) startAnimation();
        }
      });
  
      /* Theme editor support */
      sectionEl._selectSlide = function(index) {
        stopAnimation();
        goTo(index, true);
      };
      sectionEl._resumeSlider = function() {
        startAnimation();
      };
      sectionEl._cleanupSlider = function() {
        stopAnimation();
        clearTimeout(lockTimer);
      };
  
      // Initial sync + first slide animation
      syncUI();
  
      // Initial page load animation
      const firstActive = sectionEl.querySelector('.farm-hero__slide.is-active');
      if (firstActive) {
        requestAnimationFrame(() => {
          triggerContentAnimation(firstActive);
        });
      }
  
      startAnimation();
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.farm-hero-section').forEach(initFarmSlider);
      });
    } else {
      document.querySelectorAll('.farm-hero-section').forEach(initFarmSlider);
    }
  
    document.addEventListener('shopify:section:load', (event) => {
      const section = event.target.querySelector('.farm-hero-section');
      if (section) initFarmSlider(section);
    });
  
    document.addEventListener('shopify:section:unload', (event) => {
      const section = event.target.querySelector('.farm-hero-section');
      if (section && typeof section._cleanupSlider === 'function') {
        section._cleanupSlider();
      }
    });
  
    document.addEventListener('shopify:block:select', (event) => {
      const sectionEl = event.target.closest('.farm-hero-section');
      if (!sectionEl || typeof sectionEl._selectSlide !== 'function') return;
      const index = parseInt(event.target.dataset.index, 10);
      if (!isNaN(index)) sectionEl._selectSlide(index);
    });
  
    document.addEventListener('shopify:block:deselect', (event) => {
      const sectionEl = event.target.closest('.farm-hero-section');
      if (sectionEl && typeof sectionEl._resumeSlider === 'function') {
        sectionEl._resumeSlider();
      }
    });
  })();