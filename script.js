  const CONFIG = {
    FORMSPREE_ID: 'xlgvzrqb',
    SUPABASE_URL: 'fxhpbnqrypdtjjwwxpqm',
    SUPABASE_ANON_KEY: '',
  };

  //  Nav scroll 
  const nav = document.getElementById('mainNav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });

  //  Hamburger 
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
  document.querySelectorAll('.mobile-link').forEach(l => {
    l.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });

  //  Scroll reveal 
  const reveals = document.querySelectorAll('.scroll-reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        e.target.style.transitionDelay = (i % 4) * 0.1 + 's';
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  reveals.forEach(el => io.observe(el));

  //  Modals 
  function openModal(id) {
    document.getElementById(id).classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(id) {
    document.getElementById(id).classList.remove('open');
    document.body.style.overflow = '';
  }
  document.querySelectorAll('.custom-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.custom-modal-overlay.open').forEach(m => {
        m.classList.remove('open');
        document.body.style.overflow = '';
      });
      closeLightbox();
    }
  });

  //  Lightbox 
  function openLightbox(src) {
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
  }

  //  Toast 
  function showToast(msg, type = '') {
    const tc = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast-item ' + type;
    t.innerHTML = msg;
    tc.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transition = 'opacity 0.4s';
      setTimeout(() => t.remove(), 400);
    }, 4000);
  }

  //  Supabase: save submission to database 
  async function saveToSupabase(data) {
    if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_URL') return;
    try {
      const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/poptavky`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Supabase error: ' + res.status);
    } catch (err) {
      console.error('Supabase save failed:', err);
    }
  }

  //  Formspree: send email notification 
  async function sendViaFormspree(data) {
    if (!CONFIG.FORMSPREE_ID || CONFIG.FORMSPREE_ID === 'YOUR_FORMSPREE_ID') return false;
    const res = await fetch(`https://formspree.io/f/${CONFIG.FORMSPREE_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        jmeno:       data.jmeno,
        telefon:     data.telefon,
        email:       data.email || '(nevyplněno)',
        typ_prepravy: data.typ_prepravy,
        datum_cesty:  data.datum_cesty || '(nevyplněno)',
        misto_odjezdu: data.misto_odjezdu || '(nevyplněno)',
        cil_cesty:    data.cil_cesty || '(nevyplněno)',
        poznamka:     data.poznamka || '(nevyplněno)',
        odeslano:     data.odeslano_at
      })
    });
    return res.ok;
  }

  //  Contact form submit 
  document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const name   = document.getElementById('fname').value.trim();
    const phone  = document.getElementById('fphone').value.trim();
    const type   = document.getElementById('ftype').value;
    const email  = document.getElementById('femail').value.trim();
    const from   = document.getElementById('ffrom').value.trim();
    const to     = document.getElementById('fto').value.trim();
    const digits = phone.replace(/\D/g, '');

	if (!name || !phone || !type || !email || !from || !to) {
	  showToast('<i class="fas fa-exclamation-triangle me-2"></i>Vyplňte prosím povinná pole.', '');
	  return;
	}
	if (digits.length < 8) {
	  showToast('<i class="fas fa-exclamation-triangle me-2"></i>Telefonní číslo musí mít 8–11 číslic.', '');
	  return;
	}
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
	  showToast('<i class="fas fa-exclamation-triangle me-2"></i>Zadejte prosím platnou e-mailovou adresu.', '');
	  return;
	}

    // Build data object
    const formData = {
      jmeno:         name,
      telefon:       phone,
      email:         document.getElementById('femail').value.trim(),
      typ_prepravy:  type,
      datum_cesty:   document.getElementById('fdate').value,
      misto_odjezdu: document.getElementById('ffrom').value.trim(),
      cil_cesty:     document.getElementById('fto').value.trim(),
      poznamka:      document.getElementById('fnote').value.trim(),
      odeslano_at:   new Date().toISOString()
    };

    // Disable button & show loading
    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Odesílám…';

    try {
      // Run both in parallel
      const [, emailOk] = await Promise.all([
        saveToSupabase(formData),
        sendViaFormspree(formData)
      ]);

      this.reset();
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Odeslat poptávku';

      if (emailOk) {
        showToast('<i class="fas fa-check-circle me-2"></i>Poptávka odeslána! Dispečer vás brzy kontaktuje.', 'success');
      } else {
        // Config keys not set yet — still works visually
        showToast('<i class="fas fa-check-circle me-2"></i>Poptávka přijata! (Nastavte klíče pro e-mail a DB.)', 'success');
      }
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Odeslat poptávku';
      showToast('<i class="fas fa-exclamation-triangle me-2"></i>Chyba při odesílání. Kontaktujte nás telefonicky.', '');
    }
  });
