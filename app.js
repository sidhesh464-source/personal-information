let currentUser = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

const STORAGE_KEY = 'personal_db_v3';
const CACHE_NAME = 'personal-details-v19';

const views = {
    login: document.getElementById('login-view'),
    register: document.getElementById('register-view'),
    home: document.getElementById('home-view'),
    details: document.getElementById('details-view'),
    remove: document.getElementById('remove-view'),
    password: document.getElementById('password-view')
};

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

function initAuth() {
    const session = sessionStorage.getItem('personal_session');
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
        sessionStorage.setItem('personal_session', JSON.stringify(user));
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
    sessionStorage.removeItem('personal_session');
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

    const users = getUsers();
    const user = currentUser ? users.find(u => u.username === currentUser.username) : null;
    const details = user ? (user.details || []) : [];

    for (let i = 1; i <= daysInMonth; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-date';

        const matchedDetails = details.filter(d => {
            if (!d.date) return false;
            const detDate = new Date(d.date);
            return detDate.getFullYear() === currentYear && detDate.getMonth() === currentMonth && detDate.getDate() === i;
        });

        if (isCurrentMonth && i === today.getDate()) div.classList.add('current');

        div.innerHTML = `<span>${i}</span>`;
        if (matchedDetails.length > 0) {
            const markers = document.createElement('div');
            markers.style.display = 'flex';
            markers.style.flexWrap = 'wrap';
            markers.style.justifyContent = 'center';
            markers.style.gap = '3px';
            markers.style.marginTop = '4px';
            markers.style.maxWidth = '80%';
            matchedDetails.forEach(md => {
                const dot = document.createElement('div');
                dot.style.width = '6px';
                dot.style.height = '6px';
                dot.style.borderRadius = '50%';
                dot.style.background = 'var(--primary)';
                dot.style.boxShadow = '0 0 5px var(--primary)';
                dot.title = md.purpose;
                markers.appendChild(dot);
            });
            div.appendChild(markers);
            div.style.flexDirection = 'column';
        }

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
        listBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem; color: var(--text-muted);">No entries yet. Click "Register Details" to add one.</td></tr>';
        return;
    }

    details.forEach((det, originalIndex) => {
        const dateStr = det.date ? new Date(det.date).toLocaleDateString() : 'N/A';
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--glass-border)';
        tr.innerHTML = `
            <td style="padding: 1rem; font-weight: 700; color: var(--secondary);">
                ${det.purpose}<br><small style="color:var(--text-muted);font-weight:normal;">${dateStr}</small>
            </td>
            <td style="padding: 1rem;">${det.username}</td>
            <td style="padding: 1rem; font-family: monospace; color: var(--primary);">${det.pass}</td>
            <td style="padding: 1rem; text-align: right; white-space: nowrap;">
                <button onclick="editDetail(${originalIndex})" style="background: transparent; border: none; color: #10b981; cursor: pointer; padding: 5px; margin-right: 5px;" title="Replace/Edit">
                    <i data-lucide="edit" style="width: 18px; height: 18px;"></i>
                </button>
                <button onclick="deleteDetail(${originalIndex})" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 5px;" title="Remove">
                    <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                </button>
            </td>
        `;
        listBody.insertBefore(tr, listBody.firstChild);
    });

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function renderPersonalData() {
    const container = document.getElementById('personal-data-list');
    if (!container) return;

    const users = getUsers();
    const user = users.find(u => u.username === currentUser.username);
    const personalData = (user && user.personalData) ? user.personalData : [];

    if (personalData.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 1rem;">No files saved yet. Use "Save Data" to upload.</p>';
        return;
    }

    container.innerHTML = '';
    personalData.forEach((item, idx) => {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 0.8rem 1rem; background: var(--glass); border-radius: 12px; border: 1px solid var(--glass-border); cursor: pointer;';
        row.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.8rem;">
                <i data-lucide="file" style="width:20px; color: #10b981;"></i>
                <div>
                    <div style="font-weight: 700; color: #fff;">${item.name}</div>
                    <small style="color: var(--text-muted);">${item.fileType} &bull; ${new Date(item.date).toLocaleDateString()}</small>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="viewPersonalData(${idx})" style="background: rgba(16,185,129,0.15); border: none; color: #10b981; cursor: pointer; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 0.78rem;">View</button>
                <button onclick="deletePersonalData(${idx})" style="background: rgba(239,68,68,0.15); border: none; color: #ef4444; cursor: pointer; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 0.78rem;">Delete</button>
            </div>
        `;
        container.appendChild(row);
    });
    if (window.lucide) window.lucide.createIcons();
}

window.viewPersonalData = function (idx) {
    const users = getUsers();
    const user = users.find(u => u.username === currentUser.username);
    const item = user.personalData[idx];
    if (!item) return;
    const win = window.open();
    win.document.write(`<html><head><title>${item.name}</title></head><body style='margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;'>`);
    if (item.fileType.startsWith('image/')) {
        win.document.write(`<img src='${item.data}' style='max-width:100%; max-height:100vh;'>`);
    } else if (item.fileType === 'application/pdf') {
        win.document.write(`<iframe src='${item.data}' style='width:100vw;height:100vh;border:none;'></iframe>`);
    } else {
        win.document.write(`<a href='${item.data}' download='${item.name}' style='color:white; font-size:1.2rem; font-family:sans-serif;'>Click to download: ${item.name}</a>`);
    }
    win.document.write('</body></html>');
}

window.deletePersonalData = function (idx) {
    if (!confirm('Delete this file?')) return;
    const users = getUsers();
    const userIdx = users.findIndex(u => u.username === currentUser.username);
    users[userIdx].personalData.splice(idx, 1);
    saveUsers(users);
    showToast('File deleted.', 'success');
    renderPersonalData();
}

window.deleteDetail = function (index) {
    if (!confirm('Are you sure you want to remove this detail?')) return;

    const users = getUsers();
    const userIdx = users.findIndex(u => u.username === currentUser.username);
    if (userIdx > -1) {
        users[userIdx].details.splice(index, 1);
        saveUsers(users);
        showToast('Detail removed successfully.', 'success');
        renderDetails();
    }
}

window.editDetail = function (index) {
    const users = getUsers();
    const user = users.find(u => u.username === currentUser.username);
    const det = user.details[index];
    if (!det) return;

    document.getElementById('det-username').value = det.username;
    document.getElementById('det-password').value = det.pass;
    document.getElementById('det-purpose').value = det.purpose;

    const form = document.getElementById('record-details-form');
    form.dataset.editIndex = index;

    const regFormContainer = document.getElementById('details-reg-form-container');
    regFormContainer.style.display = 'block';

    const showRegBtn = document.getElementById('show-reg-form-btn');
    if (showRegBtn) showRegBtn.innerHTML = '<i data-lucide="x-circle" style="margin-right:8px;"></i>Close Form';
    form.querySelector('button[type="submit"]').textContent = 'Replace Entry';
    window.lucide.createIcons();
}

function setupEventListeners() {
    document.getElementById('go-to-register').onclick = (e) => { e.preventDefault(); showView('register'); };
    document.getElementById('go-to-login').onclick = (e) => { e.preventDefault(); showView('login'); };

    document.querySelectorAll('.logout-btn').forEach(btn => btn.onclick = handleLogout);

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
                if (view === 'details') { renderDetails(); renderPersonalData(); }
            };
        }
    });

    const showRegBtn = document.getElementById('show-reg-form-btn');
    const regFormContainer = document.getElementById('details-reg-form-container');
    if (showRegBtn) {
        showRegBtn.onclick = () => {
            document.getElementById('save-data-form-container').style.display = 'none';
            const isH = regFormContainer.style.display === 'none' || regFormContainer.style.display === '';
            regFormContainer.style.display = isH ? 'block' : 'none';
            showRegBtn.innerHTML = isH ? '<i data-lucide="x-circle" style="margin-right:8px;"></i>Close Form' : '<i data-lucide="plus-circle" style="margin-right:8px;"></i>Register Details';
            window.lucide.createIcons();
        };
    }

    const showSaveDataBtn = document.getElementById('show-save-data-btn');
    const saveDataFormContainer = document.getElementById('save-data-form-container');
    if (showSaveDataBtn) {
        showSaveDataBtn.onclick = () => {
            document.getElementById('details-reg-form-container').style.display = 'none';
            document.getElementById('show-reg-form-btn').innerHTML = '<i data-lucide="plus-circle" style="margin-right:8px;"></i>Register Details';
            const isH = saveDataFormContainer.style.display === 'none' || saveDataFormContainer.style.display === '';
            saveDataFormContainer.style.display = isH ? 'block' : 'none';
            showSaveDataBtn.innerHTML = isH ? '<i data-lucide="x" style="margin-right:8px;"></i>Close' : '<i data-lucide="upload" style="margin-right:8px;"></i>Save Data';
            window.lucide.createIcons();
        };
    }

    document.getElementById('save-data-form').onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('save-data-name').value;
        const fileInput = document.getElementById('save-data-file');
        const file = fileInput.files[0];
        if (!file) return showToast('Please select a file.', 'error');
        const reader = new FileReader();
        reader.onload = function (ev) {
            const users = getUsers();
            const userIdx = users.findIndex(u => u.username === currentUser.username);
            if (!users[userIdx].personalData) users[userIdx].personalData = [];
            users[userIdx].personalData.push({
                name,
                fileType: file.type,
                data: ev.target.result,
                date: new Date().toISOString()
            });
            saveUsers(users);
            showToast('File saved!', 'success');
            document.getElementById('save-data-form').reset();
            saveDataFormContainer.style.display = 'none';
            showSaveDataBtn.innerHTML = '<i data-lucide="upload" style="margin-right:8px;"></i>Save Data';
            window.lucide.createIcons();
            renderPersonalData();
        };
        reader.readAsDataURL(file);
    };

    document.getElementById('record-details-form').onsubmit = (e) => {
        e.preventDefault();
        const users = getUsers();
        const userIdx = users.findIndex(u => u.username === currentUser.username);
        if (!users[userIdx].details) users[userIdx].details = [];
        const newDet = {
            username: document.getElementById('det-username').value,
            pass: document.getElementById('det-password').value,
            purpose: document.getElementById('det-purpose').value,
            date: new Date().toISOString()
        };

        const form = document.getElementById('record-details-form');
        if (form.dataset.editIndex !== undefined) {
            if (users[userIdx].details[form.dataset.editIndex].date) {
                newDet.date = users[userIdx].details[form.dataset.editIndex].date;
            }
            users[userIdx].details[form.dataset.editIndex] = newDet;
            showToast('Replaced successfully!', 'success');
            delete form.dataset.editIndex;
            form.querySelector('button[type="submit"]').textContent = 'Save Password Details';
        } else {
            users[userIdx].details.push(newDet);
            showToast('Saved successfully!', 'success');
        }

        saveUsers(users);
        form.reset();
        regFormContainer.style.display = 'none';
        showRegBtn.innerHTML = '<i data-lucide="plus-circle" style="margin-right:8px;"></i>Register Details';
        window.lucide.createIcons();
        renderDetails();
    };

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

    document.getElementById('login-form').onsubmit = (e) => {
        e.preventDefault();
        const p = document.getElementById('login-password').value;
        if (p.includes('-')) return showToast('Password cannot contain hyphens (-)', 'error');
        handleLogin(document.getElementById('login-username').value, p);
    };

    document.getElementById('register-form').onsubmit = (e) => {
        e.preventDefault();
        const p = document.getElementById('reg-password').value;
        if (!p) return showToast('Enter a password', 'error');
        if (p.includes('-')) return showToast('Password cannot contain hyphens (-)', 'error');
        handleRegister(document.getElementById('reg-username').value, p);
    };

    document.getElementById('change-password-form').onsubmit = (e) => {
        e.preventDefault();
        const curr = document.getElementById('current-p').value;
        const next = document.getElementById('new-p').value;
        if (next.includes('-')) return showToast('Password cannot contain hyphens (-)', 'error');
        if (currentUser.password === curr) {
            const users = getUsers();
            const idx = users.findIndex(u => u.username === currentUser.username);
            users[idx].password = next;
            currentUser.password = next;
            saveUsers(users);
            sessionStorage.setItem('personal_session', JSON.stringify(currentUser));
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
