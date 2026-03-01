/**
 * Personal Details Dashboard - Application Logic
 */

// --- State Management ---
let currentUser = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

const STORAGE_KEY = 'luxe_users_db';

// --- Selectors ---
const views = {
    login: document.getElementById('login-view'),
    register: document.getElementById('register-view'),
    home: document.getElementById('home-view'),
    details: document.getElementById('details-view'),
    remove: document.getElementById('remove-view'),
    password: document.getElementById('password-view')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    startClock();
    renderCalendar();
    setupEventListeners();

    if (window.lucide) {
        window.lucide.createIcons();
    }

    const perspectiveRoot = document.getElementById('perspective-root');
    if (perspectiveRoot) {
        document.addEventListener('mousemove', (e) => {
            if (!views.home.classList.contains('active')) return;
            if (window.innerWidth < 1000) return;

            const x = (window.innerWidth / 2 - e.pageX) / 50;
            const y = (window.innerHeight / 2 - e.pageY) / 50;
            perspectiveRoot.style.transform = `rotateX(${10 + y}deg) rotateY(${-x}deg)`;
        });
    }

    // Register Service Worker for Offline support
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('Service Worker Registered'))
                .catch(err => console.log('SW registration failed:', err));
        });
    }
});

// --- Authentication Logic ---
function initAuth() {
    const session = sessionStorage.getItem('luxe_session');
    if (session) {
        currentUser = JSON.parse(session);
        showView('home');
        updateGreeting();
    } else {
        showView('login');
    }
}

function getUsers() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function handleRegister(username, password) {
    const users = getUsers();
    if (users.find(u => u.username === username)) {
        showToast('Username already exists!', 'error');
        return false;
    }

    users.push({ username, password, details: [] });
    saveUsers(users);
    showToast('Registration successful! Please login.', 'success');
    showView('login');
    return true;
}

function handleLogin(username, password) {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        currentUser = user;
        sessionStorage.setItem('luxe_session', JSON.stringify(user));
        showToast('Login successful!', 'success');
        showView('home');
        updateGreeting();
        return true;
    } else {
        showToast('Invalid username or password.', 'error');
        return false;
    }
}

function handleLogout() {
    currentUser = null;
    sessionStorage.removeItem('luxe_session');
    showView('login');
}

function showView(viewId) {
    Object.values(views).forEach(view => view.classList.remove('active'));
    if (views[viewId]) views[viewId].classList.add('active');
}

function updateGreeting() {
    if (currentUser) {
        const msg = document.getElementById('welcome-message');
        if (msg) msg.textContent = `Hello, ${currentUser.username}`;
    }
}

function startClock() {
    const clockElements = document.querySelectorAll('.clock-display');
    function update() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        clockElements.forEach(el => el.textContent = `${h}:${m}:${s}`);
    }
    setInterval(update, 1000);
    update();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-3d-grid');
    const title = document.getElementById('current-month-year');
    if (!grid) return;
    grid.innerHTML = '';

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const div = document.createElement('div');
        div.className = 'calendar-day-header';
        div.textContent = day;
        grid.appendChild(div);
    });

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (title) title.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    for (let i = 0; i < firstDay; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-date empty';
        grid.appendChild(div);
    }

    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

    for (let i = 1; i <= daysInMonth; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-date';
        if (isCurrentMonth && i === today.getDate()) div.classList.add('current');
        div.textContent = i;
        div.style.transitionDelay = `${i * 10}ms`;
        grid.appendChild(div);
    }
}

function renderDetails() {
    const listBody = document.getElementById('details-list-body');
    if (!listBody) return;
    listBody.innerHTML = '';

    const users = getUsers();
    const user = users.find(u => u.username === currentUser.username);
    const details = user.details || [];

    if (details.length === 0) {
        listBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 2rem; color: var(--text-muted);">No entries yet. Click "Register Details" to add one.</td></tr>';
        return;
    }

    [...details].reverse().forEach(det => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--glass-border)';
        tr.innerHTML = `
            <td style="padding: 1rem; font-weight: 700; color: var(--secondary);">${det.purpose}</td>
            <td style="padding: 1rem;">${det.username}</td>
            <td style="padding: 1rem; font-family: monospace; color: var(--primary);">${det.pass}</td>
        `;
        listBody.appendChild(tr);
    });
}

// --- Event Listeners ---
function setupEventListeners() {
    // Navigation
    document.getElementById('go-to-register').onclick = (e) => { e.preventDefault(); showView('register'); };
    document.getElementById('go-to-login').onclick = (e) => { e.preventDefault(); showView('login'); };

    document.querySelectorAll('.logout-btn').forEach(btn => btn.onclick = handleLogout);

    // Dynamic View Switchers
    const navMapping = {
        'nav-home': 'home',
        'nav-details': 'details',
        'nav-password': 'password',
        'nav-remove': 'remove',
        'det-nav-home': 'home',
        'det-nav-password': 'password',
        'det-nav-remove': 'remove',
        'rem-nav-home': 'home',
        'rem-nav-details': 'details',
        'pass-nav-home': 'home',
        'pass-nav-details': 'details',
        'pass-nav-remove': 'remove',
        'rem-nav-password': 'password',
        'back-to-home': 'home'
    };

    Object.entries(navMapping).forEach(([id, view]) => {
        const el = document.getElementById(id);
        if (el) {
            el.onclick = (e) => {
                e.preventDefault();
                showView(view);
                if (view === 'details') renderDetails();
            };
        }
    });

    // Details Entry Logic
    const showRegBtn = document.getElementById('show-reg-form-btn');
    const regFormContainer = document.getElementById('details-reg-form-container');
    if (showRegBtn) {
        showRegBtn.onclick = () => {
            const isH = regFormContainer.style.display === 'none' || regFormContainer.style.display === '';
            regFormContainer.style.display = isH ? 'block' : 'none';
            showRegBtn.innerHTML = isH ? '<i data-lucide="x-circle" style="margin-right:8px;"></i>Close Form' : '<i data-lucide="plus-circle" style="margin-right:8px;"></i>Register Details';
            window.lucide.createIcons();
        };
    }

    document.getElementById('record-details-form').onsubmit = (e) => {
        e.preventDefault();
        const users = getUsers();
        const userIdx = users.findIndex(u => u.username === currentUser.username);
        if (!users[userIdx].details) users[userIdx].details = [];
        users[userIdx].details.push({
            username: document.getElementById('det-username').value,
            pass: document.getElementById('det-password').value,
            purpose: document.getElementById('det-purpose').value
        });
        saveUsers(users);
        showToast('Saved successfully!', 'success');
        document.getElementById('record-details-form').reset();
        regFormContainer.style.display = 'none';
        showRegBtn.innerHTML = '<i data-lucide="plus-circle" style="margin-right:8px;"></i>Register Details';
        window.lucide.createIcons();
        renderDetails();
    };

    // Account Removal Logic
    document.getElementById('remove-account-form').onsubmit = (e) => {
        e.preventDefault();
        const u = document.getElementById('rem-username').value;
        const p = document.getElementById('rem-password').value;

        if (u === currentUser.username && p === currentUser.password) {
            const confirmed = confirm("WARNING: Your account will be deleted permanently. This action cannot be undone. Are you sure?");
            if (confirmed) {
                const users = getUsers().filter(usr => usr.username !== u);
                saveUsers(users);
                handleLogout();
                showToast('Account removed permanently.', 'success');
            }
        } else {
            showToast('Username or Password incorrect.', 'error');
        }
    };

    // Other Forms
    document.getElementById('login-form').onsubmit = (e) => {
        e.preventDefault();
        handleLogin(document.getElementById('login-username').value, document.getElementById('login-password').value);
    };

    document.getElementById('register-form').onsubmit = (e) => {
        e.preventDefault();
        const dob = document.getElementById('reg-dob').value;
        if (!dob) return showToast('Select Date of Birth', 'error');
        const [y, m, d] = dob.split('-');
        handleRegister(document.getElementById('reg-username').value, `${d}-${m}-${y}`);
    };

    document.getElementById('change-password-form').onsubmit = (e) => {
        e.preventDefault();
        const curr = document.getElementById('current-p').value;
        const next = document.getElementById('new-p').value;
        if (currentUser.password === curr) {
            const users = getUsers();
            const idx = users.findIndex(u => u.username === currentUser.username);
            users[idx].password = next;
            currentUser.password = next;
            saveUsers(users);
            sessionStorage.setItem('luxe_session', JSON.stringify(currentUser));
            showToast('Security updated!', 'success');
        } else {
            showToast('Current password incorrect', 'error');
        }
    };

    // Calendar Controls
    document.getElementById('prev-month').onclick = () => {
        currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } renderCalendar();
    };
    document.getElementById('next-month').onclick = () => {
        currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } renderCalendar();
    };

    const toggleBtn = document.getElementById('toggle-password');
    const pInput = document.getElementById('login-password');
    if (toggleBtn && pInput) {
        toggleBtn.onclick = () => {
            const isP = pInput.type === 'password';
            pInput.type = isP ? 'text' : 'password';
            const icon = toggleBtn.querySelector('i');
            if (icon) { icon.setAttribute('data-lucide', isP ? 'eye-off' : 'eye'); window.lucide.createIcons(); }
        };
    }
}

function showToast(message, type) {
    const toast = document.getElementById('notification-toast');
    toast.textContent = message;
    toast.style.borderLeftColor = type === 'success' ? 'var(--accent)' : '#ef4444';
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}
