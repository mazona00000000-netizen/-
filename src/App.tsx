import { useEffect, useMemo, useState } from 'react'

type SpeechVoice = SpeechSynthesisVoice

const emotions = [
  { id: 'calm', label: 'هادئ', icon: '🌙' },
  { id: 'sad', label: 'حزين', icon: '💧' },
  { id: 'angry', label: 'غاضب', icon: '🔥' },
  { id: 'suspense', label: 'تشويق', icon: '🎬' },
  { id: 'warm', label: 'دافئ', icon: '🤎' },
]

export default function App() {
  const [script, setScript] = useState('')
  const [emotion, setEmotion] = useState('calm')
  const [speed, setSpeed] = useState(0.92)
  const [pitch, setPitch] = useState(0.88)
  const [voiceName, setVoiceName] = useState('')
  const [voices, setVoices] = useState<SpeechVoice[]>([])
  const [speaking, setSpeaking] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis?.getVoices() ?? []
      setVoices(all)
      if (!voiceName) {
        const arabic = all.find(v => v.lang.toLowerCase().startsWith('ar-EG')) ??
          all.find(v => v.lang.toLowerCase().startsWith('ar'))
        if (arabic) setVoiceName(arabic.name)
      }
    }
    load()
    window.speechSynthesis?.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load)
  }, [voiceName])

  const arabicVoices = useMemo(() => voices.filter(v => v.lang.toLowerCase().startsWith('ar')), [voices])
  const words = script.trim() ? script.trim().split(/\s+/).length : 0

  function preview() {
    if (!script.trim()) {
      setNotice('اكتب النص الأول علشان نقدر نجرب الأداء.')
      return
    }
    if (!('speechSynthesis' in window)) {
      setNotice('المتصفح الحالي لا يدعم تجربة الصوت. افتح التطبيق من Chrome.')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(script)
    const chosen = voices.find(v => v.name === voiceName)
    if (chosen) utterance.voice = chosen
    utterance.lang = chosen?.lang ?? 'ar-EG'
    utterance.rate = speed
    utterance.pitch = pitch
    utterance.volume = 1
    utterance.onstart = () => { setSpeaking(true); setNotice('تجربة صوتية من أصوات جهازك — ليست توليد AI بعد.') }
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => { setSpeaking(false); setNotice('تعذر تشغيل الصوت. جرّب صوتًا آخر أو متصفح Chrome.') }
    window.speechSynthesis.speak(utterance)
  }

  function stop() {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
    setNotice('تم إيقاف المعاينة.')
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brandmark">S</div>
        <div className="brand"><strong>SELO <span>VOICE ACTOR</span></strong><small>استوديو الراوي الذكي</small></div>
        <div className="status"><i /> نسخة تجريبية</div>
      </header>

      <section className="hero">
        <div className="eyebrow">YOUR VOICE. YOUR STORY.</div>
        <h1>خلّي الحكاية <em>تتنطق</em>.</h1>
        <p>استوديو للتعليق الصوتي باللهجة المصرية، بتحكم في الإحساس وطريقة الإلقاء.</p>
      </section>

      <section className="panel script-panel">
        <div className="section-head"><div><span className="step">01</span><h2>النص الصوتي</h2></div><span className="counter">{words} كلمة</span></div>
        <textarea value={script} onChange={e => setScript(e.target.value)} placeholder="اكتب هنا نص الحكاية أو التعليق الصوتي..." />
        <div className="hint">اكتب النص بعلامات الترقيم؛ هتساعد على وقفات طبيعية أثناء الإلقاء.</div>
      </section>

      <section className="panel">
        <div className="section-head"><div><span className="step">02</span><h2>اختار الإحساس</h2></div></div>
        <div className="emotion-grid">
          {emotions.map(item => <button key={item.id} className={emotion === item.id ? 'emotion active' : 'emotion'} onClick={() => setEmotion(item.id)}><span>{item.icon}</span>{item.label}</button>)}
        </div>
        <p className="hint">اختيار الإحساس محفوظ في إعدادات المشروع حاليًا؛ ربطه بمحرك أداء AI هيكون في المرحلة التالية.</p>
      </section>

      <section className="panel">
        <div className="section-head"><div><span className="step">03</span><h2>ضبط الصوت</h2></div></div>
        <label className="field-label" htmlFor="voice">الصوت المتاح على جهازك</label>
        <select id="voice" value={voiceName} onChange={e => setVoiceName(e.target.value)}>
          <option value="">الصوت العربي الافتراضي</option>
          {arabicVoices.map(v => <option key={v.name} value={v.name}>{v.name} — {v.lang}</option>)}
        </select>
        <div className="range-row"><div><label>سرعة الإلقاء</label><b>{speed.toFixed(2)}×</b></div><input type="range" min="0.65" max="1.25" step="0.01" value={speed} onChange={e => setSpeed(Number(e.target.value))} /></div>
        <div className="range-row"><div><label>حدة الصوت</label><b>{pitch.toFixed(2)}</b></div><input type="range" min="0.6" max="1.25" step="0.01" value={pitch} onChange={e => setPitch(Number(e.target.value))} /></div>
      </section>

      <section className="action-area">
        <button className="primary" onClick={speaking ? stop : preview}>{speaking ? '■ إيقاف المعاينة' : '▶ تجربة الأداء الصوتي'}</button>
        <p className="notice" aria-live="polite">{notice || 'المعاينة الحالية تستخدم الأصوات المثبتة على هاتفك.'}</p>
      </section>

      <footer><span>SELO VOICE ACTOR AI</span><span>صُنع للحكايات اللي تستاهل تتسمع</span></footer>
    </main>
  )
}