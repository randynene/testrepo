(function () {
  'use strict';

  function initMobileNav() {
    var hamburger = document.querySelector('[data-nav-open]');
    var sheet = document.querySelector('[data-nav-sheet]');
    var close = document.querySelector('[data-nav-close]');
    if (!hamburger || !sheet) return;

    function open() {
      sheet.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      if (window.gsap) {
        var items = sheet.querySelectorAll('.nav-sheet__link, .nav-sheet__actions > *');
        gsap.fromTo(sheet, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
        gsap.fromTo(items, { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.06, delay: 0.1 });
      }
    }
    function shut() {
      if (window.gsap) {
        gsap.to(sheet, {
          opacity: 0, duration: 0.25, ease: 'power2.in',
          onComplete: function () {
            sheet.classList.remove('is-open');
            document.body.style.overflow = '';
          }
        });
      } else {
        sheet.classList.remove('is-open');
        document.body.style.overflow = '';
      }
    }
    hamburger.addEventListener('click', open);
    if (close) close.addEventListener('click', shut);
    sheet.querySelectorAll('a,button').forEach(function (el) {
      el.addEventListener('click', shut);
    });
  }

  function initBookingSlots() {
    var slots = document.querySelectorAll('[data-hook="calendar"] .booking-slot');
    slots.forEach(function (slot) {
      slot.addEventListener('click', function () {
        slots.forEach(function (s) { s.classList.remove('is-selected'); });
        slot.classList.add('is-selected');
        if (window.gsap) {
          gsap.fromTo(slot, { scale: 0.97 }, { scale: 1, duration: 0.4, ease: 'back.out(2)' });
        }
      });
    });
  }

  function initEnquiryForm() {
    var form = document.querySelector('[data-hook="webhook"]');
    if (!form) return;
    var note = form.querySelector('[data-form-note]');
    var submitBtn = form.querySelector('[data-form-submit]');
    var requiredFields = ['full_name', 'email', 'company', 'message', 'consent'];

    function fieldEl(name) {
      return form.querySelector('[name="' + name + '"]');
    }

    function showError(el, message) {
      el.classList.add('is-invalid');
      var wrap = el.closest('.field');
      var noteEl = wrap && wrap.querySelector('.field__note');
      if (noteEl) {
        noteEl.textContent = message;
        noteEl.classList.add('field__note--error');
      }
    }

    function clearError(el) {
      el.classList.remove('is-invalid');
      var wrap = el.closest('.field');
      var noteEl = wrap && wrap.querySelector('.field__note');
      if (noteEl) {
        noteEl.classList.remove('field__note--error');
        noteEl.textContent = noteEl.getAttribute('data-default-text') || '';
      }
    }

    function validate() {
      var firstInvalid = null;
      requiredFields.forEach(function (name) {
        var el = fieldEl(name);
        if (!el) return;
        var invalid = false;
        if (el.type === 'checkbox') {
          invalid = !el.checked;
        } else if (name === 'email') {
          invalid = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
        } else {
          invalid = el.value.trim() === '';
        }
        if (invalid) {
          showError(el, name === 'email' ? 'Enter a valid work email.' : 'This field is required.');
          if (!firstInvalid) firstInvalid = el;
        } else {
          clearError(el);
        }
      });
      return firstInvalid;
    }

    requiredFields.forEach(function (name) {
      var el = fieldEl(name);
      if (el) el.addEventListener('blur', validate);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstInvalid = validate();
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }
      window.setTimeout(function () {
        if (note) note.textContent = 'Thanks. This form posts to your automation endpoint.';
        if (submitBtn) {
          submitBtn.textContent = 'Sent';
        }
      }, 400);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    initBookingSlots();
    initEnquiryForm();
  });
})();
