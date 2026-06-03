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

  observeElements(list.querySelectorAll('.schedule-item'));

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

/* ---------- Form modals ---------- */
function initFormModals() {
  const modals = document.querySelectorAll('.form-modal');
  if (!modals.length) return;

  const ticketModal = document.getElementById('ticket-modal');
  const contactModal = document.getElementById('contact-modal');
  const guideContactModal = document.getElementById('guide-contact-modal');
  let activeTrigger = null;
  let lastTouchTrigger = null;

  function resetForm(modal) {
    const form = modal.querySelector('[data-formspree-form]');
    const message = modal.querySelector('[data-form-message]');
    const submit = modal.querySelector('.form-modal__submit');
    if (message) {
      message.textContent = '';
      message.classList.remove('is-visible', 'is-error');
    }
    if (submit) submit.disabled = false;
  }

  function openFormModal(modal, trigger) {
    if (!modal) return;
    activeTrigger = trigger || null;
    resetForm(modal);
    modal.hidden = false;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const firstField = modal.querySelector('.form-modal__field input, .form-modal__field select, .form-modal__field textarea, .form-modal__close');
    if (firstField) firstField.focus();
  }

  function closeFormModal(modal) {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    modal.hidden = true;
    document.body.style.overflow = '';
    if (activeTrigger) activeTrigger.focus();
  }

  function syncTicketEventTitle(trigger) {
    if (!ticketModal || !trigger) return;
    const eventCard = trigger.closest('.event-card');
    const titleEl = eventCard ? eventCard.querySelector('.event-card__title') : null;
    const eventTitle = titleEl ? titleEl.textContent.trim() : '';
    const eventSelect = ticketModal.querySelector('[data-ticket-event-select]');
    const eventNameInput = ticketModal.querySelector('[data-ticket-event-name]');
    if (!eventTitle) return;

    if (eventSelect) {
      eventSelect.innerHTML = '';
      const option = document.createElement('option');
      option.value = eventTitle;
      option.textContent = eventTitle;
      option.selected = true;
      eventSelect.appendChild(option);
      eventSelect.value = eventTitle;
    }
    if (eventNameInput) eventNameInput.value = eventTitle;
  }

  function getFormModal(trigger) {
    const modalName = trigger.dataset.formModalOpen;
    if (modalName) {
      return document.getElementById(`${modalName}-modal`)
        || document.getElementById(modalName)
        || (modalName === 'contact' ? contactModal : null)
        || (modalName === 'ticket' ? ticketModal : null);
    }

    const href = trigger.getAttribute('href');
    if (href === '#ticket-modal') return ticketModal;
    if (href === '#contact-modal') return contactModal;
    if (href === '#guide-contact-modal') return guideContactModal;
    return null;
  }

  function handleFormModalTrigger(trigger, event) {
    const targetModal = getFormModal(trigger);
    if (!targetModal) return;
    event.preventDefault();
    if (targetModal === ticketModal) syncTicketEventTitle(trigger);
    openFormModal(targetModal, trigger);
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('.event-card__mail, [data-form-modal-open], a[href="#guide-contact-modal"]');
    if (!trigger) return;
    if (lastTouchTrigger === trigger) {
      event.preventDefault();
      lastTouchTrigger = null;
      return;
    }
    handleFormModalTrigger(trigger, event);
  });

  document.addEventListener('touchend', (event) => {
    const trigger = event.target.closest('.event-card__mail, [data-form-modal-open], a[href="#guide-contact-modal"]');
    if (!trigger) return;
    lastTouchTrigger = trigger;
    handleFormModalTrigger(trigger, event);
  }, { passive: false });

  modals.forEach(modal => {
    modal.querySelectorAll('[data-form-modal-close]').forEach(button => {
      button.addEventListener('click', () => closeFormModal(modal));
    });

    const form = modal.querySelector('[data-formspree-form]');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submit = form.querySelector('.form-modal__submit');
      const message = form.querySelector('[data-form-message]');
      if (submit) submit.disabled = true;
      if (message) {
        message.textContent = '';
        message.classList.remove('is-visible', 'is-error');
      }

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });

        if (!response.ok) throw new Error('formspree failed');

        form.reset();
        form.classList.add('is-submitted');
        if (message) {
          message.textContent = modal.id === 'contact-modal' || modal.id === 'guide-contact-modal'
            ? 'お問い合わせありがとうございました。'
            : 'ありがとうございました。内容を確認のうえ、折り返しご連絡いたします。';
          message.classList.add('is-visible');
        }
      } catch (error) {
        if (message) {
          message.textContent = '送信できませんでした。時間をおいてもう一度お試しください。';
          message.classList.add('is-visible', 'is-error');
        }
        if (submit) submit.disabled = false;
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const openModal = document.querySelector('.form-modal.is-open');
    if (openModal) closeFormModal(openModal);
  });
}

function initPerformerModal() {
  const modal = document.getElementById('performer-modal');
  const titleEl = document.getElementById('performer-modal-title');
  const bodyEl = document.getElementById('performer-modal-body');
  const triggers = document.querySelectorAll('[data-performer-modal-open]');
  if (!modal || !titleEl || !bodyEl || !triggers.length) return;

  const profileTitle = '出演者プロフィール';
  const profileBody = `【中西　久美（フルート）】
フルート奏者、フリーアナウンサー、TEAM美魔女メンバー、福岡市生まれ。５歳よりピアノを１０歳よりフルートを始める。東京藝術大学附属音楽高校、及び東京藝術大学卒業。第４３回全日本学生音楽コンクール東京大会第３位。第１０回宮日音楽コンクール優秀賞。大学卒業後、RKB毎日放送アナウンス部に入社。RKB毎日放送を退社してからは、フリーとして活動。RKB今日感テレビ、ＴＮＣももち浜ストアなどに出演。フルート奏者として、クラシック、ジャズ、ポップスなど幅広い共演者たちと演奏活動、フリーアナウンサーとして司会やナレーション、「愛されるコミュニケーション」と題し講話と演奏を交えた講演活動を行っている。クラシック、ジャズやポップスなど幅広い楽曲を収録した「ALL OF ME」アルバムを発売。

【三宅 美紀子（piano）】
クラシックをバックボーンに、ソリストとして九州を中心に活躍するピアニスト。管弦楽器とのアンサンブルや声楽伴奏、語り芝居や民族楽器とのコラボなど、ジャンルを超えた演奏スタイルでイベントや式典、ホールコンサート、カフェライブなど幅広いシーンに出演し、多くの観客を魅了する。オリジナル曲「阿蘇〜あの橋をいつかあなたと〜」（作詞：樋口了一／作曲：三宅美紀子）は各地で歌われ、Amazonにて発売中。FM777「コミてんラジオ」パーソナリティとしても活動する。

【柴山陽子（フルート）】
武蔵野音楽大学音楽学部器楽科フルート専攻卒業。学生時代ガラスのフルートを天皇皇后両陛下・ベルギー国王夫妻の御前にて演奏。2014年より九州古都太宰府にてコンサートホール＆ギャラリーkotohouse太宰府を運営。フルート奏者としても活動している。`;

  let activeTrigger = null;
  let lastTouchTrigger = null;

  function openModal(trigger) {
    activeTrigger = trigger || null;
    titleEl.textContent = profileTitle;
    bodyEl.textContent = profileBody;
    modal.hidden = false;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const closeButton = modal.querySelector('[data-performer-modal-close]');
    if (closeButton) closeButton.focus();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    modal.hidden = true;
    document.body.style.overflow = '';
    if (activeTrigger) activeTrigger.focus();
  }

  function handlePerformerTrigger(trigger, event) {
    event.preventDefault();
    openModal(trigger);
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-performer-modal-open]');
    if (!trigger) return;
    if (lastTouchTrigger === trigger) {
      event.preventDefault();
      lastTouchTrigger = null;
      return;
    }
    handlePerformerTrigger(trigger, event);
  });

  document.addEventListener('touchend', (event) => {
    const trigger = event.target.closest('[data-performer-modal-open]');
    if (!trigger) return;
    lastTouchTrigger = trigger;
    handlePerformerTrigger(trigger, event);
  }, { passive: false });

  modal.querySelectorAll('[data-performer-modal-close]').forEach(button => {
    button.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  hideDecorativeOnError();
  initImageModal();
  initFormModals();
  initPerformerModal();
  observeElements(document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right'));
  loadSchedule();
});
