import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const AUTH_SEND_URL = "https://functions.poehali.dev/6bc7d2c4-92d6-4551-81cd-b05fff46aad1";
const AUTH_VERIFY_URL = "https://functions.poehali.dev/a89fd5af-c2a8-44c6-b3a8-052d99849ab2";
const PROFILE_UPDATE_URL = "https://functions.poehali.dev/f5f9b956-96be-41f4-ad2d-24aa4ceafe01";

const ORANGE = "hsl(25 95% 53%)";

type Step = "phone" | "code" | "name";

interface AuthScreenProps {
  onAuth: (token: string, user: { id: number; phone: string; name: string }) => void;
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);
  const [pendingToken, setPendingToken] = useState("");
  const [pendingUser, setPendingUser] = useState<{ id: number; phone: string; name: string } | null>(null);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startResendTimer() {
    setResendTimer(60);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
  }

  function formatPhone(val: string) {
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

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(formatPhone(e.target.value));
    setError("");
  }

  async function sendCode() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(AUTH_SEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = JSON.parse(await res.text());
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (!res.ok) { setError(parsed.error || "Ошибка отправки"); return; }
      if (parsed.dev_code) setDevCode(parsed.dev_code);
      startResendTimer();
      setStep("code");
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } catch {
      setError("Не удалось отправить код. Проверьте соединение.");
    } finally {
      setLoading(false);
    }
  }

  function handleCodeInput(idx: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[idx] = digit;
    setCode(newCode);
    setError("");
    if (digit && idx < 5) {
      codeRefs.current[idx + 1]?.focus();
    }
    if (newCode.every((d) => d !== "")) {
      verifyCode(newCode.join(""));
    }
  }

  function handleCodeKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
  }

  function handleCodePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      const arr = text.split("");
      setCode(arr);
      verifyCode(text);
    }
  }

  async function verifyCode(codeStr: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(AUTH_VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: codeStr }),
      });
      const raw = await res.text();
      const data = typeof JSON.parse(raw) === "string" ? JSON.parse(JSON.parse(raw)) : JSON.parse(raw);
      if (!res.ok) { setError(data.error || "Неверный код"); setCode(["", "", "", "", "", ""]); setTimeout(() => codeRefs.current[0]?.focus(), 50); return; }
      if (data.is_new) {
        setIsNewUser(true);
        setPendingToken(data.token);
        setPendingUser(data.user);
        setStep("name");
        return;
      }
      onAuth(data.token, data.user);
    } catch {
      setError("Ошибка проверки кода.");
    } finally {
      setLoading(false);
    }
  }

  async function submitName() {
    if (!pendingToken || !pendingUser) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(PROFILE_UPDATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": pendingToken },
        body: JSON.stringify({ name, about: "Привет! Я использую Андер 🧡" }),
      });
      const raw = await res.text();
      const data = typeof JSON.parse(raw) === "string" ? JSON.parse(JSON.parse(raw)) : JSON.parse(raw);
      if (!res.ok) { setError(data.error || "Ошибка"); return; }
      onAuth(pendingToken, { ...pendingUser, name });
    } catch {
      setError("Ошибка. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: "hsl(25 100% 97%)" }}>
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"
        style={{ background: ORANGE }} />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 translate-y-1/2 -translate-x-1/2"
        style={{ background: ORANGE }} />

      {/* Logo */}
      <div className="flex flex-col items-center mb-10 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4 shadow-xl"
          style={{ background: ORANGE }}>
          <span className="text-white font-black text-4xl">А</span>
        </div>
        <h1 className="text-3xl font-black" style={{ color: "hsl(20 15% 12%)" }}>Андер</h1>
        <p className="text-gray-400 text-sm mt-1">Мессенджер нового поколения</p>
      </div>

      <div className="w-full max-w-sm animate-scale-in">
        {/* STEP: Phone */}
        {step === "phone" && (
          <div>
            <h2 className="text-xl font-bold text-center mb-1">Войти в аккаунт</h2>
            <p className="text-gray-400 text-sm text-center mb-6">Введите номер телефона — отправим код</p>

            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-4 shadow-sm border border-orange-100 mb-3">
              <div className="text-2xl">🇷🇺</div>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+7 (999) 123-45-67"
                className="flex-1 text-base outline-none bg-transparent font-medium"
                style={{ color: "hsl(20 15% 12%)" }}
                onKeyDown={(e) => e.key === "Enter" && phone.replace(/\D/g, "").length === 11 && sendCode()}
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm mb-3 px-1">
                <Icon name="AlertCircle" size={14} />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={sendCode}
              disabled={loading || phone.replace(/\D/g, "").length < 11}
              className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              style={{ background: ORANGE }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Отправляем…
                </span>
              ) : "Получить код →"}
            </button>

            <p className="text-center text-xs text-gray-400 mt-4">
              Нажимая кнопку, вы соглашаетесь с условиями использования
            </p>
          </div>
        )}

        {/* STEP: Code */}
        {step === "code" && (
          <div>
            <button onClick={() => { setStep("phone"); setCode(["", "", "", "", "", ""]); setError(""); }}
              className="flex items-center gap-1 text-orange-500 text-sm mb-4">
              <Icon name="ArrowLeft" size={14} /> Изменить номер
            </button>

            <h2 className="text-xl font-bold text-center mb-1">Введите код</h2>
            <p className="text-gray-400 text-sm text-center mb-2">
              Отправили SMS на <span className="font-medium text-gray-700">{phone}</span>
            </p>

            {devCode && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 mb-4 text-center">
                <span className="text-xs text-orange-600">Режим разработки — код: </span>
                <span className="font-bold text-orange-700 text-lg">{devCode}</span>
              </div>
            )}

            <div className="flex gap-2 justify-center mb-4" onPaste={handleCodePaste}>
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { codeRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeInput(idx, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                  className="w-12 h-14 text-center text-xl font-bold rounded-2xl border-2 outline-none transition-all bg-white"
                  style={{
                    borderColor: digit ? ORANGE : "hsl(25 20% 88%)",
                    color: "hsl(20 15% 12%)",
                    boxShadow: digit ? `0 0 0 3px hsl(25 95% 53% / 0.15)` : "none",
                  }}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm mb-3 px-1 justify-center">
                <Icon name="AlertCircle" size={14} />
                <span>{error}</span>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center gap-2 text-orange-500 text-sm mb-3">
                <span className="w-4 h-4 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                Проверяем код…
              </div>
            )}

            <div className="text-center mt-2">
              {resendTimer > 0 ? (
                <span className="text-gray-400 text-sm">Повторный код через {resendTimer} сек</span>
              ) : (
                <button onClick={sendCode} className="text-orange-500 text-sm font-medium hover:underline">
                  Отправить код повторно
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP: Name (new user) */}
        {step === "name" && (
          <div>
            <h2 className="text-xl font-bold text-center mb-1">Добро пожаловать!</h2>
            <p className="text-gray-400 text-sm text-center mb-6">Введите ваше имя для профиля</p>

            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-4 shadow-sm border border-orange-100 mb-3">
              <Icon name="User" size={20} className="text-orange-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
                className="flex-1 text-base outline-none bg-transparent font-medium"
                onKeyDown={(e) => e.key === "Enter" && name.trim() && submitName()}
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm mb-3 px-1">
                <Icon name="AlertCircle" size={14} />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={submitName}
              disabled={loading || !name.trim()}
              className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              style={{ background: ORANGE }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Входим…
                </span>
              ) : "Начать общение →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}