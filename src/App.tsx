import { useRef, useState } from 'react'
import { Client, handle_file } from '@gradio/client'

export default function App() {
  const [script, setScript] = useState('')
  const [speed, setSpeed] = useState(0.96)
  const [voiceSample, setVoiceSample] = useState<File | null>(null)
  const [referenceText, setReferenceText] = useState('')
  const [generatedAudio, setGeneratedAudio] = useState('')
  const [recording, setRecording] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [consent, setConsent] = useState(false)
  const [notice, setNotice] = useState('')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const words = script.trim() ? script.trim().split(/\\s+/).length : 0

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      recorder.ondataavailable = event => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const file = new File(chunksRef.current, 'voice-reference.webm', { type: recorder.mimeType || 'audio/webm' })
        setVoiceSample(file)
        stream.getTracks().forEach(track => track.stop())
        setNotice('التسجيل جاهز. اكتب الكلام اللي قلته في التسجيل لتحسين تطابق الصوت.')
      }
      recorder.start()
      setRecording(true)
      setNotice('سجّل بصوت طبيعي وفي مكان هادئ، وبعدها اضغط إيقاف التسجيل.')
    } catch {
      setNotice('ماقدرتش أفتح الميكروفون. راجع إذن الميكروفون أو ارفع تسجيلًا جاهزًا.')
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    setRecording(false)
  }

  async function generate() {
    if (!script.trim()) {
      setNotice('اكتب النص اللي عايز تحوله لصوت.')
      return
    }
    if (!voiceSample) {
      setNotice('سجّل أو ارفع عيّنة من صوتك الأول.')
      return
    }
    if (!consent) {
      setNotice('أكد إن العينة صوتك أو عندك إذن باستخدامها.')
      return
    }

    setGenerating(true)
    setGeneratedAudio('')
    setNotice('جاري الاتصال بمحرك الصوت وتجهيز النتيجة. أول مرة ممكن تستغرق وقتًا أطول.')
    try {
      const client = await Client.connect('mohammedaly22/VoiceTut-TTS')
      const result = await client.predict('/synthesize', [
        script.trim(),
        'arz',
        'clone',
        '',
        handle_file(voiceSample),
        referenceText.trim(),
        48,
        2.5,
        speed,
        true,
      ])
      const resultData = result.data as unknown[]
      const file = resultData[0] as { url?: string; path?: string }
      const audioUrl = file?.url || file?.path
      if (!audioUrl) throw new Error('No audio file returned')
      setGeneratedAudio(audioUrl)
      setNotice('الصوت اتولد. اسمعه هنا أو نزّله على جهازك.')
    } catch {
      setNotice('ماقدرناش نولّد الصوت دلوقتي. جرّب تاني بعد شوية؛ ممكن المحرك يكون نايم أو مشغول.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brandmark">S</div>
        <div className="brand"><strong>SELO <span>VOICE ACTOR</span></strong><small>استوديو الراوي الذكي</small></div>
        <div className="status"><i /> توليد AI</div>
      </header>

      <section className="hero">
        <div className="eyebrow">YOUR VOICE. YOUR STORY.</div>
        <h1>خلّي الحكاية <em>تتنطق</em>.</h1>
        <p>حوّل نصك لصوت مصري باستخدام عيّنة من صوتك، واسمع النتيجة من نفس التطبيق.</p>
      </section>

      <section className="panel script-panel">
        <div className="section-head"><div><span className="step">01</span><h2>النص الصوتي</h2></div><span className="counter">{words} كلمة</span></div>
        <textarea value={script} onChange={e => setScript(e.target.value)} placeholder="اكتب هنا نص الحكاية أو التعليق الصوتي..." />
        <div className="hint">علامات الترقيم بتساعد على وقفات طبيعية أثناء الإلقاء.</div>
      </section>

      <section className="panel">
        <div className="section-head"><div><span className="step">02</span><h2>بصمة صوتك</h2></div></div>
        <p className="hint voice-intro">سجّل بصوتك أو ارفع تسجيلًا واضحًا. اختار مكانًا هادئًا واتكلم بطبيعتك؛ من 10 إلى 20 ثانية مناسبة كبداية.</p>
        <div className="record-row">
          <button className="secondary" type="button" onClick={recording ? stopRecording : startRecording}>{recording ? '■ إيقاف التسجيل' : '🎙️ سجّل صوتك'}</button>
          <label className="secondary upload-label">📁 ارفع تسجيلًا<input type="file" accept="audio/*" onChange={e => { setVoiceSample(e.target.files?.[0] ?? null); setNotice(e.target.files?.[0] ? 'تم اختيار التسجيل.' : '') }} /></label>
        </div>
        {voiceSample && <div className="file-row"><span>العينة: {voiceSample.name}</span><button type="button" className="text-button" onClick={() => setVoiceSample(null)}>حذف</button></div>}
        <label className="field-label ref-label" htmlFor="reference-text">الكلام الموجود في التسجيل</label>
        <textarea id="reference-text" className="reference-text" value={referenceText} onChange={e => setReferenceText(e.target.value)} placeholder="اكتب الجملة اللي قلتها في التسجيل؛ ده بيساعد على نتيجة أدق. ممكن تسيبه فاضي." />
        <label className="consent-row"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>العينة صوتي، أو عندي إذن صريح من صاحب الصوت لاستخدامها.</span></label>
        <p className="privacy-note">عند التوليد، التسجيل والنص يُرسلان إلى VoiceTut على Hugging Face لإنتاج الصوت. لا ترفع تسجيلًا خاصًا أو صوت شخص آخر من دون إذنه.</p>
      </section>

      <section className="panel">
        <div className="section-head"><div><span className="step">03</span><h2>ضبط الإلقاء</h2></div></div>
        <div className="range-row"><div><label htmlFor="speed">سرعة الإلقاء</label><b>{speed.toFixed(2)}×</b></div><input id="speed" type="range" min="0.7" max="1.3" step="0.01" value={speed} onChange={e => setSpeed(Number(e.target.value))} /></div>
        <p className="hint">توليد الصوت يتم بمحرك VoiceTut، مش بأصوات الكمبيوتر. تقدر تغيّر السرعة وتولّد النتيجة تاني.</p>
      </section>

      <section className="action-area">
        <button className="primary" type="button" onClick={generate} disabled={generating}>{generating ? '⏳ جاري توليد صوتك…' : '▶ توليد الصوت بصمتي'}</button>
        <p className="notice" aria-live="polite">{notice || 'سجّل عيّنتك واكتب النص لبدء التوليد.'}</p>
        {generatedAudio && <div className="result panel"><h2>النتيجة</h2><audio controls src={generatedAudio} /><a className="download-link" href={generatedAudio} download="selo-voice.wav">تنزيل الملف الصوتي</a></div>}
      </section>

      <footer><span>SELO VOICE ACTOR AI</span><span>صُنع للحكايات اللي تستاهل تتسمع</span></footer>
    </main>
  )
}
