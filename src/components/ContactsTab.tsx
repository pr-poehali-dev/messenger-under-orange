import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const CONTACTS_URL = "https://functions.poehali.dev/ba9fafdc-573b-455c-ad2d-c27a0fdf42a2";
const ORANGE = "hsl(25 95% 53%)";

interface RealContact {
  id: number;
  name: string;
  phone: string;
  about: string;
  avatar_url: string;
  nickname: string;
}

interface FoundUser {
  id: number;
  name: string;
  phone: string;
  about: string;
  avatar_url: string;
}

function Avatar({ name, phone, avatarUrl, size = 48 }: { name: string; phone: string; avatarUrl?: string; size?: number }) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : phone.slice(-2);
  const colors = ["#FF6B2B", "#9B59B6", "#E74C3C", "#2ECC71", "#3498DB", "#F39C12", "#1ABC9C", "#E67E22"];
  const color = colors[(phone.charCodeAt(phone.length - 1) || 0) % colors.length];
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={name} className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.33 }}>
      {initials}
    </div>
  );
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) return `+${d[0]} (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7,9)}-${d.slice(9)}`;
  return phone;
}

export default function ContactsTab({
  token,
  onStartChat,
  onCall,
}: {
  token: string;
  onStartChat: (contact: RealContact) => void;
  onCall: (contact: RealContact) => void;
}) {
  const [contacts, setContacts] = useState<RealContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addPhone, setAddPhone] = useState("");
  const [addNickname, setAddNickname] = useState("");
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [foundInContacts, setFoundInContacts] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => { loadContacts(); }, []);

  async function loadContacts() {
    setLoading(true);
    try {
      const res = await fetch(CONTACTS_URL, { headers: { "X-Auth-Token": token } });
      const raw = await res.text();
      const data = JSON.parse(raw);
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      setContacts(parsed.contacts || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function formatAddPhone(val: string) {
    const digits = val.replace(/\D/g, "");
    if (!digits) return "";
    let d = digits;
    if (d.startsWith("8")) d = "7" + d.slice(1);
    if (!d.startsWith("7")) d = "7" + d;
    d = d.slice(0, 11);
    let result = "+7";
    if (d.length > 1) result += " (" + d.slice(1, 4);
    if (d.length >= 4) result += ") " + d.slice(4, 7);
    if (d.length >= 7) result += "-" + d.slice(7, 9);
    if (d.length >= 9) result += "-" + d.slice(9, 11);
    return result;
  }

  async function searchUser() {
    setSearchError("");
    setFoundUser(null);
    if (addPhone.replace(/\D/g, "").length < 11) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`${CONTACTS_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ phone: addPhone }),
      });
      const raw = await res.text();
      const data = JSON.parse(raw);
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (!res.ok) { setSearchError(parsed.error || "Пользователь не найден"); return; }
      setFoundUser(parsed.user);
      setFoundInContacts(parsed.in_contacts);
    } catch {
      setSearchError("Ошибка поиска");
    } finally {
      setSearchLoading(false);
    }
  }

  async function addContact() {
    if (!foundUser) return;
    setAddLoading(true);
    try {
      await fetch(`${CONTACTS_URL}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ user_id: foundUser.id, nickname: addNickname }),
      });
      await loadContacts();
      setShowAdd(false);
      setAddPhone("");
      setAddNickname("");
      setFoundUser(null);
    } catch {
      // ignore
    } finally {
      setAddLoading(false);
    }
  }

  async function removeContact(userId: number) {
    await fetch(`${CONTACTS_URL}/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token },
      body: JSON.stringify({ user_id: userId }),
    });
    setContacts((prev) => prev.filter((c) => c.id !== userId));
  }

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (c.nickname || c.name).toLowerCase().includes(q) || c.phone.includes(q);
  });

  return (
    <div className="animate-fade-in flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Контакты</h1>
        <button onClick={() => { setShowAdd(true); setFoundUser(null); setSearchError(""); setAddPhone(""); setAddNickname(""); }}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md"
          style={{ background: ORANGE }}>
          <Icon name="UserPlus" size={17} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2.5">
          <Icon name="Search" size={16} className="text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени или номеру…"
            className="bg-transparent text-sm outline-none flex-1 placeholder-gray-400" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-3 px-4 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-32" />
                  <div className="h-2 bg-gray-100 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-orange-50">
              <Icon name="Users" size={28} className="text-orange-300" />
            </div>
            <div className="font-semibold text-gray-600 mb-1">
              {search ? "Никого не нашли" : "Контактов пока нет"}
            </div>
            <div className="text-sm text-gray-400">
              {search ? "Попробуйте другой запрос" : "Нажмите + чтобы добавить первый контакт"}
            </div>
          </div>
        ) : (
          <div>
            {filtered.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-orange-50 animate-fade-in group"
                style={{ animationDelay: `${i * 0.04}s` }}>
                <Avatar name={c.nickname || c.name} phone={c.phone} avatarUrl={c.avatar_url} size={50} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{c.nickname || c.name || formatPhone(c.phone)}</div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">
                    {c.nickname && c.name ? c.name + " · " : ""}{formatPhone(c.phone)}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onStartChat(c)}
                    className="w-9 h-9 rounded-full hover:bg-orange-50 flex items-center justify-center text-orange-400 transition-colors">
                    <Icon name="MessageCircle" size={17} />
                  </button>
                  <button onClick={() => onCall(c)}
                    className="w-9 h-9 rounded-full hover:bg-orange-50 flex items-center justify-center text-orange-400 transition-colors">
                    <Icon name="Phone" size={17} />
                  </button>
                  <button onClick={() => removeContact(c.id)}
                    className="w-9 h-9 rounded-full hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                    <Icon name="Trash2" size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add contact modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-t-3xl md:rounded-3xl p-6 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Добавить контакт</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* Phone input */}
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Номер телефона</label>
              <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3 border border-orange-100">
                <span className="text-lg">🇷🇺</span>
                <input
                  value={addPhone}
                  onChange={(e) => {
                    setAddPhone(formatAddPhone(e.target.value));
                    setFoundUser(null);
                    setSearchError("");
                  }}
                  onBlur={searchUser}
                  placeholder="+7 (999) 123-45-67"
                  type="tel"
                  className="flex-1 bg-transparent text-sm outline-none"
                  autoFocus
                />
                {searchLoading && <span className="w-4 h-4 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />}
              </div>
            </div>

            {/* Search result */}
            {searchError && (
              <div className="flex items-center gap-2 text-red-500 text-sm mb-3 px-1">
                <Icon name="AlertCircle" size={13} />
                {searchError}
              </div>
            )}

            {foundUser && (
              <div className="bg-orange-50 rounded-2xl p-3 mb-3 flex items-center gap-3">
                <Avatar name={foundUser.name} phone={foundUser.phone} avatarUrl={foundUser.avatar_url} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{foundUser.name || "Пользователь Андера"}</div>
                  <div className="text-xs text-gray-400">{formatPhone(foundUser.phone)}</div>
                  {foundUser.about && <div className="text-xs text-gray-500 truncate mt-0.5">{foundUser.about}</div>}
                </div>
                {foundInContacts && (
                  <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                    <Icon name="Check" size={12} /> В контактах
                  </span>
                )}
              </div>
            )}

            {/* Nickname */}
            {foundUser && !foundInContacts && (
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-1 block">Имя в контактах (необязательно)</label>
                <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3 border border-orange-100">
                  <Icon name="User" size={15} className="text-gray-400" />
                  <input
                    value={addNickname}
                    onChange={(e) => setAddNickname(e.target.value)}
                    placeholder={foundUser.name || "Имя контакта"}
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
            )}

            <button
              onClick={addContact}
              disabled={!foundUser || foundInContacts || addLoading}
              className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: ORANGE }}>
              {addLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Добавляем…
                </span>
              ) : foundInContacts ? "Уже в контактах" : "Добавить контакт"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
