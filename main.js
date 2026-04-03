/* ========================================================================
   BASECAMP — MAIN JS
   ======================================================================== */

// Nav scroll effect
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('solid', scrollY > 60));

// Scroll reveal
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('vis');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

document.querySelectorAll('.rv').forEach(el => io.observe(el));

// Form handling — Formspree with mailto fallback
document.querySelectorAll('form').forEach(form => {
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const origText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
      const resp = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });

      if (resp.ok) {
        form.style.display = 'none';
        const ok = form.nextElementSibling;
        if (ok && ok.classList.contains('success-msg')) ok.style.display = 'block';
      } else {
        fallbackMailto(form);
        btn.textContent = origText;
        btn.disabled = false;
      }
    } catch {
      fallbackMailto(form);
      btn.textContent = origText;
      btn.disabled = false;
    }
  });
});

function fallbackMailto(form) {
  const data = Object.fromEntries(new FormData(form));
  const subject = encodeURIComponent(data._subject || 'Basecamp Inquiry');
  const body = encodeURIComponent(
    Object.entries(data)
      .filter(([k]) => !k.startsWith('_'))
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n\n')
  );
  window.location.href = `mailto:scoutmontero@gmail.com?subject=${subject}&body=${body}`;
}

// Parallax on hero
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      const s = scrollY, h = innerHeight;
      if (s < h) {
        const c = document.querySelector('.hero-content');
        if (c) {
          c.style.transform = `translateY(${s * 0.18}px)`;
          c.style.opacity = Math.max(0, 1 - s / (h * 0.6));
        }
      }
      ticking = false;
    });
    ticking = true;
  }
});
