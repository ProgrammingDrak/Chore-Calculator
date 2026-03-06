// ===================================================================
// Bounty Tracker - Main Application Script
// ===================================================================

// ===== Utilities =====

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return hour + ':' + String(m).padStart(2, '0') + ' ' + ampm;
}

function isToday(dateStr) {
    const today = new Date();
    const d = new Date(dateStr + 'T00:00:00');
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
}

function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function parseTimeToMinutes(timeStr) {
    const map = { '15 min': 15, '30 min': 30, '45 min': 45, '1 hr': 60, '2 hr': 120, '3+ hr': 180 };
    return map[timeStr] || 30;
}

function calculatePoints(card) {
    const timeMin = parseTimeToMinutes(card.estimatedTime);
    const priorityMod = { Low: 1, Medium: 1.5, High: 2 }[card.priority] || 1;
    const difficultyMod = { Easy: 1, Medium: 1.5, Hard: 2 }[card.difficulty] || 1;
    return Math.round(timeMin * priorityMod * difficultyMod);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function seededShuffle(arr, seed) {
    let t = seed + 0x6D2B79F5;
    function next() {
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

// ===== Data Layer =====

function getCards() {
    return JSON.parse(localStorage.getItem('cards')) || [];
}

function saveCards(cards) {
    localStorage.setItem('cards', JSON.stringify(cards));
}

function getCardById(id) {
    return getCards().find(c => c.id === id) || null;
}

function updateCard(id, updates) {
    const cards = getCards();
    const idx = cards.findIndex(c => c.id === id);
    if (idx === -1) return;
    Object.assign(cards[idx], updates);
    if ('estimatedTime' in updates || 'priority' in updates || 'difficulty' in updates) {
        cards[idx].points = calculatePoints(cards[idx]);
    }
    saveCards(cards);
}

function deleteCard(id) {
    const cards = getCards().filter(c => c.id !== id);
    saveCards(cards);
}

function createCard(overrides) {
    const card = {
        id: generateId(),
        title: '',
        status: 'To Do',
        priority: 'Medium',
        difficulty: 'Easy',
        estimatedTime: '30 min',
        tags: [],
        dueDate: '',
        scheduled: '',
        scheduledTime: '',
        assignee: '',
        description: '',
        points: 0,
        parentTaskId: null,
        createdAt: new Date().toISOString(),
        comments: [],
        ...overrides
    };
    card.points = calculatePoints(card);
    const cards = getCards();
    cards.push(card);
    saveCards(cards);
    return card;
}

function getSettings() {
    return JSON.parse(localStorage.getItem('appSettings')) || {
        people: ['Drake'],
        tags: ['chore', 'daily', 'weekly', 'outdoor'],
        kanbanGroupBy: 'status',
        visibleCardProperties: ['priority', 'dueDate']
    };
}

function saveSettings(settings) {
    localStorage.setItem('appSettings', JSON.stringify(settings));
}

function getFocusSettings() {
    return JSON.parse(localStorage.getItem('focusSettings')) || {
        focusDuration: 25,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
        freeSpinsPerReward: 1,
        pomodorosPerFreeSpin: 4,
        completedPomodoroCount: 0,
        freeSpinsAvailable: 0
    };
}

function saveFocusSettingsData(settings) {
    localStorage.setItem('focusSettings', JSON.stringify(settings));
}

function getFocusLog() {
    return JSON.parse(localStorage.getItem('focusLog')) || [];
}

function saveFocusLog(log) {
    localStorage.setItem('focusLog', JSON.stringify(log));
}

// ===== Navigation =====

function openTab(event, tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).style.display = 'block';
    event.currentTarget.classList.add('active');

    if (tabId === 'bounty-board') renderCurrentBoardView();
    if (tabId === 'focus') { updateFocusTaskDropdown(); renderFocusStats(); }
    if (tabId === 'reward-wheel') { renderWheelItems(); updateFreeSpinUI(); }
}

let currentBoardView = 'kanban';
let currentCalendarScale = 'month';
let currentCalendarSubView = 'planning';
let calendarViewDate = new Date();

function switchView(event, view) {
    document.querySelectorAll('.view-toggle').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
    currentBoardView = view;

    document.getElementById('kanban-view').style.display = view === 'kanban' ? 'block' : 'none';
    document.getElementById('calendar-view').style.display = view === 'calendar' ? 'block' : 'none';
    document.getElementById('kanban-controls').style.display = view === 'kanban' ? 'flex' : 'none';
    document.getElementById('calendar-scale').style.display = view === 'calendar' ? 'flex' : 'none';
    document.getElementById('calendar-sub-views').style.display = view === 'calendar' ? 'flex' : 'none';
    document.getElementById('calendar-nav').style.display = view === 'calendar' ? 'flex' : 'none';

    renderCurrentBoardView();
}

function setCalendarScale(event, scale) {
    document.querySelectorAll('.scale-btn').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
    currentCalendarScale = scale;
    renderCalendar();
}

function setCalendarSubView(event, subView) {
    document.querySelectorAll('.sub-view-btn').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
    currentCalendarSubView = subView;

    // Show/hide sidebar (only in planning mode)
    const sidebar = document.getElementById('calendar-sidebar');
    sidebar.style.display = (subView === 'planning' || subView === 'sidebyside') ? 'block' : 'none';

    renderCalendar();
}

function navigateCalendar(direction) {
    if (currentCalendarScale === 'month') {
        calendarViewDate.setMonth(calendarViewDate.getMonth() + direction);
    } else if (currentCalendarScale === 'week') {
        calendarViewDate.setDate(calendarViewDate.getDate() + 7 * direction);
    } else if (currentCalendarScale === '3day') {
        calendarViewDate.setDate(calendarViewDate.getDate() + 3 * direction);
    } else {
        calendarViewDate.setDate(calendarViewDate.getDate() + direction);
    }
    renderCalendar();
}

function navigateCalendarToday() {
    calendarViewDate = new Date();
    renderCalendar();
}

function renderCurrentBoardView() {
    if (currentBoardView === 'kanban') renderKanban();
    else renderCalendar();
}

// ===== Kanban Board =====

const STATUS_ORDER = ['Backlog', 'To Do', 'In Progress', 'Done', 'Archived'];
const PRIORITY_ORDER = ['High', 'Medium', 'Low'];

function renderKanban() {
    const container = document.getElementById('kanban-columns');
    const cards = getCards();
    const groupBy = document.getElementById('kanban-group-by').value;
    const filterVal = document.getElementById('kanban-filter').value;

    let filteredCards = cards;
    if (filterVal && filterVal !== 'all') {
        filteredCards = cards.filter(c => c.tags.includes(filterVal) || c.assignee === filterVal || c.priority === filterVal);
    }

    let groups;
    if (groupBy === 'status') {
        groups = STATUS_ORDER.map(s => ({ label: s, value: s, cards: filteredCards.filter(c => c.status === s) }));
    } else if (groupBy === 'priority') {
        groups = PRIORITY_ORDER.map(p => ({ label: p, value: p, cards: filteredCards.filter(c => c.priority === p) }));
    } else if (groupBy === 'assignee') {
        const settings = getSettings();
        groups = settings.people.map(p => ({ label: p, value: p, cards: filteredCards.filter(c => c.assignee === p) }));
        const unassigned = filteredCards.filter(c => !c.assignee);
        if (unassigned.length) groups.push({ label: 'Unassigned', value: '', cards: unassigned });
    }

    container.innerHTML = '';
    groups.forEach(group => {
        const col = document.createElement('div');
        col.className = 'kanban-column';
        col.innerHTML =
            '<div class="kanban-column-header">' +
                '<span>' + escapeHtml(group.label) + '</span>' +
                '<span class="kanban-column-count">' + group.cards.length + '</span>' +
            '</div>' +
            '<div class="kanban-column-cards" data-group-value="' + escapeHtml(group.value) + '" data-group-by="' + groupBy + '">' +
            '</div>' +
            '<div class="kanban-add-card">' +
                '<button onclick="quickAddCard(\'' + escapeHtml(group.value) + '\', \'' + groupBy + '\')">+ Add Card</button>' +
            '</div>';

        const cardsContainer = col.querySelector('.kanban-column-cards');
        group.cards.forEach(card => {
            cardsContainer.appendChild(createKanbanCardEl(card));
        });

        // Drag-drop on column
        cardsContainer.addEventListener('dragover', e => {
            e.preventDefault();
            cardsContainer.classList.add('drag-over');
        });
        cardsContainer.addEventListener('dragleave', () => {
            cardsContainer.classList.remove('drag-over');
        });
        cardsContainer.addEventListener('drop', e => {
            e.preventDefault();
            cardsContainer.classList.remove('drag-over');
            const cardId = e.dataTransfer.getData('text/plain');
            const groupByProp = cardsContainer.dataset.groupBy;
            const groupValue = cardsContainer.dataset.groupValue;
            if (cardId && groupByProp) {
                updateCard(cardId, { [groupByProp]: groupValue });
                renderKanban();
            }
        });

        container.appendChild(col);
    });

    updateFilterDropdown();
}

function createKanbanCardEl(card) {
    const el = document.createElement('div');
    el.className = 'kanban-card';
    el.draggable = true;
    el.dataset.cardId = card.id;

    // Priority border color
    const borderColors = { High: '#dc3545', Medium: '#ffc107', Low: '#28a745' };
    el.style.borderLeftColor = borderColors[card.priority] || '#d1d1d6';

    let propsHtml = '';
    propsHtml += '<span class="card-badge badge-priority-' + card.priority + '">' + card.priority + '</span>';
    if (card.dueDate) propsHtml += '<span class="card-badge badge-due">' + formatDate(card.dueDate) + '</span>';
    if (card.parentTaskId) propsHtml += '<span class="card-badge badge-subtask">&#8627; sub</span>';
    propsHtml += '<span class="card-badge badge-points">' + card.points + ' pts</span>';

    el.innerHTML =
        '<div class="kanban-card-title">' + escapeHtml(card.title || 'Untitled') + '</div>' +
        '<div class="kanban-card-props">' + propsHtml + '</div>';

    el.addEventListener('click', () => openCardModal(card.id));
    el.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', card.id);
        el.classList.add('dragging');
        // Also store for calendar drag
        e.dataTransfer.setData('application/card-id', card.id);
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));

    return el;
}

function quickAddCard(groupValue, groupBy) {
    const props = {};
    props[groupBy] = groupValue;
    const card = createCard({ title: 'New Task', ...props });
    renderKanban();
    openCardModal(card.id);
}

function updateFilterDropdown() {
    const select = document.getElementById('kanban-filter');
    const current = select.value;
    select.innerHTML = '<option value="all">Filter: All</option>';

    const settings = getSettings();
    settings.tags.forEach(tag => {
        select.innerHTML += '<option value="' + escapeHtml(tag) + '">Tag: ' + escapeHtml(tag) + '</option>';
    });
    PRIORITY_ORDER.forEach(p => {
        select.innerHTML += '<option value="' + p + '">' + p + ' Priority</option>';
    });

    select.value = current || 'all';
}

// ===== Card Modal =====

let currentModalCardId = null;

function openCardModal(cardId) {
    currentModalCardId = cardId;
    const card = getCardById(cardId);
    if (!card) return;

    document.getElementById('card-modal-title').value = card.title;
    document.getElementById('card-prop-status').value = card.status;
    document.getElementById('card-prop-priority').value = card.priority;
    document.getElementById('card-prop-difficulty').value = card.difficulty;
    document.getElementById('card-prop-estimatedTime').value = card.estimatedTime;
    document.getElementById('card-prop-dueDate').value = card.dueDate || '';
    document.getElementById('card-prop-scheduled').value = card.scheduled || '';
    document.getElementById('card-prop-scheduledTime').value = card.scheduledTime || '';
    document.getElementById('card-prop-points').textContent = card.points;
    document.getElementById('card-modal-description').value = card.description || '';

    // Tags
    renderCardTags(card);

    // Parent link
    const parentLink = document.getElementById('card-parent-link');
    if (card.parentTaskId) {
        const parent = getCardById(card.parentTaskId);
        parentLink.style.display = 'block';
        document.getElementById('card-parent-name').textContent = parent ? parent.title : '(deleted)';
    } else {
        parentLink.style.display = 'none';
    }

    // Sub-tasks
    const cards = getCards();
    const subtasks = cards.filter(c => c.parentTaskId === card.id);
    const subtasksDiv = document.getElementById('card-subtasks');
    const subtaskList = document.getElementById('card-subtask-list');
    if (subtasks.length > 0) {
        subtasksDiv.style.display = 'block';
        subtaskList.innerHTML = '';
        subtasks.forEach(st => {
            const li = document.createElement('li');
            li.className = 'card-subtask-item';
            li.textContent = '↳ ' + st.title + ' (' + st.status + ')';
            li.onclick = () => openCardModal(st.id);
            subtaskList.appendChild(li);
        });
    } else {
        subtasksDiv.style.display = 'none';
    }

    // Comments
    renderCardComments(card);

    document.getElementById('card-modal').style.display = 'block';
}

function closeCardModal() {
    document.getElementById('card-modal').style.display = 'none';
    currentModalCardId = null;
    renderCurrentBoardView();
}

function updateCardTitle() {
    if (!currentModalCardId) return;
    updateCard(currentModalCardId, { title: document.getElementById('card-modal-title').value });
}

function updateCardProp(prop, value) {
    if (!currentModalCardId) return;
    updateCard(currentModalCardId, { [prop]: value });
    // Refresh points display
    const card = getCardById(currentModalCardId);
    if (card) document.getElementById('card-prop-points').textContent = card.points;
}

function updateCardDescription() {
    if (!currentModalCardId) return;
    updateCard(currentModalCardId, { description: document.getElementById('card-modal-description').value });
}

function renderCardTags(card) {
    const container = document.getElementById('card-prop-tags');
    container.innerHTML = '';
    (card.tags || []).forEach(tag => {
        const span = document.createElement('span');
        span.className = 'card-tag';
        span.innerHTML = escapeHtml(tag) + ' <span class="tag-remove" onclick="removeCardTag(\'' + escapeHtml(tag) + '\')">&times;</span>';
        container.appendChild(span);
    });
    const addBtn = document.createElement('button');
    addBtn.className = 'card-tag-add';
    addBtn.textContent = '+ tag';
    addBtn.onclick = () => {
        const settings = getSettings();
        const existing = card.tags || [];
        const available = settings.tags.filter(t => !existing.includes(t));
        if (available.length === 0) return;
        const tag = available[0]; // Add first available
        const tags = [...existing, tag];
        updateCard(card.id, { tags });
        const updated = getCardById(card.id);
        renderCardTags(updated);
    };
    container.appendChild(addBtn);
}

function removeCardTag(tag) {
    if (!currentModalCardId) return;
    const card = getCardById(currentModalCardId);
    const tags = (card.tags || []).filter(t => t !== tag);
    updateCard(currentModalCardId, { tags });
    renderCardTags(getCardById(currentModalCardId));
}

function renderCardComments(card) {
    const list = document.getElementById('card-comment-list');
    list.innerHTML = '';
    (card.comments || []).forEach(c => {
        const li = document.createElement('li');
        li.className = 'comment-item';
        li.innerHTML =
            '<div class="comment-text">' + escapeHtml(c.text) + '</div>' +
            '<div class="comment-meta">' + (c.author || '') + ' - ' + new Date(c.date).toLocaleString() + '</div>';
        list.appendChild(li);
    });
}

function addComment() {
    if (!currentModalCardId) return;
    const input = document.getElementById('card-new-comment');
    const text = input.value.trim();
    if (!text) return;

    const card = getCardById(currentModalCardId);
    const comments = [...(card.comments || []), {
        text: text,
        date: new Date().toISOString(),
        author: getSettings().people[0] || 'User'
    }];
    updateCard(currentModalCardId, { comments });
    input.value = '';
    renderCardComments(getCardById(currentModalCardId));
}

function openParentCard(event) {
    event.preventDefault();
    if (!currentModalCardId) return;
    const card = getCardById(currentModalCardId);
    if (card && card.parentTaskId) openCardModal(card.parentTaskId);
}

function deleteCurrentCard() {
    if (!currentModalCardId) return;
    if (!confirm('Delete this card?')) return;
    deleteCard(currentModalCardId);
    closeCardModal();
}

// ===== Calendar =====

function renderCalendar() {
    updateCalendarDateLabel();
    renderUnscheduledSidebar();

    if (currentCalendarSubView === 'sidebyside') {
        renderSideBySideCalendar();
    } else if (currentCalendarScale === 'month') {
        renderMonthCalendar(currentCalendarSubView);
    } else {
        renderHourlyCalendar(currentCalendarSubView);
    }
}

function updateCalendarDateLabel() {
    const label = document.getElementById('calendar-date-label');
    const d = calendarViewDate;
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    if (currentCalendarScale === 'month') {
        label.textContent = months[d.getMonth()] + ' ' + d.getFullYear();
    } else if (currentCalendarScale === 'week') {
        const start = new Date(d);
        start.setDate(start.getDate() - start.getDay());
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        label.textContent = formatDate(dateToStr(start)) + ' - ' + formatDate(dateToStr(end));
    } else if (currentCalendarScale === '3day') {
        const end = new Date(d);
        end.setDate(end.getDate() + 2);
        label.textContent = formatDate(dateToStr(d)) + ' - ' + formatDate(dateToStr(end));
    } else {
        label.textContent = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
}

function dateToStr(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function renderUnscheduledSidebar() {
    const container = document.getElementById('unscheduled-cards');
    const cards = getCards().filter(c => !c.scheduled && c.status !== 'Done' && c.status !== 'Archived');
    container.innerHTML = '';

    cards.forEach(card => {
        const el = document.createElement('div');
        el.className = 'unscheduled-card';
        el.textContent = card.title || 'Untitled';
        el.draggable = true;
        el.addEventListener('dragstart', e => {
            e.dataTransfer.setData('application/card-id', card.id);
            e.dataTransfer.effectAllowed = 'move';
        });
        el.addEventListener('click', () => openCardModal(card.id));
        container.appendChild(el);
    });
}

// Month Calendar
function renderMonthCalendar(subView) {
    const container = document.getElementById('calendar-grid-container');
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay(); // 0=Sun

    const cards = getCards();
    const focusLog = getFocusLog();
    const today = todayStr();

    let html = '<div class="month-grid">';
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
        html += '<div class="month-grid-header">' + d + '</div>';
    });

    // Fill days
    const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
    for (let i = 0; i < totalCells; i++) {
        const dayNum = i - startOffset + 1;
        const isCurrentMonth = dayNum >= 1 && dayNum <= lastDay.getDate();
        const date = new Date(year, month, dayNum);
        const dateStr = dateToStr(date);
        const isTodayCell = dateStr === today;

        let classes = 'month-grid-day';
        if (!isCurrentMonth) classes += ' other-month';
        if (isTodayCell) classes += ' today';

        // Focus heat
        if (subView === 'actual') {
            const dayLog = focusLog.filter(l => l.date === dateStr);
            const totalMin = dayLog.reduce((s, l) => s + l.duration, 0);
            if (totalMin > 120) classes += ' heat-heavy';
            else if (totalMin > 60) classes += ' heat-medium';
            else if (totalMin > 0) classes += ' heat-light';
        }

        html += '<div class="' + classes + '" data-date="' + dateStr + '">';
        html += '<div class="month-day-number">' + (isCurrentMonth ? dayNum : '') + '</div>';

        if (isCurrentMonth) {
            if (subView === 'planning' || subView === 'sidebyside') {
                const dayCards = cards.filter(c => c.scheduled === dateStr);
                dayCards.slice(0, 3).forEach(c => {
                    html += '<div class="month-day-card priority-' + c.priority + '" onclick="openCardModal(\'' + c.id + '\')">' +
                        escapeHtml(c.title || 'Untitled') + '</div>';
                });
                if (dayCards.length > 3) html += '<div class="month-day-card" style="color:#8e8e93">+' + (dayCards.length - 3) + ' more</div>';
            }

            if (subView === 'actual') {
                const dayLog = focusLog.filter(l => l.date === dateStr);
                const totalMin = dayLog.reduce((s, l) => s + l.duration, 0);
                if (totalMin > 0) {
                    const hrs = Math.floor(totalMin / 60);
                    const mins = totalMin % 60;
                    html += '<div class="month-day-focus">' + (hrs > 0 ? hrs + 'h ' : '') + mins + 'm</div>';
                    const taskSet = new Set(dayLog.map(l => l.taskName));
                    taskSet.forEach(name => {
                        html += '<div class="month-day-card priority-Medium" style="font-size:9px">' + escapeHtml(name) + '</div>';
                    });
                }
            }
        }

        html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;

    // Drop events on month days
    container.querySelectorAll('.month-grid-day').forEach(dayEl => {
        dayEl.addEventListener('dragover', e => { e.preventDefault(); dayEl.classList.add('drag-over'); });
        dayEl.addEventListener('dragleave', () => dayEl.classList.remove('drag-over'));
        dayEl.addEventListener('drop', e => {
            e.preventDefault();
            dayEl.classList.remove('drag-over');
            const cardId = e.dataTransfer.getData('application/card-id');
            const date = dayEl.dataset.date;
            if (cardId && date) {
                updateCard(cardId, { scheduled: date });
                renderCalendar();
            }
        });
    });
}

// Hourly Calendar (Day/3-Day/Week)
function renderHourlyCalendar(subView) {
    const container = document.getElementById('calendar-grid-container');
    const days = getCalendarDays();
    const cards = getCards();
    const focusLog = getFocusLog();
    const today = todayStr();

    const startHour = 6;
    const endHour = 22;
    const numCols = days.length;

    let html = '<div class="hourly-grid" style="grid-template-columns: 50px repeat(' + numCols + ', 1fr);">';

    // Header row
    html += '<div class="hourly-header-cell"></div>'; // time column header
    days.forEach(day => {
        const isT = day === today;
        const d = new Date(day + 'T00:00:00');
        const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        html += '<div class="hourly-header-cell' + (isT ? ' today-header' : '') + '">' + label + '</div>';
    });

    // All-day row
    html += '<div class="hourly-time-label"><span>All Day</span></div>';
    days.forEach(day => {
        const dayCards = cards.filter(c => c.scheduled === day && !c.scheduledTime);
        html += '<div class="allday-row" data-date="' + day + '">';
        dayCards.forEach(c => {
            html += '<div class="allday-card" onclick="openCardModal(\'' + c.id + '\')">' + escapeHtml(c.title || 'Untitled') + '</div>';
        });
        html += '</div>';
    });

    // Hour rows
    for (let hour = startHour; hour <= endHour; hour++) {
        const timeLabel = (hour % 12 || 12) + (hour < 12 ? ' AM' : ' PM');
        html += '<div class="hourly-time-label"><span>' + timeLabel + '</span></div>';
        days.forEach(day => {
            const hourStr = String(hour).padStart(2, '0') + ':00';
            html += '<div class="hourly-cell full-hour" data-date="' + day + '" data-hour="' + hour + '"></div>';
        });
    }

    html += '</div>';
    container.innerHTML = html;

    // Place events on grid
    const grid = container.querySelector('.hourly-grid');
    const headerRows = 2; // header + all-day
    const cellHeight = 48;

    if (subView === 'planning' || subView === 'sidebyside') {
        days.forEach((day, dayIdx) => {
            const dayCards = cards.filter(c => c.scheduled === day && c.scheduledTime);
            dayCards.forEach(card => {
                const [h, m] = card.scheduledTime.split(':').map(Number);
                if (h < startHour || h > endHour) return;
                const topOffset = (h - startHour) * cellHeight + (m / 60) * cellHeight;
                const duration = parseTimeToMinutes(card.estimatedTime);
                const height = Math.max(20, (duration / 60) * cellHeight);

                const eventEl = document.createElement('div');
                eventEl.className = 'hourly-event planning-event priority-' + card.priority;
                eventEl.style.top = (headerRows * cellHeight + topOffset) + 'px';
                eventEl.style.height = height + 'px';
                eventEl.style.gridColumn = (dayIdx + 2).toString();
                eventEl.textContent = (card.title || 'Untitled') + ' (' + card.estimatedTime + ')';
                eventEl.onclick = () => openCardModal(card.id);

                // Resize handle
                const resizeHandle = document.createElement('div');
                resizeHandle.className = 'hourly-event-resize';
                eventEl.appendChild(resizeHandle);

                grid.appendChild(eventEl);
            });
        });
    }

    if (subView === 'actual') {
        days.forEach((day, dayIdx) => {
            const dayLog = focusLog.filter(l => l.date === day);
            dayLog.forEach(entry => {
                if (!entry.startTime) return;
                const [h, m] = entry.startTime.split(':').map(Number);
                if (h < startHour || h > endHour) return;
                const topOffset = (h - startHour) * cellHeight + (m / 60) * cellHeight;
                const height = Math.max(20, (entry.duration / 60) * cellHeight);

                const eventEl = document.createElement('div');
                eventEl.className = 'hourly-event actual-event';
                eventEl.style.top = (headerRows * cellHeight + topOffset) + 'px';
                eventEl.style.height = height + 'px';
                eventEl.style.gridColumn = (dayIdx + 2).toString();
                eventEl.textContent = entry.taskName + ' (' + entry.duration + 'm)';

                grid.appendChild(eventEl);
            });
        });
    }

    // Drop events on hourly cells
    container.querySelectorAll('.hourly-cell').forEach(cell => {
        cell.addEventListener('dragover', e => { e.preventDefault(); cell.classList.add('drag-over'); });
        cell.addEventListener('dragleave', () => cell.classList.remove('drag-over'));
        cell.addEventListener('drop', e => {
            e.preventDefault();
            cell.classList.remove('drag-over');
            const cardId = e.dataTransfer.getData('application/card-id');
            if (cardId) {
                const date = cell.dataset.date;
                const hour = cell.dataset.hour;
                updateCard(cardId, {
                    scheduled: date,
                    scheduledTime: String(hour).padStart(2, '0') + ':00'
                });
                renderCalendar();
            }
        });
        // Click to create
        cell.addEventListener('dblclick', () => {
            const date = cell.dataset.date;
            const hour = cell.dataset.hour;
            const card = createCard({
                title: 'New Task',
                scheduled: date,
                scheduledTime: String(hour).padStart(2, '0') + ':00'
            });
            renderCalendar();
            openCardModal(card.id);
        });
    });

    // Current time indicator
    if (days.includes(today)) {
        const now = new Date();
        const nowHour = now.getHours();
        const nowMin = now.getMinutes();
        if (nowHour >= startHour && nowHour <= endHour) {
            const topOffset = (nowHour - startHour) * cellHeight + (nowMin / 60) * cellHeight;
            const dayIdx = days.indexOf(today);
            const line = document.createElement('div');
            line.className = 'current-time-line';
            line.style.top = (headerRows * cellHeight + topOffset) + 'px';
            line.style.gridColumn = '1 / -1';
            line.innerHTML = '<div class="current-time-dot"></div>';
            grid.appendChild(line);
        }
    }
}

function renderSideBySideCalendar() {
    const container = document.getElementById('calendar-grid-container');
    container.innerHTML =
        '<div class="sidebyside-container">' +
            '<div>' +
                '<div class="sidebyside-label">Planning</div>' +
                '<div id="sidebyside-planning"></div>' +
            '</div>' +
            '<div>' +
                '<div class="sidebyside-label">Actual</div>' +
                '<div id="sidebyside-actual"></div>' +
            '</div>' +
        '</div>';

    // Render each side into temporary containers then move
    const planningTarget = document.getElementById('sidebyside-planning');
    const actualTarget = document.getElementById('sidebyside-actual');

    // Planning side
    const planContainer = document.createElement('div');
    planContainer.id = 'calendar-grid-container';
    document.body.appendChild(planContainer);
    const savedContainer = document.getElementById('calendar-grid-container');

    // Simplified: render month views inline for side-by-side
    planningTarget.innerHTML = renderMonthGridHTML('planning');
    actualTarget.innerHTML = renderMonthGridHTML('actual');

    // Add drop handlers to planning side
    planningTarget.querySelectorAll('.month-grid-day').forEach(dayEl => {
        dayEl.addEventListener('dragover', e => { e.preventDefault(); dayEl.classList.add('drag-over'); });
        dayEl.addEventListener('dragleave', () => dayEl.classList.remove('drag-over'));
        dayEl.addEventListener('drop', e => {
            e.preventDefault();
            dayEl.classList.remove('drag-over');
            const cardId = e.dataTransfer.getData('application/card-id');
            const date = dayEl.dataset.date;
            if (cardId && date) {
                updateCard(cardId, { scheduled: date });
                renderCalendar();
            }
        });
    });
}

function renderMonthGridHTML(subView) {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();

    const cards = getCards();
    const focusLog = getFocusLog();
    const today = todayStr();

    let html = '<div class="month-grid">';
    ['S','M','T','W','T','F','S'].forEach(d => {
        html += '<div class="month-grid-header">' + d + '</div>';
    });

    const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
    for (let i = 0; i < totalCells; i++) {
        const dayNum = i - startOffset + 1;
        const isCurrentMonth = dayNum >= 1 && dayNum <= lastDay.getDate();
        const date = new Date(year, month, dayNum);
        const dateStr = dateToStr(date);
        const isTodayCell = dateStr === today;

        let classes = 'month-grid-day';
        if (!isCurrentMonth) classes += ' other-month';
        if (isTodayCell) classes += ' today';

        if (subView === 'actual') {
            const dayLog = focusLog.filter(l => l.date === dateStr);
            const totalMin = dayLog.reduce((s, l) => s + l.duration, 0);
            if (totalMin > 120) classes += ' heat-heavy';
            else if (totalMin > 60) classes += ' heat-medium';
            else if (totalMin > 0) classes += ' heat-light';
        }

        html += '<div class="' + classes + '" data-date="' + dateStr + '">';
        html += '<div class="month-day-number">' + (isCurrentMonth ? dayNum : '') + '</div>';

        if (isCurrentMonth) {
            if (subView === 'planning') {
                const dayCards = cards.filter(c => c.scheduled === dateStr);
                dayCards.slice(0, 2).forEach(c => {
                    html += '<div class="month-day-card priority-' + c.priority + '" onclick="openCardModal(\'' + c.id + '\')">' +
                        escapeHtml(c.title || '?') + '</div>';
                });
                if (dayCards.length > 2) html += '<div class="month-day-card" style="color:#8e8e93;font-size:9px">+' + (dayCards.length - 2) + '</div>';
            }
            if (subView === 'actual') {
                const dayLog = focusLog.filter(l => l.date === dateStr);
                const totalMin = dayLog.reduce((s, l) => s + l.duration, 0);
                if (totalMin > 0) {
                    html += '<div class="month-day-focus">' + Math.round(totalMin) + 'm</div>';
                }
            }
        }
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function getCalendarDays() {
    const d = new Date(calendarViewDate);
    const days = [];
    if (currentCalendarScale === 'week') {
        d.setDate(d.getDate() - d.getDay());
        for (let i = 0; i < 7; i++) {
            days.push(dateToStr(d));
            d.setDate(d.getDate() + 1);
        }
    } else if (currentCalendarScale === '3day') {
        for (let i = 0; i < 3; i++) {
            days.push(dateToStr(d));
            d.setDate(d.getDate() + 1);
        }
    } else { // day
        days.push(dateToStr(d));
    }
    return days;
}

// ===== Pomodoro Timer =====

let timerInterval = null;
let timerRemaining = 0; // seconds
let timerTotal = 0;
let timerRunning = false;
let timerPaused = false;
let timerType = 'focus'; // 'focus', 'shortBreak', 'longBreak'
let sessionCount = 0;
let currentFocusCardId = null;
let currentFocusTaskName = '';
let timerStartTime = null;
let skipBreakVisible = false;

function updateFocusTaskDropdown() {
    const select = document.getElementById('focus-task-select');
    select.innerHTML = '<option value="" disabled selected>Select a task...</option>';
    const cards = getCards().filter(c => c.status === 'To Do' || c.status === 'In Progress');
    cards.forEach(card => {
        const opt = document.createElement('option');
        opt.value = card.id;
        opt.textContent = card.title + ' (' + card.estimatedTime + ')';
        select.appendChild(opt);
    });
}

function selectFocusTask() {
    const select = document.getElementById('focus-task-select');
    const cardId = select.value;
    if (cardId) {
        currentFocusCardId = cardId;
        const card = getCardById(cardId);
        currentFocusTaskName = card ? card.title : '';
        document.getElementById('focus-task-name').textContent = currentFocusTaskName;
        document.getElementById('focus-quick-task').value = '';
    }
}

function toggleTimer() {
    if (!timerRunning && !timerPaused) {
        startTimer();
    } else if (timerRunning && !timerPaused) {
        pauseTimer();
    } else if (timerPaused) {
        resumeTimer();
    }
}

function startTimer() {
    // Get task
    const quickTask = document.getElementById('focus-quick-task').value.trim();
    if (quickTask) {
        currentFocusCardId = null;
        currentFocusTaskName = quickTask;
        document.getElementById('focus-task-name').textContent = quickTask;
    }

    if (!currentFocusTaskName && !currentFocusCardId) {
        const select = document.getElementById('focus-task-select');
        if (select.value) {
            selectFocusTask();
        } else {
            currentFocusTaskName = 'Untitled Focus';
            document.getElementById('focus-task-name').textContent = currentFocusTaskName;
        }
    }

    const settings = getFocusSettings();
    timerType = 'focus';
    timerTotal = settings.focusDuration * 60;
    timerRemaining = timerTotal;
    timerRunning = true;
    timerPaused = false;
    timerStartTime = new Date();
    skipBreakVisible = false;

    updateTimerDisplay();
    updateTimerButtons();

    timerInterval = setInterval(tickTimer, 1000);
}

function pauseTimer() {
    timerPaused = true;
    timerRunning = true;
    clearInterval(timerInterval);
    updateTimerButtons();
}

function resumeTimer() {
    timerPaused = false;
    timerRunning = true;
    timerInterval = setInterval(tickTimer, 1000);
    updateTimerButtons();
}

function stopTimer() {
    const wasRunning = timerRunning;
    clearInterval(timerInterval);
    timerRunning = false;
    timerPaused = false;

    // Log partial session if it was a focus session
    if (wasRunning && timerType === 'focus') {
        const elapsed = timerTotal - timerRemaining;
        if (elapsed > 60) { // Only log if > 1 min
            logFocusSession(Math.round(elapsed / 60));
        }
    }

    resetTimerDisplay();
    updateTimerButtons();
}

function extendTimer(minutes) {
    timerRemaining += minutes * 60;
    timerTotal += minutes * 60;
    updateTimerDisplay();
}

function tickTimer() {
    timerRemaining--;

    // Show skip break button near end of focus session
    if (timerType === 'focus' && timerRemaining <= 120 && !skipBreakVisible) {
        skipBreakVisible = true;
        const skipBtn = document.getElementById('skip-break-btn');
        skipBtn.style.display = 'inline-block';
        skipBtn.classList.add('fading-in');
    }

    if (timerRemaining <= 0) {
        clearInterval(timerInterval);

        if (timerType === 'focus') {
            sessionCount++;
            updateSessionCounter();
            showCompletionPopup();
            startBreakInBackground();
        } else {
            // Break finished
            timerType = 'focus';
            resetTimerDisplay();
            updateTimerButtons();
        }
        return;
    }

    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timerRemaining / 60);
    const seconds = timerRemaining % 60;
    document.getElementById('timer-time').textContent =
        String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');

    // Update ring
    const circumference = 628.32;
    const progress = timerRemaining / timerTotal;
    const offset = circumference * (1 - progress);
    const ring = document.getElementById('timer-ring-progress');
    ring.style.strokeDashoffset = offset;
    ring.classList.toggle('break', timerType !== 'focus');

    // Update label
    const labels = { focus: 'Focus', shortBreak: 'Short Break', longBreak: 'Long Break' };
    document.getElementById('timer-label').textContent = labels[timerType] || 'Focus';
}

function updateTimerButtons() {
    const mainBtn = document.getElementById('timer-main-btn');
    const stopBtn = document.getElementById('timer-stop-btn');
    const ext1 = document.getElementById('extend-1-btn');
    const ext5 = document.getElementById('extend-5-btn');
    const skipBtn = document.getElementById('skip-break-btn');

    if (!timerRunning && !timerPaused) {
        mainBtn.textContent = 'Start';
        mainBtn.className = 'timer-btn timer-start';
        stopBtn.style.display = 'none';
        ext1.style.display = 'none';
        ext5.style.display = 'none';
        skipBtn.style.display = 'none';
    } else if (timerPaused) {
        mainBtn.textContent = 'Resume';
        mainBtn.className = 'timer-btn timer-start paused';
        stopBtn.style.display = 'inline-block';
        ext1.style.display = timerType === 'focus' ? 'inline-block' : 'none';
        ext5.style.display = timerType === 'focus' ? 'inline-block' : 'none';
    } else {
        mainBtn.textContent = 'Pause';
        mainBtn.className = 'timer-btn timer-start';
        stopBtn.style.display = 'inline-block';
        ext1.style.display = timerType === 'focus' ? 'inline-block' : 'none';
        ext5.style.display = timerType === 'focus' ? 'inline-block' : 'none';
        if (timerType !== 'focus') {
            skipBtn.style.display = 'inline-block';
        }
    }
}

function resetTimerDisplay() {
    const settings = getFocusSettings();
    timerTotal = settings.focusDuration * 60;
    timerRemaining = timerTotal;
    timerType = 'focus';
    skipBreakVisible = false;
    updateTimerDisplay();
}

function updateSessionCounter() {
    const settings = getFocusSettings();
    const current = ((sessionCount - 1) % settings.longBreakInterval) + 1;
    document.getElementById('session-counter').textContent =
        'Session ' + current + ' of ' + settings.longBreakInterval;
}

function startBreakInBackground() {
    const settings = getFocusSettings();
    const isLongBreak = sessionCount % settings.longBreakInterval === 0;
    timerType = isLongBreak ? 'longBreak' : 'shortBreak';
    timerTotal = (isLongBreak ? settings.longBreak : settings.shortBreak) * 60;
    timerRemaining = timerTotal;
    timerRunning = true;
    timerPaused = false;

    updateTimerDisplay();
    updateTimerButtons();

    // Start break countdown (runs behind popup)
    timerInterval = setInterval(() => {
        timerRemaining--;
        updateTimerDisplay();
        // Update popup break timer display
        const breakTimeEl = document.getElementById('completion-break-time');
        if (breakTimeEl) {
            const m = Math.floor(timerRemaining / 60);
            const s = timerRemaining % 60;
            breakTimeEl.textContent = m + ':' + String(s).padStart(2, '0');
        }
        if (timerRemaining <= 0) {
            clearInterval(timerInterval);
            timerRunning = false;
            timerType = 'focus';
            resetTimerDisplay();
            updateTimerButtons();
        }
    }, 1000);
}

function skipBreak() {
    clearInterval(timerInterval);
    timerType = 'focus';
    timerRunning = false;
    resetTimerDisplay();
    updateTimerButtons();
}

function skipBreakFromPopup() {
    skipBreak();
    closeCompletionPopup();
}

// ===== Completion Popup =====

function showCompletionPopup() {
    document.getElementById('completion-popup').style.display = 'block';
    document.getElementById('completion-text').value = '';
    document.getElementById('partial-form').style.display = 'none';
    document.getElementById('partial-percentage').value = 50;
    document.getElementById('partial-pct-display').textContent = '50%';

    if (currentFocusCardId) {
        const card = getCardById(currentFocusCardId);
        if (card) {
            document.getElementById('partial-continuation-name').value = card.title + ' [Continued]';
        }
    }
}

function closeCompletionPopup() {
    document.getElementById('completion-popup').style.display = 'none';
}

function showPartialForm() {
    document.getElementById('partial-form').style.display = 'block';
}

function completePomodoro(type) {
    const accomplishment = document.getElementById('completion-text').value.trim();
    const settings = getFocusSettings();
    const focusDuration = settings.focusDuration;

    // Log the focus session
    logFocusSession(focusDuration, accomplishment, type);

    // Add accomplishment as comment on card
    if (currentFocusCardId && accomplishment) {
        const card = getCardById(currentFocusCardId);
        if (card) {
            const comments = [...(card.comments || []), {
                text: '[Pomodoro] ' + accomplishment,
                date: new Date().toISOString(),
                author: getSettings().people[0] || 'User'
            }];
            updateCard(currentFocusCardId, { comments });
        }
    }

    if (type === 'completed' && currentFocusCardId) {
        updateCard(currentFocusCardId, { status: 'Done' });
    }

    if (type === 'partial' && currentFocusCardId) {
        const percentage = parseInt(document.getElementById('partial-percentage').value);
        const card = getCardById(currentFocusCardId);

        if (card) {
            // Partial points
            const partialPoints = Math.round(card.points * (percentage / 100));
            const comments = [...(card.comments || [])];
            comments.push({
                text: 'Partial completion (' + percentage + '%) - ' + partialPoints + ' pts awarded',
                date: new Date().toISOString(),
                author: 'System'
            });
            updateCard(currentFocusCardId, { status: 'Done', points: partialPoints, comments });

            // Create continuation task
            const createContinuation = document.getElementById('partial-create-continuation').checked;
            if (createContinuation) {
                const contName = document.getElementById('partial-continuation-name').value.trim() || card.title + ' [Continued]';
                // Link to the ORIGINAL parent (not intermediate continuations)
                const originalParent = card.parentTaskId || card.id;
                const newCard = createCard({
                    title: contName,
                    status: 'To Do',
                    priority: card.priority,
                    difficulty: card.difficulty,
                    estimatedTime: card.estimatedTime,
                    tags: [...card.tags],
                    assignee: card.assignee,
                    parentTaskId: originalParent
                });

                updateCard(currentFocusCardId, {
                    comments: [...(getCardById(currentFocusCardId).comments || []), {
                        text: 'Continued as "' + contName + '"',
                        date: new Date().toISOString(),
                        author: 'System'
                    }]
                });
            }
        }
    }

    // Free spin tracking
    settings.completedPomodoroCount = (settings.completedPomodoroCount || 0) + 1;
    if (settings.completedPomodoroCount >= settings.pomodorosPerFreeSpin) {
        settings.freeSpinsAvailable = (settings.freeSpinsAvailable || 0) + settings.freeSpinsPerReward;
        settings.completedPomodoroCount = 0;
    }
    saveFocusSettingsData(settings);
    updateFreeSpinUI();

    closeCompletionPopup();
    renderFocusStats();
    updateFocusTaskDropdown();
}

function logFocusSession(duration, accomplishment, completion) {
    const log = getFocusLog();
    const now = new Date();
    const startDate = timerStartTime || new Date(now.getTime() - duration * 60000);

    log.push({
        cardId: currentFocusCardId,
        taskName: currentFocusTaskName || 'Untitled Focus',
        duration: duration,
        date: todayStr(),
        startTime: String(startDate.getHours()).padStart(2, '0') + ':' + String(startDate.getMinutes()).padStart(2, '0'),
        endTime: String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'),
        accomplishment: accomplishment || '',
        completion: completion || 'completed'
    });
    saveFocusLog(log);
}

function renderFocusStats() {
    const log = getFocusLog();
    const today = todayStr();
    const todayLog = log.filter(l => l.date === today);

    const totalMin = todayLog.reduce((s, l) => s + l.duration, 0);
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    document.getElementById('focus-today-hours').textContent = hrs + 'h ' + mins + 'm';
    document.getElementById('focus-today-sessions').textContent = todayLog.length;

    // Recent sessions
    const list = document.getElementById('focus-recent-list');
    list.innerHTML = '';
    log.slice(-10).reverse().forEach(entry => {
        const li = document.createElement('li');
        li.className = 'focus-recent-item';
        li.innerHTML =
            '<span class="focus-recent-task">' + escapeHtml(entry.taskName) + '</span>' +
            '<span class="focus-recent-duration">' + entry.duration + 'm</span>' +
            '<span class="focus-recent-time">' + entry.date + ' ' + (entry.startTime || '') + '</span>';
        list.appendChild(li);
    });
}

// ===== Reward Wheel =====

const WHEEL_COLORS = [
    '#7EC8E3', '#A8D8B9', '#F7C59F', '#E8A0BF',
    '#B4A7D6', '#F6E27F', '#95D0C7', '#F4B9B2'
];

let wheelSpinning = false;
let currentRotation = 0;
let cachedSlices = [];
let cachedSlicesSeed = '';
let isFreeSpin = false;

function initWheel() {
    const savedCost = localStorage.getItem('wheelSpinCost');
    if (savedCost) {
        document.getElementById('spin-cost').value = savedCost;
    }
    renderWheelItems();
    updateWheelConfigDropdown();
    updateFreeSpinUI();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => drawWheel(), 200);
    });
}

function updateSpinCost() {
    const cost = parseInt(document.getElementById('spin-cost').value) || 100;
    localStorage.setItem('wheelSpinCost', cost);
    renderWheelItems();
}

function getSpinCost() {
    return parseInt(localStorage.getItem('wheelSpinCost')) || 100;
}

function getWheelItems() {
    return JSON.parse(localStorage.getItem('wheelItems')) || [];
}

function saveWheelItems(items) {
    localStorage.setItem('wheelItems', JSON.stringify(items));
}

function buildExpandedSlices(items) {
    const spinCost = getSpinCost();
    const seed = JSON.stringify(items) + spinCost + (isFreeSpin ? 'free' : 'paid');

    if (seed === cachedSlicesSeed && cachedSlices.length > 0) return cachedSlices;

    let expanded = [];
    items.forEach((item, idx) => {
        const rawSlices = spinCost / item.cost;
        const sliceCount = Math.max(1, Math.round(rawSlices));
        for (let i = 0; i < sliceCount; i++) {
            expanded.push({ name: item.name, cost: item.cost, originalIndex: idx });
        }
    });

    const hashVal = simpleHash(seed);
    seededShuffle(expanded, hashVal);

    cachedSlices = expanded;
    cachedSlicesSeed = seed;
    return expanded;
}

function drawWheel() {
    const canvas = document.getElementById('wheel-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const items = getWheelItems();

    const container = canvas.parentElement;
    const size = Math.min(container.clientWidth - 20, 340);
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    const scale = window.devicePixelRatio || 1;
    canvas.width = size * scale;
    canvas.height = size * scale;
    ctx.scale(scale, scale);

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 4;

    ctx.clearRect(0, 0, size, size);

    if (items.length === 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.fillStyle = '#f0f0f0';
        ctx.fill();
        ctx.strokeStyle = '#e5e5ea';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#8e8e93';
        ctx.font = '15px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Add rewards to spin!', cx, cy);
        return;
    }

    const slices = buildExpandedSlices(items);
    const totalSlices = slices.length;
    const sliceAngle = (2 * Math.PI) / totalSlices;
    let angle = -Math.PI / 2;

    slices.forEach(slice => {
        const endAngle = angle + sliceAngle;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, angle, endAngle);
        ctx.closePath();
        ctx.fillStyle = WHEEL_COLORS[slice.originalIndex % WHEEL_COLORS.length];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (sliceAngle > 0.18) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle + sliceAngle / 2);
            ctx.fillStyle = '#2c2c2e';
            const fontSize = Math.min(13, Math.max(8, sliceAngle * 35));
            ctx.font = '600 ' + fontSize + 'px -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            const maxLen = Math.floor(r * 0.55 / (fontSize * 0.55));
            let label = slice.name;
            if (label.length > maxLen) label = label.substring(0, maxLen - 1) + '..';
            ctx.fillText(label, r * 0.22, 0);
            ctx.restore();
        }

        angle = endAngle;
    });

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.1, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#e5e5ea';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function spinWheel() {
    if (wheelSpinning) return;
    const items = getWheelItems();
    if (items.length === 0) return;

    wheelSpinning = true;
    isFreeSpin = false;
    document.getElementById('spin-button').disabled = true;
    document.getElementById('wheel-result').style.display = 'none';

    const canvas = document.getElementById('wheel-canvas');
    const totalDeg = 1800 + Math.random() * 1800;
    const duration = 4000 + Math.random() * 1000;
    const startTime = performance.now();
    const startRot = currentRotation;

    function animate(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const rotation = startRot + totalDeg * eased;
        canvas.style.transform = 'rotate(' + rotation + 'deg)';

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            currentRotation = rotation % 360;
            wheelSpinning = false;
            document.getElementById('spin-button').disabled = false;
            determineWinner(rotation);
        }
    }

    requestAnimationFrame(animate);
}

function useFreeSpin() {
    const settings = getFocusSettings();
    if (settings.freeSpinsAvailable <= 0) return;

    settings.freeSpinsAvailable--;
    saveFocusSettingsData(settings);
    updateFreeSpinUI();

    isFreeSpin = true;
    spinWheel();
}

function updateFreeSpinUI() {
    const settings = getFocusSettings();
    const badge = document.getElementById('free-spin-badge');
    const notice = document.getElementById('free-spin-notice');
    const count = settings.freeSpinsAvailable || 0;

    if (count > 0) {
        badge.style.display = 'inline-block';
        badge.textContent = count;
        notice.style.display = 'flex';
        document.getElementById('free-spin-count').textContent = count;
    } else {
        badge.style.display = 'none';
        notice.style.display = 'none';
    }
}

function determineWinner(finalDeg) {
    const items = getWheelItems();
    const slices = buildExpandedSlices(items);
    const totalSlices = slices.length;
    const sliceAngleDeg = 360 / totalSlices;

    const normalized = ((finalDeg % 360) + 360) % 360;
    const pointerSlice = Math.floor(normalized / sliceAngleDeg) % totalSlices;
    const winnerIdx = (totalSlices - pointerSlice) % totalSlices;
    const winner = slices[winnerIdx];

    const resultEl = document.getElementById('wheel-result');
    const textEl = document.getElementById('wheel-result-text');

    if (isFreeSpin) {
        textEl.textContent = 'Free Spin! You won: ' + winner.name;
        resultEl.style.background = '#fff3e0';
        textEl.style.color = '#e65100';
    } else {
        textEl.textContent = 'You won: ' + winner.name + ' (' + winner.cost + ' pts)';
        resultEl.style.background = '#d4edda';
        textEl.style.color = '#155724';
    }
    resultEl.style.display = 'block';
    isFreeSpin = false;
}

function dismissResult() {
    document.getElementById('wheel-result').style.display = 'none';
}

function renderWheelItems() {
    const items = getWheelItems();
    const spinCost = getSpinCost();
    const list = document.getElementById('wheel-items-list');
    if (!list) return;
    list.innerHTML = '';
    cachedSlicesSeed = '';

    items.forEach((item, index) => {
        const rawSlices = spinCost / item.cost;
        const sliceCount = Math.max(1, Math.round(rawSlices));
        const color = WHEEL_COLORS[index % WHEEL_COLORS.length];

        const li = document.createElement('li');
        li.className = 'wheel-item';
        li.style.setProperty('--item-color', color);
        li.innerHTML =
            '<div class="wheel-item-info">' +
                '<span class="wheel-item-name">' + escapeHtml(item.name) + '</span>' +
                '<span class="wheel-item-cost"> - ' + item.cost + ' pts</span>' +
                '<span class="wheel-item-slices">(' + sliceCount + ' slice' + (sliceCount !== 1 ? 's' : '') + ')</span>' +
            '</div>' +
            '<div class="wheel-item-actions">' +
                '<button onclick="adjustCost(' + index + ', 1)">-</button>' +
                '<button onclick="adjustCost(' + index + ', -1)">+</button>' +
                '<button class="wheel-item-remove" onclick="removeWheelItem(' + index + ')">&times;</button>' +
            '</div>';
        list.appendChild(li);
    });

    drawWheel();
}

function adjustCost(index, direction) {
    const items = getWheelItems();
    if (direction > 0) {
        items[index].cost = Math.max(1, Math.round(items[index].cost / 2));
    } else {
        items[index].cost = Math.round(items[index].cost * 2);
    }
    saveWheelItems(items);
    renderWheelItems();
}

function removeWheelItem(index) {
    const items = getWheelItems();
    items.splice(index, 1);
    saveWheelItems(items);
    renderWheelItems();
}

function addWheelItem() {
    const nameInput = document.getElementById('wheel-custom-name');
    const costInput = document.getElementById('wheel-custom-cost');
    const name = nameInput.value.trim();
    const cost = parseInt(costInput.value);
    if (!name || !cost || cost < 1) return;

    const items = getWheelItems();
    const existing = items.find(i => i.name === name);
    if (existing) { existing.cost = cost; }
    else { items.push({ name, cost }); }

    saveWheelItems(items);
    nameInput.value = '';
    costInput.value = '';
    renderWheelItems();
}

function saveWheelConfig() {
    const nameInput = document.getElementById('wheel-config-name');
    const name = nameInput.value.trim();
    if (!name) return;
    const items = getWheelItems();
    if (items.length === 0) return;

    const configs = JSON.parse(localStorage.getItem('wheelConfigs')) || {};
    configs[name] = { items, spinCost: getSpinCost() };
    localStorage.setItem('wheelConfigs', JSON.stringify(configs));
    nameInput.value = '';
    updateWheelConfigDropdown();
}

function loadWheelConfig() {
    const select = document.getElementById('wheel-config-select');
    const name = select.value;
    if (!name) return;
    const configs = JSON.parse(localStorage.getItem('wheelConfigs')) || {};
    if (configs[name]) {
        saveWheelItems(configs[name].items);
        if (configs[name].spinCost) {
            localStorage.setItem('wheelSpinCost', configs[name].spinCost);
            document.getElementById('spin-cost').value = configs[name].spinCost;
        }
        renderWheelItems();
    }
    select.value = '';
}

function deleteWheelConfig() {
    const select = document.getElementById('wheel-config-select');
    const name = select.value;
    if (!name) return;
    const configs = JSON.parse(localStorage.getItem('wheelConfigs')) || {};
    delete configs[name];
    localStorage.setItem('wheelConfigs', JSON.stringify(configs));
    updateWheelConfigDropdown();
}

function updateWheelConfigDropdown() {
    const select = document.getElementById('wheel-config-select');
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>Load saved wheel...</option>';
    const configs = JSON.parse(localStorage.getItem('wheelConfigs')) || {};
    Object.keys(configs).forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });
}

// ===== Settings Modal =====

function openSettings() {
    const settings = getSettings();
    const focusSettings = getFocusSettings();

    renderSettingsList('settings-people-list', settings.people, 'removePerson');
    renderSettingsList('settings-tags-list', settings.tags, 'removeTag');

    document.getElementById('settings-focus-duration').value = focusSettings.focusDuration;
    document.getElementById('settings-short-break').value = focusSettings.shortBreak;
    document.getElementById('settings-long-break').value = focusSettings.longBreak;
    document.getElementById('settings-break-interval').value = focusSettings.longBreakInterval;
    document.getElementById('settings-spins-per-reward').value = focusSettings.freeSpinsPerReward;
    document.getElementById('settings-pomodoros-per-spin').value = focusSettings.pomodorosPerFreeSpin;

    document.getElementById('settings-modal').style.display = 'block';
}

function closeSettings() {
    document.getElementById('settings-modal').style.display = 'none';
}

function renderSettingsList(listId, items, removeFunc) {
    const list = document.getElementById(listId);
    list.innerHTML = '';
    items.forEach((item, idx) => {
        const li = document.createElement('li');
        li.className = 'settings-list-item';
        li.innerHTML =
            '<span>' + escapeHtml(item) + '</span>' +
            '<button onclick="' + removeFunc + '(' + idx + ')">&times;</button>';
        list.appendChild(li);
    });
}

function addPerson() {
    const input = document.getElementById('settings-new-person');
    const name = input.value.trim();
    if (!name) return;
    const settings = getSettings();
    if (!settings.people.includes(name)) settings.people.push(name);
    saveSettings(settings);
    input.value = '';
    renderSettingsList('settings-people-list', settings.people, 'removePerson');
}

function removePerson(idx) {
    const settings = getSettings();
    settings.people.splice(idx, 1);
    saveSettings(settings);
    renderSettingsList('settings-people-list', settings.people, 'removePerson');
}

function addTag() {
    const input = document.getElementById('settings-new-tag');
    const tag = input.value.trim();
    if (!tag) return;
    const settings = getSettings();
    if (!settings.tags.includes(tag)) settings.tags.push(tag);
    saveSettings(settings);
    input.value = '';
    renderSettingsList('settings-tags-list', settings.tags, 'removeTag');
}

function removeTag(idx) {
    const settings = getSettings();
    settings.tags.splice(idx, 1);
    saveSettings(settings);
    renderSettingsList('settings-tags-list', settings.tags, 'removeTag');
}

function saveFocusSettings() {
    const settings = getFocusSettings();
    settings.focusDuration = parseInt(document.getElementById('settings-focus-duration').value) || 25;
    settings.shortBreak = parseInt(document.getElementById('settings-short-break').value) || 5;
    settings.longBreak = parseInt(document.getElementById('settings-long-break').value) || 15;
    settings.longBreakInterval = parseInt(document.getElementById('settings-break-interval').value) || 4;
    settings.freeSpinsPerReward = parseInt(document.getElementById('settings-spins-per-reward').value) || 1;
    settings.pomodorosPerFreeSpin = parseInt(document.getElementById('settings-pomodoros-per-spin').value) || 4;
    saveFocusSettingsData(settings);
}

function exportData() {
    const data = {
        cards: getCards(),
        appSettings: getSettings(),
        focusSettings: getFocusSettings(),
        focusLog: getFocusLog(),
        wheelItems: getWheelItems(),
        wheelConfigs: JSON.parse(localStorage.getItem('wheelConfigs')) || {},
        wheelSpinCost: getSpinCost()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bounty-tracker-backup-' + todayStr() + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.cards) saveCards(data.cards);
            if (data.appSettings) saveSettings(data.appSettings);
            if (data.focusSettings) saveFocusSettingsData(data.focusSettings);
            if (data.focusLog) saveFocusLog(data.focusLog);
            if (data.wheelItems) saveWheelItems(data.wheelItems);
            if (data.wheelConfigs) localStorage.setItem('wheelConfigs', JSON.stringify(data.wheelConfigs));
            if (data.wheelSpinCost) localStorage.setItem('wheelSpinCost', data.wheelSpinCost);
            location.reload();
        } catch (err) {
            alert('Invalid backup file.');
        }
    };
    reader.readAsText(file);
}

function resetAllData() {
    if (!confirm('This will delete ALL data. Are you sure?')) return;
    if (!confirm('Really? This cannot be undone.')) return;
    localStorage.clear();
    location.reload();
}

// ===== Initialization =====

document.addEventListener('DOMContentLoaded', () => {
    renderKanban();
    initWheel();
    updateFocusTaskDropdown();
    renderFocusStats();
    updateSessionCounter();
    resetTimerDisplay();
});
