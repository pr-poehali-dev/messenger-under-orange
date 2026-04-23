import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import AuthScreen from "@/components/AuthScreen";

// ────────────────────────────────────────────────
// DATA
// ────────────────────────────────────────────────

const CONTACTS = [
  { id: 1, name: "Алина Морозова", avatar: "АМ", color: "#FF6B2B", status: "online", about: "В сети" },
  { id: 2, name: "Дмитрий Волков", avatar: "ДВ", color: "#9B59B6", status: "offline", about: "Был час назад" },
  { id: 3, name: "Катя Соколова", avatar: "КС", color: "#E74C3C", status: "online", about: "В сети" },
  { id: 4, name: "Михаил Петров", avatar: "МП", color: "#2ECC71", status: "offline", about: "Был вчера" },
  { id: 5, name: "Юля Лебедева", avatar: "ЮЛ", color: "#3498DB", status: "online", about: "В сети" },
  { id: 6, name: "Андрей Смирнов", avatar: "АС", color: "#F39C12", status: "offline", about: "Был 3 дня назад" },
  { id: 7, name: "Наташа Иванова", avatar: "НИ", color: "#1ABC9C", status: "online", about: "Печатает…" },
  { id: 8, name: "Рустам Алиев", avatar: "РА", color: "#E67E22", status: "offline", about: "Был неделю назад" },
];

const CHATS = [
  {
    id: 1, contactId: 1, unread: 3,
    messages: [
      { id: 1, from: "them", text: "Привет! Как дела?", time: "10:21", type: "text", duration: "" },
      { id: 2, from: "me", text: "Отлично, спасибо! А у тебя?", time: "10:22", type: "text", duration: "" },
      { id: 3, from: "them", text: "Тоже хорошо 😊 Встретимся сегодня?", time: "10:23", type: "text", duration: "" },
      { id: 4, from: "them", text: "", time: "10:24", type: "voice", duration: "0:42" },
      { id: 5, from: "me", text: "Да, давай в 18:00?", time: "10:25", type: "text", duration: "" },
    ]
  },
  {
    id: 2, contactId: 3, unread: 0,
    messages: [
      { id: 1, from: "them", text: "Ты видела новую серию?", time: "вчера", type: "text", duration: "" },
      { id: 2, from: "me", text: "Нет ещё, вечером посмотрю", time: "вчера", type: "text", duration: "" },
      { id: 3, from: "them", text: "Не спойлери 😂", time: "вчера", type: "text", duration: "" },
    ]
  },
  {
    id: 3, contactId: 5, unread: 1,
    messages: [
      { id: 1, from: "me", text: "Юля, ты на конференции?", time: "09:00", type: "text", duration: "" },
      { id: 2, from: "them", text: "", time: "09:15", type: "voice", duration: "1:03" },
      { id: 3, from: "them", text: "Да, только зашла! Тут очень интересно", time: "09:16", type: "text", duration: "" },
    ]
  },
  {
    id: 4, contactId: 7, unread: 5,
    messages: [
      { id: 1, from: "them", text: "Срочно нужна помощь 🆘", time: "11:00", type: "text", duration: "" },
      { id: 2, from: "them", text: "Ты сейчас свободна?", time: "11:01", type: "text", duration: "" },
    ]
  },
  {
    id: 5, contactId: 2, unread: 0,
    messages: [
      { id: 1, from: "me", text: "Дима, привет!", time: "пн", type: "text", duration: "" },
      { id: 2, from: "them", text: "О, давно не виделись!", time: "пн", type: "text", duration: "" },
    ]
  },
];

const STATUSES = [
  { id: 1, contactId: 1, seen: false, time: "сегодня, 10:21" },
  { id: 2, contactId: 3, seen: true, time: "сегодня, 09:15" },
  { id: 3, contactId: 5, seen: false, time: "сегодня, 11:30" },
  { id: 4, contactId: 7, seen: false, time: "сегодня, 08:44" },
];

const CALLS_DATA = [
  { id: 1, contactId: 1, type: "incoming", answered: true, duration: "4:23", date: "Сегодня, 10:15" },
  { id: 2, contactId: 3, type: "outgoing", answered: true, duration: "12:01", date: "Сегодня, 09:00" },
  { id: 3, contactId: 2, type: "incoming", answered: false, duration: "", date: "Вчера, 22:13" },
  { id: 4, contactId: 5, type: "outgoing", answered: true, duration: "2:47", date: "Вчера, 18:30" },
  { id: 5, contactId: 7, type: "incoming", answered: false, duration: "", date: "Пн, 14:00" },
  { id: 6, contactId: 8, type: "incoming", answered: true, duration: "0:58", date: "Вс, 11:22" },
];

// ────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────

type Contact = typeof CONTACTS[0];
type Chat = typeof CHATS[0];
type Message = typeof CHATS[0]["messages"][0];
type TabId = "chats" | "statuses" | "calls" | "contacts" | "profile" | "settings";

// ────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────

function getContact(id: number): Contact {
  return CONTACTS.find((c) => c.id === id)!;
}

function Avatar({ contact, size = 44 }: { contact: Contact; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white flex-shrink-0 relative"
      style={{ width: size, height: size, background: contact.color, fontSize: size * 0.33 }}
    >
      {contact.avatar}
      {contact.status === "online" && (
        <span
          className="absolute bottom-0 right-0 rounded-full bg-green-400 border-2 border-white"
          style={{ width: size * 0.27, height: size * 0.27 }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// NOTIFICATION
// ────────────────────────────────────────────────

function Notification({ msg, onClose }: { msg: { title: string; text: string } | null; onClose: () => void }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [msg, onClose]);

  if (!msg) return null;
  return (
    <div className="fixed top-4 left-1/2 z-50 animate-notification" style={{ transform: "translateX(-50%)" }}>
      <div className="flex items-center gap-3 bg-white shadow-2xl rounded-2xl px-4 py-3 min-w-[280px] border border-orange-100">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "hsl(25 95% 53%)" }}>
          <Icon name="Bell" size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-900 truncate">{msg.title}</div>
          <div className="text-xs text-gray-500 truncate">{msg.text}</div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <Icon name="X" size={14} />
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// CHAT SCREEN
// ────────────────────────────────────────────────

function ChatScreen({ chat, contact, onBack, onCall }: {
  chat: Chat;
  contact: Contact;
  onBack: () => void;
  onCall: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>(chat.messages);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const recInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendText() {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now(), from: "me", text: input.trim(), time: "сейчас", type: "text", duration: "" }]);
    setInput("");
  }

  function toggleRecord() {
    if (!recording) {
      setRecording(true);
      setRecTime(0);
      recInterval.current = setInterval(() => setRecTime((t) => t + 1), 1000);
    } else {
      if (recInterval.current) clearInterval(recInterval.current);
      const sec = recTime;
      setRecording(false);
      setRecTime(0);
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      setMessages((prev) => [...prev, { id: Date.now(), from: "me", text: "", time: "сейчас", type: "voice", duration: `${m}:${s.toString().padStart(2, "0")}` }]);
    }
  }

  function fmtRec(s: number) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  }

  const isTyping = contact.about === "Печатает…";

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-orange-50 shadow-sm">
        <button onClick={onBack} className="text-orange-500 mr-1 md:hidden">
          <Icon name="ArrowLeft" size={20} />
        </button>
        <Avatar contact={contact} size={40} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{contact.name}</div>
          <div className="text-xs">
            {isTyping ? (
              <span className="flex items-center gap-1 text-orange-400">
                печатает
                <span className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="typing-dot inline-block w-1 h-1 bg-orange-400 rounded-full" style={{ animationDelay: `${i * 0.16}s` }} />
                  ))}
                </span>
              </span>
            ) : (
              <span className={contact.status === "online" ? "text-green-500" : "text-gray-400"}>
                {contact.status === "online" ? "в сети" : contact.about}
              </span>
            )}
          </div>
        </div>
        <button onClick={onCall} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-orange-50 transition-colors text-orange-500">
          <Icon name="Phone" size={18} />
        </button>
        <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-orange-50 transition-colors text-orange-500">
          <Icon name="Video" size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ background: "hsl(25 100% 97%)" }}>
        {messages.map((msg, i) => {
          const isMe = msg.from === "me";
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fade-in`} style={{ animationDelay: `${i * 0.03}s` }}>
              {!isMe && <Avatar contact={contact} size={28} />}
              <div
                className={`mx-2 max-w-[70%] rounded-2xl px-3 py-2 text-sm ${isMe ? "rounded-tr-sm text-white" : "rounded-tl-sm bg-white text-gray-800 shadow-sm"}`}
                style={isMe ? { background: "hsl(25 95% 53%)" } : {}}
              >
                {msg.type === "voice" ? (
                  <div className="flex items-center gap-2">
                    <button className={`w-7 h-7 rounded-full flex items-center justify-center ${isMe ? "bg-white/20 text-white" : "bg-orange-500 text-white"}`}>
                      <Icon name="Play" size={12} />
                    </button>
                    <div className="flex items-center gap-[2px] h-4">
                      {[4, 7, 5, 9, 6, 8, 5, 7, 4, 6].map((h, j) => (
                        <div key={j} className={`rounded-full ${isMe ? "bg-white/70" : "bg-orange-400"}`} style={{ width: 2.5, height: h }} />
                      ))}
                    </div>
                    <span className={`text-xs ${isMe ? "text-white/80" : "text-gray-400"}`}>{msg.duration}</span>
                  </div>
                ) : msg.text}
                <div className={`text-[10px] mt-0.5 text-right ${isMe ? "text-white/60" : "text-gray-400"}`}>
                  {msg.time}
                  {isMe && <Icon name="CheckCheck" size={10} className="inline ml-1 text-white/80" />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="px-4 py-3 bg-white border-t border-orange-50">
        {recording ? (
          <div className="flex items-center gap-3 bg-red-50 rounded-2xl px-4 py-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-red-500 font-medium flex-1">Запись {fmtRec(recTime)}</span>
            <button onClick={toggleRecord} className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center">
              <Icon name="Square" size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-gray-50 rounded-2xl px-4 py-2 gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendText()}
                placeholder="Сообщение…"
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <button className="text-gray-400 hover:text-orange-400 transition-colors"><Icon name="Paperclip" size={16} /></button>
              <button className="text-gray-400 hover:text-orange-400 transition-colors"><Icon name="Smile" size={16} /></button>
            </div>
            {input.trim() ? (
              <button onClick={sendText} className="w-11 h-11 rounded-full text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform" style={{ background: "hsl(25 95% 53%)" }}>
                <Icon name="Send" size={18} />
              </button>
            ) : (
              <button onClick={toggleRecord} className="w-11 h-11 rounded-full text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform" style={{ background: "hsl(25 95% 53%)" }}>
                <Icon name="Mic" size={18} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// CALL SCREEN
// ────────────────────────────────────────────────

function CallScreen({ contact, onEnd }: { contact: Contact; onEnd: () => void }) {
  const [time, setTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  function fmt(s: number) {
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-between py-16 animate-scale-in"
      style={{ background: `linear-gradient(160deg, ${contact.color}dd 0%, ${contact.color}99 50%, hsl(20 90% 25%) 100%)` }}>
      <div className="flex flex-col items-center gap-4 mt-8">
        <div className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-2xl relative"
          style={{ background: `${contact.color}bb` }}>
          {contact.avatar}
          <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" style={{ animationDuration: "1.5s" }} />
        </div>
        <div className="text-white text-2xl font-bold">{contact.name}</div>
        <div className="text-white/70 text-lg">{fmt(time)}</div>
      </div>
      <div className="flex items-center gap-8">
        <button onClick={() => setMuted(!muted)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${muted ? "bg-white text-orange-500" : "bg-white/20 text-white"}`}>
          <Icon name={muted ? "MicOff" : "Mic"} size={22} />
        </button>
        <button onClick={onEnd} className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:scale-105 transition-transform text-white">
          <Icon name="PhoneOff" size={26} />
        </button>
        <button onClick={() => setSpeaker(!speaker)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${speaker ? "bg-white text-orange-500" : "bg-white/20 text-white"}`}>
          <Icon name={speaker ? "Volume2" : "VolumeX"} size={22} />
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// INCOMING CALL
// ────────────────────────────────────────────────

function IncomingCall({ contact, onAnswer, onDecline }: { contact: Contact; onAnswer: () => void; onDecline: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between py-16 animate-scale-in"
      style={{ background: `linear-gradient(160deg, hsl(20 90% 15%) 0%, ${contact.color}cc 100%)` }}>
      <div className="flex flex-col items-center gap-4 mt-10">
        <div className="text-white/70 text-base">Входящий звонок</div>
        <div className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-2xl relative"
          style={{ background: `${contact.color}bb` }}>
          {contact.avatar}
          <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" style={{ animationDuration: "1s" }} />
        </div>
        <div className="text-white text-3xl font-bold">{contact.name}</div>
      </div>
      <div className="flex items-center gap-16">
        <div className="flex flex-col items-center gap-2">
          <button onClick={onDecline} className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-xl hover:scale-105 transition-transform text-white">
            <Icon name="PhoneOff" size={26} />
          </button>
          <span className="text-white/70 text-xs">Отклонить</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button onClick={onAnswer} className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-xl hover:scale-105 transition-transform text-white">
            <Icon name="Phone" size={26} />
          </button>
          <span className="text-white/70 text-xs">Принять</span>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// STATUS VIEWER
// ────────────────────────────────────────────────

function StatusViewer({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { onClose(); return 100; }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(t);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col animate-scale-in" style={{ background: "#111" }}>
      <div className="relative w-full h-full flex flex-col">
        <div className="absolute top-0 left-0 right-0 z-10 px-3 pt-4">
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "hsl(25 95% 53%)" }} />
          </div>
        </div>
        <div className="absolute top-6 left-0 right-0 z-10 px-4 pt-4 flex items-center gap-3">
          <Avatar contact={contact} size={36} />
          <div className="flex-1">
            <div className="text-white font-semibold text-sm">{contact.name}</div>
            <div className="text-white/60 text-xs">сегодня, 10:21</div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <Icon name="X" size={22} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${contact.color}, ${contact.color}aa, hsl(20 90% 35%))` }}>
          <div className="text-center px-8">
            <div className="text-7xl mb-4">🌅</div>
            <div className="text-white text-2xl font-bold leading-tight">Отличное утро!</div>
            <div className="text-white/70 text-base mt-2">Андер на связи 📱</div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-8">
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3">
            <input placeholder="Ответить на статус…" className="flex-1 bg-transparent text-white placeholder-white/50 text-sm outline-none" />
            <button className="text-orange-300"><Icon name="Send" size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// TABS CONFIG
// ────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "chats", label: "Чаты", icon: "MessageCircle" },
  { id: "statuses", label: "Статусы", icon: "Circle" },
  { id: "calls", label: "Звонки", icon: "Phone" },
  { id: "contacts", label: "Контакты", icon: "Users" },
  { id: "profile", label: "Профиль", icon: "User" },
  { id: "settings", label: "Настройки", icon: "Settings" },
];

// ────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────

export default function Index() {
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem("ander_token"));
  const [currentUser, setCurrentUser] = useState<{ id: number; phone: string; name: string } | null>(() => {
    const u = localStorage.getItem("ander_user");
    return u ? JSON.parse(u) : null;
  });

  function handleAuth(token: string, user: { id: number; phone: string; name: string }) {
    localStorage.setItem("ander_token", token);
    localStorage.setItem("ander_user", JSON.stringify(user));
    setAuthToken(token);
    setCurrentUser(user);
  }

  if (!authToken || !currentUser) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  return <MessengerApp user={currentUser} onLogout={() => { localStorage.removeItem("ander_token"); localStorage.removeItem("ander_user"); setAuthToken(null); setCurrentUser(null); }} />;
}

function MessengerApp({ user, onLogout }: { user: { id: number; phone: string; name: string }; onLogout: () => void }) {
  const [tab, setTab] = useState<TabId>("chats");
  const [openChat, setOpenChat] = useState<Chat | null>(null);
  const [calling, setCalling] = useState<Contact | null>(null);
  const [incomingFrom, setIncomingFrom] = useState<Contact | null>(null);
  const [viewStatus, setViewStatus] = useState<Contact | null>(null);
  const [notification, setNotification] = useState<{ title: string; text: string } | null>(null);

  const showNotification = (title: string, text: string) => setNotification({ title, text });

  useEffect(() => {
    const t1 = setTimeout(() => {
      setIncomingFrom(CONTACTS[0]);
      showNotification("Входящий звонок", CONTACTS[0].name);
    }, 4000);
    const t2 = setTimeout(() => {
      showNotification(CONTACTS[6].name, "Ты сейчас свободна?");
    }, 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  function startCall(contact: Contact) {
    setIncomingFrom(null);
    setCalling(contact);
  }

  function switchTab(id: TabId) {
    setTab(id);
    setOpenChat(null);
  }

  const totalUnread = CHATS.reduce((s, c) => s + c.unread, 0);
  const ORANGE = "hsl(25 95% 53%)";

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ fontFamily: "'Golos Text', sans-serif" }}>
      <Notification msg={notification} onClose={() => setNotification(null)} />

      {incomingFrom && (
        <IncomingCall contact={incomingFrom} onAnswer={() => startCall(incomingFrom)} onDecline={() => setIncomingFrom(null)} />
      )}
      {calling && <CallScreen contact={calling} onEnd={() => setCalling(null)} />}
      {viewStatus && <StatusViewer contact={viewStatus} onClose={() => setViewStatus(null)} />}

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-20 min-h-screen py-6 items-center gap-1"
        style={{ background: "hsl(20 15% 10%)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
          style={{ background: ORANGE }}>
          <span className="text-white font-black text-xl">А</span>
        </div>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => switchTab(t.id)}
            title={t.label}
            className="relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all group"
            style={{ background: tab === t.id ? ORANGE : "transparent" }}>
            <Icon name={t.icon} size={20} className={tab === t.id ? "text-white" : "text-gray-500 group-hover:text-gray-300"} />
            {t.id === "chats" && totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] flex items-center justify-center text-white font-bold bg-red-500">{totalUnread}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col md:h-screen overflow-hidden">
        {openChat ? (
          <div className="flex-1 overflow-hidden h-full">
            <ChatScreen chat={openChat} contact={getContact(openChat.contactId)} onBack={() => setOpenChat(null)} onCall={() => startCall(getContact(openChat.contactId))} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pb-20 md:pb-0">

            {/* ── CHATS ── */}
            {tab === "chats" && (
              <div className="animate-fade-in">
                <div className="px-4 pt-6 pb-3 flex items-center justify-between">
                  <h1 className="text-2xl font-bold">Чаты</h1>
                  <button className="w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ background: ORANGE }}>
                    <Icon name="Plus" size={18} />
                  </button>
                </div>
                <div className="px-4 mb-4">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2.5">
                    <Icon name="Search" size={16} className="text-gray-400" />
                    <input placeholder="Поиск…" className="bg-transparent text-sm outline-none flex-1 placeholder-gray-400" />
                  </div>
                </div>
                <div>
                  {CHATS.map((chat, i) => {
                    const contact = getContact(chat.contactId);
                    const last = chat.messages[chat.messages.length - 1];
                    return (
                      <button key={chat.id} onClick={() => setOpenChat(chat)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-orange-50/60 transition-colors border-b border-orange-50 animate-fade-in"
                        style={{ animationDelay: `${i * 0.05}s` }}>
                        <Avatar contact={contact} size={52} />
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{contact.name}</span>
                            <span className="text-xs text-gray-400">{last.time}</span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-xs text-gray-500 truncate flex items-center gap-1">
                              {last.type === "voice"
                                ? <><Icon name="Mic" size={11} className="text-orange-400" /> Голосовое · {last.duration}</>
                                : last.text}
                            </span>
                            {chat.unread > 0 && (
                              <span className="ml-2 min-w-[20px] h-5 rounded-full text-[11px] flex items-center justify-center text-white font-bold px-1.5" style={{ background: ORANGE }}>{chat.unread}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── STATUSES ── */}
            {tab === "statuses" && (
              <div className="animate-fade-in px-4 pt-6">
                <h1 className="text-2xl font-bold mb-5">Статусы</h1>
                <div className="flex items-center gap-3 mb-6 p-3 bg-white rounded-2xl shadow-sm">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: ORANGE }}>Я</div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white" style={{ background: ORANGE }}>
                      <Icon name="Plus" size={12} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Мой статус</div>
                    <div className="text-xs text-gray-400">Нажмите, чтобы добавить</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-semibold">Недавние обновления</div>
                <div className="space-y-1">
                  {STATUSES.map((s, i) => {
                    const contact = getContact(s.contactId);
                    return (
                      <button key={s.id} onClick={() => setViewStatus(contact)}
                        className="w-full flex items-center gap-3 py-3 hover:bg-orange-50 rounded-2xl px-2 transition-colors animate-fade-in"
                        style={{ animationDelay: `${i * 0.07}s` }}>
                        <div className={`p-0.5 rounded-full ${!s.seen ? "bg-gradient-to-br from-orange-400 to-orange-600" : "bg-gray-200"}`}>
                          <div className="bg-white p-0.5 rounded-full"><Avatar contact={contact} size={46} /></div>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-sm">{contact.name}</div>
                          <div className="text-xs text-gray-400">{s.time}</div>
                        </div>
                        {!s.seen && <div className="w-2.5 h-2.5 rounded-full" style={{ background: ORANGE }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── CALLS ── */}
            {tab === "calls" && (
              <div className="animate-fade-in">
                <div className="px-4 pt-6 pb-3 flex items-center justify-between">
                  <h1 className="text-2xl font-bold">Звонки</h1>
                  <button className="w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ background: ORANGE }}>
                    <Icon name="PhonePlus" size={16} />
                  </button>
                </div>
                <div>
                  {CALLS_DATA.map((call, i) => {
                    const contact = getContact(call.contactId);
                    const missed = !call.answered && call.type === "incoming";
                    return (
                      <div key={call.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-orange-50 animate-fade-in"
                        style={{ animationDelay: `${i * 0.05}s` }}>
                        <Avatar contact={contact} size={48} />
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold text-sm ${missed ? "text-red-500" : ""}`}>{contact.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Icon
                              name={call.type === "incoming" ? (call.answered ? "PhoneIncoming" : "PhoneMissed") : "PhoneOutgoing"}
                              size={12}
                              className={missed ? "text-red-400" : "text-green-500"}
                            />
                            <span className="text-xs text-gray-400">{call.date}{call.duration ? ` · ${call.duration}` : ""}</span>
                          </div>
                        </div>
                        <button onClick={() => startCall(contact)} className="w-9 h-9 rounded-full hover:bg-orange-50 flex items-center justify-center text-orange-500">
                          <Icon name="Phone" size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── CONTACTS ── */}
            {tab === "contacts" && (
              <div className="animate-fade-in">
                <div className="px-4 pt-6 pb-3">
                  <h1 className="text-2xl font-bold">Контакты</h1>
                </div>
                <div className="px-4 mb-4">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2.5">
                    <Icon name="Search" size={16} className="text-gray-400" />
                    <input placeholder="Найти контакт…" className="bg-transparent text-sm outline-none flex-1 placeholder-gray-400" />
                  </div>
                </div>
                <div>
                  {CONTACTS.map((contact, i) => (
                    <div key={contact.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-orange-50 animate-fade-in"
                      style={{ animationDelay: `${i * 0.05}s` }}>
                      <Avatar contact={contact} size={48} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{contact.name}</div>
                        <div className={`text-xs mt-0.5 ${contact.status === "online" ? "text-green-500" : "text-gray-400"}`}>{contact.about}</div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { switchTab("chats"); setOpenChat(CHATS.find(c => c.contactId === contact.id) || CHATS[0]); }}
                          className="w-9 h-9 rounded-full hover:bg-orange-50 flex items-center justify-center text-orange-500">
                          <Icon name="MessageCircle" size={16} />
                        </button>
                        <button onClick={() => startCall(contact)} className="w-9 h-9 rounded-full hover:bg-orange-50 flex items-center justify-center text-orange-500">
                          <Icon name="Phone" size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── PROFILE ── */}
            {tab === "profile" && (
              <div className="animate-fade-in">
                <div className="relative h-52 flex items-end px-5 pb-5"
                  style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, hsl(20 90% 40%) 100%)` }}>
                  <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
                  <div className="relative flex items-end gap-4">
                    <div className="w-20 h-20 rounded-2xl border-4 border-white flex items-center justify-center text-2xl font-black text-white shadow-xl"
                      style={{ background: "hsl(20 90% 40%)" }}>
                      {user.name ? user.name.slice(0, 2).toUpperCase() : "ВЫ"}
                    </div>
                    <div className="pb-1">
                      <div className="text-white text-xl font-bold">{user.name || "Вы"}</div>
                      <div className="text-white/70 text-sm">{user.phone} · ID {user.id}</div>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-5 space-y-3">
                  {[
                    { icon: "User", label: "Имя", value: user.name || "Не указано" },
                    { icon: "Phone", label: "Телефон", value: user.phone },
                    { icon: "Info", label: "О себе", value: "Привет! Я использую Андер 🧡" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-4 bg-white rounded-2xl px-4 py-4 shadow-sm">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(30 100% 92%)" }}>
                        <Icon name={item.icon} size={16} className="text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-400">{item.label}</div>
                        <div className="text-sm font-medium mt-0.5">{item.value}</div>
                      </div>
                      <Icon name="ChevronRight" size={16} className="text-gray-300" />
                    </div>
                  ))}
                  <button onClick={onLogout}
                    className="w-full flex items-center gap-4 bg-white rounded-2xl px-4 py-4 shadow-sm hover:bg-red-50 transition-colors group">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-50 group-hover:bg-red-100">
                      <Icon name="LogOut" size={16} className="text-red-500" />
                    </div>
                    <span className="text-sm font-medium text-red-500">Выйти из аккаунта</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── SETTINGS ── */}
            {tab === "settings" && (
              <div className="animate-fade-in px-4 pt-6 pb-8">
                <h1 className="text-2xl font-bold mb-5">Настройки</h1>
                <div className="space-y-4">
                  {[
                    {
                      section: "Уведомления", items: [
                        { icon: "Bell", label: "Push-уведомления", toggle: true, active: true },
                        { icon: "Phone", label: "Входящие звонки", toggle: true, active: true },
                        { icon: "Volume2", label: "Звуки сообщений", toggle: true, active: false },
                        { icon: "Vibrate", label: "Вибрация", toggle: true, active: true },
                      ]
                    },
                    {
                      section: "Приватность", items: [
                        { icon: "Eye", label: "Кто видит мой статус", toggle: false, value: "Все" },
                        { icon: "Clock", label: "Последний визит", toggle: false, value: "Мои контакты" },
                        { icon: "Lock", label: "Двойная аутентификация", toggle: true, active: false },
                      ]
                    },
                    {
                      section: "Оформление", items: [
                        { icon: "Sun", label: "Тема оформления", toggle: false, value: "Светлая" },
                        { icon: "Palette", label: "Основной цвет", toggle: false, value: "Оранжевый 🧡" },
                      ]
                    },
                  ].map((group) => (
                    <div key={group.section}>
                      <div className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-1 font-semibold">{group.section}</div>
                      <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
                        {group.items.map((item: { icon: string; label: string; toggle: boolean; active?: boolean; value?: string }) => (
                          <div key={item.label} className="flex items-center gap-3 px-4 py-3.5">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "hsl(30 100% 92%)" }}>
                              <Icon name={item.icon} size={16} className="text-orange-500" />
                            </div>
                            <span className="flex-1 text-sm font-medium">{item.label}</span>
                            {item.toggle ? (
                              <div className="relative w-11 h-6 rounded-full cursor-pointer transition-colors"
                                style={{ background: item.active ? ORANGE : "#E5E7EB" }}>
                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${item.active ? "translate-x-5 left-0.5" : "translate-x-0 left-0.5"}`} />
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">{item.value}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around bg-white border-t border-orange-100 py-2 z-30">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => switchTab(t.id)} className="flex flex-col items-center gap-0.5 px-2 py-1 relative">
                <div className={`relative w-8 h-8 flex items-center justify-center rounded-xl transition-all ${active ? "text-white" : "text-gray-400"}`}
                  style={active ? { background: ORANGE } : {}}>
                  <Icon name={t.icon} size={17} />
                  {t.id === "chats" && totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] flex items-center justify-center text-white font-bold bg-red-500">{totalUnread}</span>
                  )}
                </div>
                <span className={`text-[9px] font-medium ${active ? "text-orange-500" : "text-gray-400"}`}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}