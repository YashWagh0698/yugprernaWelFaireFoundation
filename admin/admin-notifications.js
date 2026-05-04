// ══════════════════════════════════════════════════════════
//  admin-notifications.js
//  Include in admin/dashboard.html via <script src="/admin-notifications.js">
//  Requires: #notif-btn, #notif-badge, #notif-panel in your dashboard HTML
// ══════════════════════════════════════════════════════════

(function () {
    'use strict';

    // ── helpers ─────────────────────────────────────────────────
    function esc(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function fmtDate(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        return isNaN(d) ? iso : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    // ── state ────────────────────────────────────────────────────
    let messages        = [];
    let panelOpen       = false;
    let lastUnreadCount = 0;
    let toastTimeout    = null;

    // ── DOM refs (resolved lazily) ────────────────────────────────
    function $id(id) { return document.getElementById(id); }

    // ── fetch messages from API ──────────────────────────────────
    async function fetchMessages() {
        try {
            const res = await fetch('/api/messages', { credentials: 'include' });
            if (!res.ok) return;
            const data = await res.json();
            const newUnread = data.unread_count || 0;

            // Toast if new messages arrived since last poll
            if (newUnread > lastUnreadCount && lastUnreadCount !== -1) {
                showToast(`You have ${newUnread} unread message${newUnread > 1 ? 's' : ''}`);
            }
            lastUnreadCount = newUnread;
            messages = data.messages || [];

            updateBadge(newUnread);
            if (panelOpen) renderPanel();
        } catch (err) {
            console.warn('Notification fetch failed:', err.message);
        }
    }

    // ── badge ────────────────────────────────────────────────────
    function updateBadge(count) {
        const badge = $id('notif-badge');
        if (!badge) return;
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
        badge.setAttribute('aria-label', `${count} unread message${count !== 1 ? 's' : ''}`);
    }

    // ── panel render ─────────────────────────────────────────────
    function renderPanel() {
        const panel = $id('notif-panel');
        if (!panel) return;

        if (!messages.length) {
            panel.innerHTML = '<p style="color:#7BABB0;padding:1rem;font-size:0.9rem;">No messages yet.</p>';
            return;
        }

        panel.innerHTML = messages.map(msg => `
            <div class="notif-item ${msg.is_read ? '' : 'notif-unread'}" data-id="${esc(msg.id)}">
                <div class="notif-header">
                    <span class="notif-name">${esc(msg.name)}</span>
                    ${!msg.is_read ? '<span class="notif-dot" aria-label="Unread"></span>' : ''}
                    <span class="notif-date">${fmtDate(msg.created_at)}</span>
                </div>
                <div class="notif-email">${esc(msg.email)}${msg.enquiry_type ? ` · ${esc(msg.enquiry_type)}` : ''}</div>
                <div class="notif-msg">${esc(msg.message)}</div>
                ${!msg.is_read
                    ? `<button class="notif-read-btn" data-id="${esc(msg.id)}" aria-label="Mark message from ${esc(msg.name)} as read">Mark as read</button>`
                    : ''}
            </div>
        `).join('');

        // Attach mark-as-read handlers
        panel.querySelectorAll('.notif-read-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                btn.disabled = true;
                btn.textContent = 'Marking…';
                await markAsRead(id);
            });
        });
    }

    // ── mark as read ─────────────────────────────────────────────
    async function markAsRead(id) {
        try {
            const res = await fetch(`/api/messages/${encodeURIComponent(id)}/read`, {
                method: 'PATCH',
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed');
            // Optimistically update local state
            const msg = messages.find(m => m.id === id);
            if (msg) { msg.is_read = true; }
            lastUnreadCount = messages.filter(m => !m.is_read).length;
            updateBadge(lastUnreadCount);
            renderPanel();
        } catch (err) {
            console.error('Mark read failed:', err.message);
        }
    }

    // ── toast ─────────────────────────────────────────────────────
    function showToast(text) {
        let toast = $id('notif-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'notif-toast';
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'polite');
            document.body.appendChild(toast);
        }
        toast.textContent = text;
        toast.classList.add('notif-toast-show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.remove('notif-toast-show'), 4000);
    }

    // ── panel toggle ──────────────────────────────────────────────
    function togglePanel() {
        const panel = $id('notif-panel');
        const btn   = $id('notif-btn');
        if (!panel) return;
        panelOpen = !panelOpen;
        panel.style.display = panelOpen ? 'block' : 'none';
        btn && btn.setAttribute('aria-expanded', String(panelOpen));
        if (panelOpen) renderPanel();
    }

    // ── inject styles ─────────────────────────────────────────────
    function injectStyles() {
        if ($id('notif-styles')) return;
        const style = document.createElement('style');
        style.id = 'notif-styles';
        style.textContent = `
            #notif-btn {
                position: relative;
                background: #1A3A3E;
                color: #F0F9FA;
                border: 2px solid #2A5A5E;
                border-radius: 0.5rem;
                padding: 0.5rem 1rem;
                cursor: pointer;
                font-size: 0.9rem;
                font-weight: 600;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                font-family: 'Source Sans 3', sans-serif;
                transition: border-color 0.2s, background 0.2s;
                min-height: 2.5rem;
            }
            #notif-btn:hover { border-color: #E8611A; background: rgba(232,97,26,0.1); }
            #notif-badge {
                display: none;
                background: #E8611A;
                color: #fff;
                font-size: 0.65rem;
                font-weight: 700;
                border-radius: 999px;
                padding: 0.15rem 0.45rem;
                min-width: 1.2rem;
                text-align: center;
                line-height: 1.4;
            }
            #notif-panel {
                display: none;
                position: absolute;
                top: calc(100% + 8px);
                right: 0;
                width: min(420px, 95vw);
                max-height: 70vh;
                overflow-y: auto;
                background: #112428;
                border: 2px solid #2A5A5E;
                border-radius: 0.75rem;
                box-shadow: 0 1rem 3rem rgba(0,0,0,0.5);
                z-index: 500;
            }
            .notif-panel-header {
                padding: 0.875rem 1rem;
                border-bottom: 1px solid #2A5A5E;
                font-size: 0.8rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: #E8611A;
            }
            .notif-item {
                padding: 1rem;
                border-bottom: 1px solid rgba(42,90,94,0.5);
                font-family: 'Source Sans 3', sans-serif;
                transition: background 0.2s;
            }
            .notif-item:last-child { border-bottom: none; }
            .notif-unread { background: rgba(232,97,26,0.07); }
            .notif-header {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.2rem;
            }
            .notif-name {
                font-weight: 700;
                color: #F0F9FA;
                font-size: 0.9rem;
                flex: 1;
            }
            .notif-dot {
                width: 8px; height: 8px;
                border-radius: 50%;
                background: #E8611A;
                flex-shrink: 0;
            }
            .notif-date { font-size: 0.72rem; color: #7BABB0; }
            .notif-email { font-size: 0.78rem; color: #2DD4BF; margin-bottom: 0.4rem; }
            .notif-msg {
                font-size: 0.875rem;
                color: #B2D8DC;
                line-height: 1.55;
                white-space: pre-wrap;
                word-break: break-word;
            }
            .notif-read-btn {
                margin-top: 0.5rem;
                background: none;
                border: 1px solid #2A5A5E;
                border-radius: 0.375rem;
                color: #7BABB0;
                font-size: 0.75rem;
                padding: 0.25rem 0.625rem;
                cursor: pointer;
                font-family: 'Source Sans 3', sans-serif;
                transition: color 0.2s, border-color 0.2s;
            }
            .notif-read-btn:hover { color: #E8611A; border-color: #E8611A; }
            #notif-toast {
                position: fixed;
                bottom: 1.5rem;
                right: 1.5rem;
                background: #E8611A;
                color: #fff;
                padding: 0.75rem 1.25rem;
                border-radius: 0.5rem;
                font-size: 0.875rem;
                font-weight: 600;
                font-family: 'Source Sans 3', sans-serif;
                box-shadow: 0 0.5rem 2rem rgba(0,0,0,0.4);
                z-index: 9999;
                opacity: 0;
                transform: translateY(1rem);
                transition: opacity 0.3s, transform 0.3s;
                pointer-events: none;
            }
            #notif-toast.notif-toast-show { opacity: 1; transform: translateY(0); }
        `;
        document.head.appendChild(style);
    }

    // ── init ──────────────────────────────────────────────────────
    function init() {
        injectStyles();

        const btn = $id('notif-btn');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                togglePanel();
            });
        }

        // Close panel on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#notif-btn') && !e.target.closest('#notif-panel')) {
                const panel = $id('notif-panel');
                if (panel && panelOpen) {
                    panelOpen = false;
                    panel.style.display = 'none';
                    btn && btn.setAttribute('aria-expanded', 'false');
                }
            }
        });

        // Initial fetch, then poll every 30 seconds
        lastUnreadCount = -1; // suppress initial toast
        fetchMessages().then(() => { lastUnreadCount = messages.filter(m => !m.is_read).length; });
        setInterval(fetchMessages, 30000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
