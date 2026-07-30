import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationsStore } from '../../store/notificationsStore';
import { timeAgo } from '../../utils/date';

/** Campana del encabezado: lee las notificaciones reales del usuario. */
export const NotificationBell: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const items = useNotificationsStore(state => state.items);
  const load = useNotificationsStore(state => state.load);
  const markRead = useNotificationsStore(state => state.markRead);
  const markAllRead = useNotificationsStore(state => state.markAllRead);

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const unread = items.filter(item => !item.read).length;

  useEffect(() => {
    if (user) void load(user.id);
  }, [user, load]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button className="notif-btn" onClick={() => setOpen(value => !value)} aria-label="Notificaciones">
        🔔
        {unread > 0 && <span className="notif-dot">{unread}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-head">Notificaciones</div>
          {items.length === 0 && <div className="notif-item"><div className="notif-text">No tienes notificaciones.</div></div>}
          {items.map(item => (
            <button
              key={item.id}
              className={`notif-item ${item.read ? '' : 'unread'}`.trim()}
              onClick={() => void markRead(item.id)}
            >
              <div className="notif-icon">{item.icon}</div>
              <div className="notif-body">
                <div className="notif-title">{item.title}</div>
                <div className="notif-text">{item.text}</div>
                <div className="notif-time">{timeAgo(item.createdAt)}</div>
              </div>
            </button>
          ))}
          {unread > 0 && (
            <button className="notif-foot" onClick={() => void markAllRead()}>Marcar todas como leídas</button>
          )}
        </div>
      )}
    </div>
  );
};
