/**
 * پوسته مشترک کنسول پایه
 * ---------------------------------------------------------------------------
 * تنها منبع حقیقت برای سایدبار است. هر صفحه فقط یک <aside id="app-sidebar">
 * خالی می‌گذارد و این اسکریپت:
 *   1) ساختار سایدبار را می‌سازد،
 *   2) اتصال سوپربیس را از /api/supabase-config می‌گیرد،
 *   3) نشست کاربر را بررسی و در صورت نبود، به صفحه ورود هدایت می‌کند،
 *   4) نام/نقش کاربر را نمایش می‌دهد و آیتم‌های منو را بر اساس نقش فیلتر می‌کند،
 *   5) آیتم فعال منو را مشخص و خروج و منوی موبایل را مدیریت می‌کند.
 */

const NAV_GROUPS = [
  {
    title: 'اصلی',
    items: [
      { href: 'home.html', icon: 'fa-gauge', label: 'داشبورد', roles: 'student,teacher,admin,super_admin' },
    ],
  },
  {
    title: 'آموزش',
    items: [
      { href: 'my-exams.html', icon: 'fa-file-lines', label: 'آزمون‌های من', roles: 'student,teacher,admin,super_admin' },
      { href: 'tasks.html', icon: 'fa-list-check', label: 'تکالیف / وظایف', roles: 'student,teacher,admin,super_admin' },
      { href: 'online-classes.html', icon: 'fa-calendar-days', label: 'برنامه هفتگی / کلاس‌های آنلاین', roles: 'student,teacher,admin,super_admin' },
      { href: 'classes.html', icon: 'fa-chalkboard-teacher', label: 'کلاس‌ها', roles: 'teacher,admin,super_admin' },
    ],
  },
  {
    title: 'آزمون‌ها',
    items: [
      { href: 'create-exam.html', icon: 'fa-file-pen', label: 'طراحی آزمون', roles: 'teacher,admin,super_admin' },
      { href: 'exams.html', icon: 'fa-folder-open', label: 'مدیریت آزمون‌ها', roles: 'teacher,admin,super_admin' },
      { href: 'take-exam.html', icon: 'fa-pencil', label: 'شرکت در آزمون', roles: 'student,admin,super_admin' },
    ],
  },
  {
    title: 'گزارش‌ها',
    items: [
      { href: 'report-card.html', icon: 'fa-graduation-cap', label: 'نتایج و کارنامه', roles: 'student,teacher,admin,super_admin' },
      { href: 'scores.html', icon: 'fa-chart-line', label: 'نمرات دانش‌آموزان', roles: 'teacher,admin,super_admin' },
      { href: 'reports.html', icon: 'fa-clipboard-list', label: 'گزارش‌ها و حضور و غیاب', roles: 'teacher,admin,super_admin' },
    ],
  },
  {
    title: 'مدیریت',
    items: [
      { href: 'users.html', icon: 'fa-users', label: 'مدیریت کاربران', roles: 'admin,super_admin' },
      { href: 'schools.html', icon: 'fa-school', label: 'مدیریت مدارس', roles: 'super_admin' },
      { href: 'subscriptions.html', icon: 'fa-credit-card', label: 'اشتراک‌ها', roles: 'super_admin' },
      { href: 'subjects.html', icon: 'fa-book', label: 'مدیریت درس‌ها', roles: 'teacher,admin,super_admin' },
    ],
  },
  {
    title: 'حساب کاربری',
    items: [
      { href: 'profile.html', icon: 'fa-user-circle', label: 'پروفایل من', roles: 'student,teacher,admin,super_admin' },
    ],
  },
];

const ROLE_LABELS = {
  student: 'دانش‌آموز',
  teacher: 'معلم',
  consultant: 'مشاور',
  admin: 'مدیر مدرسه',
  super_admin: 'مدیر کل',
};

function renderSidebar() {
  const host = document.getElementById('app-sidebar');
  if (!host) return;

  const groupsHtml = NAV_GROUPS.map((group) => {
    const itemsHtml = group.items
      .map(
        (item) => `
                    <li class="sidebar-menu-item" data-visible-for="${item.roles}">
                        <a class="sidebar-link" href="${item.href}">
                            <i class="fa-solid ${item.icon}"></i>
                            <span>${item.label}</span>
                        </a>
                    </li>`
      )
      .join('');
    return `
                <div class="sidebar-group">
                    <div class="sidebar-group-title">${group.title}</div>
                    <ul class="sidebar-menu">${itemsHtml}
                    </ul>
                </div>`;
  }).join('');

  host.innerHTML = `
            <div class="sidebar-header">
                <img src="assets/logo.svg" alt="لوگو" class="sidebar-logo">
                <div class="sidebar-title-block">
                    <span class="sidebar-title">کنسول پایه</span>
                    <span class="sidebar-subtitle">پنل مدیریت مدرسه</span>
                </div>
            </div>
            <div class="sidebar-user">
                <div class="sidebar-avatar" id="sidebar-avatar-initial">…</div>
                <div class="sidebar-user-meta">
                    <span class="sidebar-user-name" id="sidebar-user-name">در حال بارگذاری…</span>
                    <span class="sidebar-user-role" id="sidebar-user-role">—</span>
                </div>
            </div>
            <nav class="sidebar-nav-groups">${groupsHtml}
            </nav>
            <div class="sidebar-footer">
                <span>© کنسول پایه</span>
                <button id="sidebar-logout" class="sidebar-logout-btn" type="button">خروج</button>
            </div>`;
}

function highlightActiveLink() {
  const current = (window.location.pathname.split('/').pop() || 'home.html').toLowerCase();
  document.querySelectorAll('.sidebar-menu-item').forEach((item) => {
    const link = item.querySelector('.sidebar-link');
    if (!link) return;
    const href = (link.getAttribute('href') || '').split('/').pop().toLowerCase();
    if (href && href === current) item.classList.add('active');
  });
}

function applyRoleVisibility(role) {
  document.querySelectorAll('[data-visible-for]').forEach((el) => {
    const allowed = (el.getAttribute('data-visible-for') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!allowed.length) return;
    if (role === 'super_admin') return;
    if (!allowed.includes(role)) el.style.display = 'none';
  });
}

function setupMobileSidebar() {
  const layout = document.getElementById('app-layout') || document.querySelector('.app-layout');
  const toggle = document.getElementById('sidebar-toggle');
  if (!layout || !toggle) return;

  let backdrop = layout.querySelector('.sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    layout.appendChild(backdrop);
  }

  const close = () => layout.classList.remove('sidebar-open');
  toggle.addEventListener('click', () => layout.classList.toggle('sidebar-open'));
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // سایدبار و رفتار موبایل مستقل از احراز هویت ساخته می‌شوند تا صفحه فوراً کامل دیده شود.
  renderSidebar();
  highlightActiveLink();
  setupMobileSidebar();

  let supabaseClient = window.supabaseClient;

  try {
    if (!supabaseClient) {
      const res = await fetch('/api/supabase-config');
      if (!res.ok) {
        console.error('دریافت تنظیمات سوپربیس ناموفق بود.');
        return;
      }
      const { url, anonKey } = await res.json();
      const lib = window.supabase || window.SupabaseClient || window.supabaseJs;
      if (!lib || !lib.createClient) {
        console.error('کتابخانه سوپربیس بارگذاری نشده است.');
        return;
      }
      supabaseClient = lib.createClient(url, anonKey);
      window.supabaseClient = supabaseClient;
    }

    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (!session) {
      window.location.href = '/login.html';
      return;
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!profile) return;

    const role = profile.role || 'student';
    const displayName = profile.name || session.user.email || 'کاربر';

    const nameEl = document.getElementById('sidebar-user-name');
    const roleEl = document.getElementById('sidebar-user-role');
    const avatarEl = document.getElementById('sidebar-avatar-initial');

    if (nameEl) nameEl.textContent = displayName;
    if (roleEl) roleEl.textContent = ROLE_LABELS[role] || role;
    if (avatarEl) avatarEl.textContent = displayName.trim().charAt(0);

    applyRoleVisibility(role);

    if (window.initSidebar) {
      window.initSidebar(profile);
    }

    const logoutBtn = document.getElementById('sidebar-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabaseClient.auth.signOut();
        window.location.href = '/login.html';
      });
    }
  } catch (e) {
    console.error('auth-check error:', e);
  }
});
