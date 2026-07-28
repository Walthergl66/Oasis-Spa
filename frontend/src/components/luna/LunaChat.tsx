import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LunaSession, lunaMessage, type LunaMessage } from '../../services/luna.service';
import { useAppointmentsStore } from '../../store/appointmentsStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationsStore } from '../../store/notificationsStore';
import { useUIStore } from '../../store/uiStore';

const CHIPS = ['Quiero reservar', 'Mis citas', 'Ver promociones', 'Precios', 'Horarios'];

/**
 * Panel de chat de Luna. La conversación la resuelve `LunaSession`, que ejecuta
 * funciones reales del sistema; aquí sólo se pinta el resultado y se refrescan
 * las vistas cuando la ejecución cambió datos (`mutated`).
 */
export const LunaChat: React.FC = () => {
  const open = useUIStore(state => state.chatOpen);
  const close = useUIStore(state => state.closeChat);
  const user = useAuthStore(state => state.user);
  const reloadAppointments = useAppointmentsStore(state => state.reload);
  const reloadNotifications = useNotificationsStore(state => state.reload);

  const session = useMemo(() => new LunaSession(user), []);
  const [messages, setMessages] = useState<LunaMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // La sesión debe conocer al usuario actual para poder agendar a su nombre.
  useEffect(() => {
    session.setUser(user);
  }, [session, user]);

  useEffect(() => {
    if (open && messages.length === 0) setMessages([session.greeting()]);
  }, [open, messages.length, session]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, typing]);

  async function send(rawText?: string) {
    const text = (rawText ?? input).trim();
    if (!text || typing) return;

    setMessages(current => [...current, lunaMessage('user', text)]);
    setInput('');
    setTyping(true);

    const replies = await session.handle(text);
    setTyping(false);
    setMessages(current => [...current, ...replies]);

    if (replies.some(reply => reply.mutated)) {
      await Promise.all([reloadAppointments(), reloadNotifications()]);
    }
  }

  if (!open) return null;

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-header-name">Luna</div>
          <div className="chat-header-status">Asistente virtual · En línea</div>
        </div>
        <button className="chat-close" onClick={close} aria-label="Cerrar chat">✕</button>
      </div>

      <div className="chat-body" ref={bodyRef}>
        {messages.map(message => (
          <div key={message.id} className={`msg ${message.from}`}>
            {message.text}
            {message.fnTag && <div className="fn-tag">{message.fnTag}</div>}
            {message.options && message.options.length > 0 && (
              <div className="msg-options">
                {message.options.map(option => (
                  <button key={option.value} onClick={() => void send(option.value)}>{option.label}</button>
                ))}
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div className="msg bot typing"><span /><span /><span /></div>
        )}
      </div>

      <div className="chat-chips">
        {CHIPS.map(chip => (
          <button key={chip} onClick={() => void send(chip)}>{chip}</button>
        ))}
      </div>

      <div className="chat-input-row">
        <input
          placeholder="Escribe tu consulta..."
          value={input}
          onChange={event => setInput(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') void send();
          }}
        />
        <button className="chat-send" onClick={() => void send()} disabled={typing} aria-label="Enviar">➤</button>
      </div>
    </div>
  );
};

/** Botón flotante que abre a Luna. */
export const LunaFab: React.FC = () => {
  const toggle = useUIStore(state => state.toggleChat);
  return (
    <button className="luna-fab" onClick={toggle} aria-label="Abrir asistente Luna">🌿</button>
  );
};
