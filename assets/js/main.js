/* ============================================================
   KOTO HOUSE — main.js
   ============================================================ */

'use strict';

/* ---------- Nav: scroll state ---------- */
const header    = document.getElementById('site-header');
const hamburger = document.getElementById('hamburger');
const heroEl    = document.querySelector('.hero');

function updateHeader() {
  const heroHeight = heroEl ? heroEl.offsetHeight : 80;
  const scrolled   = window.scrollY > heroHeight - 80;
  header.classList.toggle('scrolled', scrolled);
  hamburger.classList.toggle('has-bg', scrolled);
}

window.addEventListener('scroll', updateHeader, { passive: true });
window.addEventListener('resize', updateHeader, { passive: true });
updateHeader();

/* ---------- Hamburger / Drawer ---------- */
const drawer       = document.getElementById('drawer');
const drawerClose  = document.getElementById('drawer-close');
const overlay      = document.getElementById('drawer-overlay');
const drawerLinks  = document.querySelectorAll('.drawer__link');

function openDrawer() {
  drawer.classList.add('is-open');
  overlay.classList.add('is-active');
  drawer.setAttribute('aria-hidden', 'false');
  hamburger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  drawer.classList.remove('is-open');
  overlay.classList.remove('is-active');
  drawer.setAttribute('aria-hidden', 'true');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', openDrawer);
drawerClose.addEventListener('click', closeDrawer);
overlay.addEventListener('click', closeDrawer);
drawerLinks.forEach(link => link.addEventListener('click', closeDrawer));

/* ---------- Schedule: fetch & render ---------- */
async function loadSchedule() {
  const list = document.getElementById('schedule-list');
  if (!list) return;

  let events = [];

  try {
    const res = await fetch('assets/data/schedule.json');
    if (!res.ok) throw new Error('fetch failed');
    events = await res.json();
  } catch (e) {
    console.warn('schedule.json を読み込めませんでした:', e);
    return;
  }

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  events.forEach((ev, i) => {
    const [year, month, day] = ev.date.split('-');
    const monthLabel = MONTHS[parseInt(month, 10) - 1];
    const isConcert  = ev.type === '演奏会';

    const li = document.createElement('li');
    li.className = 'schedule-item fade-in';
    li.style.transitionDelay = `${i * 80}ms`;
    if (i >= 2) li.classList.add('schedule-item--extra');
    li.innerHTML = `
      <div class="schedule-date">
        <div class="schedule-date__block">
          <span class="date-num">${day}</span>
          <span class="date-day">${ev.day}</span>
        </div>
        <span class="date-month-year">${monthLabel} ${year}</span>
      </div>
      <div class="schedule-badge">
        <span class="badge ${isConcert ? 'badge--concert' : 'badge--exhibition'}">${ev.type}</span>
      </div>
      <div class="schedule-info">
        <span class="schedule-info__title">${ev.title}</span>
        <span class="schedule-info__time">${ev.time}</span>
      </div>
      <img src="assets/images/ui/icon-arrow.png" alt="" class="schedule-arrow">
    `;

    list.appendChild(li);
  });

  /* 動的追加要素もオブザーバーに登録 */
  observeElements(list.querySelectorAll('.schedule-item'));

  /* SP: スケジュール一覧ボタンで追加2件をトグル */
  const toggleBtn = document.querySelector('.schedule-more .link-schedule');
  if (toggleBtn) {
    const span = toggleBtn.querySelector('span');
    toggleBtn.addEventListener('click', (e) => {
      if (window.innerWidth > 768) return;
      e.preventDefault();
      const expanded = list.classList.toggle('is-expanded');
      list.querySelectorAll('.schedule-item--extra').forEach(el => {
        if (expanded) el.classList.add('is-visible');
      });
      if (span) span.textContent = expanded ? '閉じる' : 'スケジュール一覧';
    });
  }
}

/* ---------- Intersection Observer: fade-in ---------- */
function observeElements(elements) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => observer.observe(el));
}

/* ---------- Decorative image error: hide silently ---------- */
function hideDecorativeOnError() {
  document.querySelectorAll('img[alt=""]').forEach(img => {
    img.addEventListener('error', () => {
      img.style.display = 'none';
    }, { once: true });
  });
}

/* ---------- Image modal ---------- */
function initImageModal() {
  const openButtons = document.querySelectorAll('.image-zoom, .guide-floorplan__zoom');
  const modal = document.getElementById('image-modal');
  if (!openButtons.length || !modal) return;

  const closeButtons = modal.querySelectorAll('.image-modal__close, .image-modal__backdrop');
  const closeButton = modal.querySelector('.image-modal__close');
  const modalImg = modal.querySelector('.image-modal__img');
  let activeButton = null;

  function openModal(button) {
    const img = button.querySelector('img');
    if (img && modalImg) {
      modalImg.src = img.currentSrc || img.src;
      modalImg.alt = img.alt || '';
    }
    activeButton = button;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (closeButton) closeButton.focus();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (activeButton) activeButton.focus();
  }

  openButtons.forEach(button => {
    button.addEventListener('click', () => openModal(button));
  });
  closeButtons.forEach(button => button.addEventListener('click', closeModal));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
}

/* ---------- Modals ---------- */
function initModals() {
  const PERFORMERS = [
    { name: '三宅美紀子', instrument: 'フルート' },
    { name: '中西久美',   instrument: 'ピアノ'   },
    { name: '柴山陽子',   instrument: 'ピアノ'   },
  ];

  function openModal(modal) {
    if (!modal) return;
    modal.removeAttribute('hidden');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      });
    });
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => { modal.setAttribute('hidden', ''); }, 300);
  }

  function getOpenModal() {
    return document.querySelector('.form-modal.is-open, #performer-modal.is-open');
  }

  /* 出演者モーダル：タイトル＆ボディを描画して開く */
  document.querySelectorAll('[data-performer-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = document.getElementById('performer-modal');
      if (!modal) return;
      const titleEl = document.getElementById('performer-modal-title');
      const bodyEl  = document.getElementById('performer-modal-body');
      if (titleEl) titleEl.textContent = '出演者';
      if (bodyEl) {
        bodyEl.innerHTML = PERFORMERS.map(p =>
          `<p><strong>${p.name}</strong>（${p.instrument}）</p>`
        ).join('');
      }
      openModal(modal);
    });
  });

  /* フォームモーダルを開く：属性値+"-modal" */
  document.querySelectorAll('[data-form-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-form-modal-open') + '-modal';
      openModal(document.getElementById(id));
    });
  });

  /* アンカーリンクでモーダルを開く */
  document.querySelectorAll('a[href^="#"][href$="-modal"]').forEach(a => {
    a.addEventListener('click', e => {
      const modal = document.querySelector(a.getAttribute('href'));
      if (!modal) return;
      e.preventDefault();
      openModal(modal);
    });
  });

  /* モーダルを閉じる */
  document.querySelectorAll('[data-form-modal-close], [data-performer-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(btn.closest('.form-modal') || document.getElementById('performer-modal'));
    });
  });

  /* Escape キー */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const modal = getOpenModal();
      if (modal) closeModal(modal);
    }
  });

  /* Formspree フォーム送信 */
  document.querySelectorAll('[data-formspree-form]').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const action = form.getAttribute('action');
      if (!action) return;
      try {
        const res = await fetch(action, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form),
        });
        const fieldsEl   = form.querySelector('[data-form-fields]');
        const messageEl  = form.querySelector('[data-form-message]');
        if (res.ok) {
          if (fieldsEl)  fieldsEl.hidden = true;
          if (messageEl) {
            messageEl.hidden = false;
            messageEl.textContent = 'お問い合わせありがとうございます。送信が完了しました。';
          }
        } else {
          if (messageEl) {
            messageEl.hidden = false;
            messageEl.textContent = '送信に失敗しました。しばらくしてから再度お試しください。';
          }
        }
      } catch {
        const messageEl = form.querySelector('[data-form-message]');
        if (messageEl) {
          messageEl.hidden = false;
          messageEl.textContent = '通信エラーが発生しました。しばらくしてから再度お試しください。';
        }
      }
    });
  });
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  hideDecorativeOnError();
  initImageModal();
  initModals();
  /* 静的アニメーション要素 */
  observeElements(document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right'));

  /* スケジュール非同期読み込み */
  loadSchedule();
});
