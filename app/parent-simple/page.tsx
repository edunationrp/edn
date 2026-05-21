'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

// Langues supportées
type Language = 'fr' | 'moore' | 'dioula' | 'fulfude'

const TRANSLATIONS: Record<Language, {
  title: string
  subtitle: string
  enterCode: string
  myChildren: string
  grades: string
  attendance: string
  payments: string
  messages: string
  listen: string
  backHome: string
  loading: string
  notFound: string
  placeholder: string
  validate: string
  welcome: string
}> = {
  fr: {
    title: 'EduNation',
    subtitle: 'Suivi scolaire de votre enfant',
    enterCode: 'Entrez votre code parent',
    myChildren: 'Mes enfants',
    grades: 'Notes',
    attendance: 'Absences',
    payments: 'Paiements',
    messages: 'Messages',
    listen: 'Écouter',
    backHome: 'Retour',
    loading: 'Chargement...',
    notFound: 'Code introuvable',
    placeholder: 'Code à 6 chiffres',
    validate: 'Valider',
    welcome: 'Bonjour',
  },
  moore: {
    title: 'EduNation',
    subtitle: 'Y noor biiga yaarã',
    enterCode: 'Lebg fo code',
    myChildren: 'M biisi',
    grades: 'Tõodo',
    attendance: 'Yiibli',
    payments: 'Payer',
    messages: 'Mesaʒ',
    listen: 'Kelg',
    backHome: 'Zĩig',
    loading: 'Rakda...',
    notFound: 'Code ka be',
    placeholder: 'Code (6)',
    validate: 'Sak',
    welcome: 'Zabre',
  },
  dioula: {
    title: 'EduNation',
    subtitle: 'I denmisen ka kalansen kɔlɔsili',
    enterCode: 'I ka code dɔn',
    myChildren: 'N denw',
    grades: 'Kɛmɛli',
    attendance: 'Taa bɔ',
    payments: 'Sara',
    messages: 'Maanw',
    listen: 'Lamɛn',
    backHome: 'Kɔsɛgɛn',
    loading: 'Ɲini...',
    notFound: 'Code ma sɔrɔ',
    placeholder: 'Code (6)',
    validate: 'Sɛbɛn',
    welcome: 'I ni sɔgɔma',
  },
  fulfude: {
    title: 'EduNation',
    subtitle: "Tiitoonde karallaagal ɓiɗɗo maa",
    enterCode: 'Naatnu code maa',
    myChildren: 'Ɓiɓɓe am',
    grades: 'Jiiɓirɗe',
    attendance: 'Yewtirde',
    payments: 'Liggorde',
    messages: 'Tiitoonde',
    listen: 'Heɗo',
    backHome: 'Rewrude',
    loading: 'Yiɗude...',
    notFound: 'Code walaa',
    placeholder: 'Code (6)',
    validate: 'Jaɓɓa',
    welcome: 'Jam waali',
  },
}

const LANG_OPTIONS: { code: Language; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'moore', label: 'Mooré', flag: '🇧🇫' },
  { code: 'dioula', label: 'Dioula', flag: '🇧🇫' },
  { code: 'fulfude', label: 'Fulfuldé', flag: '🇧🇫' },
]

type Screen = 'login' | 'home' | 'grades' | 'attendance' | 'payments' | 'messages'

type ChildInfo = {
  id: string
  first_name: string
  last_name: string
  iun: string | null
  status: string
}

export default function ParentSimplePage() {
  const supabase = createClient()
  const [lang, setLang] = useState<Language>('fr')
  const [screen, setScreen] = useState<Screen>('login')
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [parentName, setParentName] = useState('')
  const [children, setChildren] = useState<ChildInfo[]>([])
  const [selectedChild, setSelectedChild] = useState<ChildInfo | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  const t = TRANSLATIONS[lang]

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis
    }
  }, [])

  function speak(text: string) {
    if (!synthRef.current) return
    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'fr-FR'
    utterance.rate = 0.85
    utterance.pitch = 1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    synthRef.current.speak(utterance)
  }

  function stopSpeaking() {
    synthRef.current?.cancel()
    setIsSpeaking(false)
  }

  async function handleLogin() {
    if (code.length < 4) return
    setIsLoading(true)
    setError('')

    // Chercher le parent par code simple (6 premiers caractères du user ID ou code spécial)
    const { data: profilesRaw } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .ilike('id', `${code}%`)
      .limit(1)

    const profiles = profilesRaw as Array<{ id: string; first_name: string; last_name: string }> | null

    if (!profiles || profiles.length === 0) {
      setError(t.notFound)
      setIsLoading(false)
      return
    }

    const parent = profiles[0]
    setParentName(`${parent.first_name} ${parent.last_name}`)

    // Charger les enfants
    const { data: relationsRaw } = await supabase
      .from('parent_student_relations')
      .select('student_id')
      .eq('parent_user_id', parent.id)

    const relations = relationsRaw as Array<{ student_id: string }> | null
    const studentIds = (relations ?? []).map(r => r.student_id)

    if (studentIds.length > 0) {
      const { data: studentsRaw } = await supabase
        .from('students')
        .select('id, first_name, last_name, iun, status')
        .in('id', studentIds)
      setChildren((studentsRaw as ChildInfo[] | null) ?? [])
    }

    setScreen('home')
    setIsLoading(false)
    speak(`${t.welcome} ! ${t.myChildren}: ${children.length}`)
  }

  function goToScreen(s: Screen, child?: ChildInfo) {
    if (child) setSelectedChild(child)
    setScreen(s)
  }

  // Écran de connexion
  if (screen === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary to-primary/80 flex flex-col">
        {/* Sélecteur de langue */}
        <div className="flex justify-center gap-2 pt-4 px-4">
          {LANG_OPTIONS.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                lang === l.code ? 'bg-white text-primary' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Logo */}
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6 shadow-xl">
            <span className="text-3xl font-black text-primary">EN</span>
          </div>

          <h1 className="text-3xl font-black text-white mb-2 text-center">{t.title}</h1>
          <p className="text-white/80 text-center mb-10 text-lg">{t.subtitle}</p>

          {/* Entrée du code */}
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl">
            <p className="text-center font-bold text-gray-700 mb-4 text-lg">{t.enterCode}</p>

            {/* Clavier numérique grand format */}
            <div className="text-center mb-4">
              <input
                type="tel"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t.placeholder}
                className="w-full text-center text-3xl font-mono font-bold border-b-2 border-primary bg-transparent outline-none py-2 tracking-widest"
                inputMode="numeric"
                maxLength={6}
              />
            </div>

            {/* Pad numérique */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((key, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (key === '⌫') setCode(prev => prev.slice(0, -1))
                    else if (key !== '' && code.length < 6) setCode(prev => prev + key.toString())
                  }}
                  className={`h-14 rounded-2xl text-xl font-bold transition-all ${
                    key === '⌫' ? 'bg-red-100 text-red-600 active:bg-red-200' :
                    key === '' ? '' :
                    'bg-gray-100 text-gray-800 active:bg-primary/10 active:scale-95'
                  }`}
                  disabled={key === ''}
                >
                  {key}
                </button>
              ))}
            </div>

            {error && (
              <p className="text-red-500 text-center text-sm mb-3 font-medium">{error}</p>
            )}

            <button
              onClick={handleLogin}
              disabled={code.length < 4 || isLoading}
              className="w-full h-14 bg-primary text-white rounded-2xl font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-lg"
            >
              {isLoading ? t.loading : t.validate}
            </button>
          </div>

          {/* Bouton audio */}
          <button
            onClick={() => speak(t.enterCode)}
            className="mt-6 flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-3 rounded-full font-medium transition-all text-lg"
          >
            🔊 {t.listen}
          </button>
        </div>
      </div>
    )
  }

  const MENU_ITEMS: { screen: Screen; icon: string; label: string; color: string; description: string }[] = [
    { screen: 'grades', icon: '📊', label: t.grades, color: 'from-blue-500 to-blue-600', description: 'Voir les notes' },
    { screen: 'attendance', icon: '📅', label: t.attendance, color: 'from-orange-500 to-orange-600', description: 'Voir les absences' },
    { screen: 'payments', icon: '💰', label: t.payments, color: 'from-green-500 to-green-600', description: 'Frais scolaires' },
    { screen: 'messages', icon: '✉️', label: t.messages, color: 'from-purple-500 to-purple-600', description: 'Lire les messages' },
  ]

  // Écran principal
  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-primary text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">{t.welcome}</p>
              <h1 className="text-2xl font-black">{parentName}</h1>
            </div>
            <button
              onClick={() => speak(`${t.welcome} ${parentName}. ${t.myChildren}: ${children.map(c => `${c.first_name} ${c.last_name}`).join(', ')}`)}
              className="bg-white/20 rounded-full p-3 active:bg-white/30 transition-all"
            >
              🔊
            </button>
          </div>

          {/* Sélecteur enfants */}
          {children.length > 0 && (
            <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
              {children.map(child => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all ${
                    selectedChild?.id === child.id ? 'bg-white text-primary font-bold' : 'bg-white/20 text-white'
                  }`}
                >
                  <span className="text-2xl">👦</span>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{child.first_name}</p>
                    <p className="text-xs opacity-80">{child.last_name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grille menu */}
        <div className="flex-1 p-5 grid grid-cols-2 gap-4 content-start">
          {MENU_ITEMS.map(item => (
            <button
              key={item.screen}
              onClick={() => {
                goToScreen(item.screen, selectedChild ?? undefined)
                speak(item.label)
              }}
              className={`bg-gradient-to-br ${item.color} text-white rounded-3xl p-5 flex flex-col items-center justify-center gap-2 min-h-[120px] shadow-lg active:scale-95 transition-all`}
            >
              <span className="text-4xl">{item.icon}</span>
              <span className="font-bold text-lg">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Sélecteur langue */}
        <div className="flex justify-center gap-2 p-4">
          {LANG_OPTIONS.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                lang === l.code ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
              }`}
            >
              {l.flag}
            </button>
          ))}
        </div>

        {/* Déconnexion */}
        <button
          onClick={() => { setScreen('login'); setCode(''); setChildren([]); stopSpeaking() }}
          className="mx-5 mb-5 py-3 rounded-2xl border-2 border-gray-200 text-gray-500 font-medium active:bg-gray-50 transition-all"
        >
          ← {t.backHome}
        </button>
      </div>
    )
  }

  // Écrans de détail
  const screenTitles: Record<Screen, string> = {
    login: '',
    home: '',
    grades: `${t.grades} — ${selectedChild?.first_name ?? ''}`,
    attendance: `${t.attendance} — ${selectedChild?.first_name ?? ''}`,
    payments: `${t.payments} — ${selectedChild?.first_name ?? ''}`,
    messages: t.messages,
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-primary text-white px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => setScreen('home')}
          className="bg-white/20 rounded-full p-2.5 active:bg-white/30 transition-all"
        >
          ←
        </button>
        <h1 className="text-xl font-bold flex-1">{screenTitles[screen]}</h1>
        <button
          onClick={() => speak(screenTitles[screen])}
          className="bg-white/20 rounded-full p-2.5 active:bg-white/30 transition-all"
        >
          🔊
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        {screen === 'grades' && (
          <div className="text-center space-y-4 w-full">
            <div className="text-8xl">📊</div>
            <p className="text-xl font-bold text-gray-700">Notes de {selectedChild?.first_name}</p>
            <div className="bg-white rounded-3xl p-6 shadow-sm border space-y-3">
              <p className="text-gray-500 text-sm">Contactez l&apos;établissement pour les notes</p>
              <p className="font-mono text-lg font-bold text-primary">{selectedChild?.iun ?? '—'}</p>
            </div>
            <button
              onClick={() => speak(`Notes de ${selectedChild?.first_name}. Contactez l'établissement avec le code ${selectedChild?.iun}`)}
              className="bg-primary text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all w-full"
            >
              🔊 {t.listen}
            </button>
          </div>
        )}

        {screen === 'attendance' && (
          <div className="text-center space-y-4 w-full">
            <div className="text-8xl">📅</div>
            <p className="text-xl font-bold text-gray-700">Absences de {selectedChild?.first_name}</p>
            <div className="bg-green-50 rounded-3xl p-6 border border-green-200 space-y-2">
              <div className="text-4xl">✅</div>
              <p className="font-bold text-green-800">Aucune absence récente</p>
            </div>
            <button
              onClick={() => speak(`Absences de ${selectedChild?.first_name}. Aucune absence récente.`)}
              className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all w-full"
            >
              🔊 {t.listen}
            </button>
          </div>
        )}

        {screen === 'payments' && (
          <div className="text-center space-y-4 w-full">
            <div className="text-8xl">💰</div>
            <p className="text-xl font-bold text-gray-700">Paiements — {selectedChild?.first_name}</p>
            <div className="bg-white rounded-3xl p-6 shadow-sm border space-y-3">
              <p className="text-gray-500 text-sm">Rendez-vous à l&apos;intendance avec votre reçu</p>
              <p className="font-mono text-lg font-bold text-primary">{selectedChild?.iun ?? '—'}</p>
            </div>
            <button
              onClick={() => speak(`Paiements scolaires. Présentez-vous à l'intendance avec l'identifiant ${selectedChild?.iun ?? 'de votre enfant'}.`)}
              className="bg-green-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all w-full"
            >
              🔊 {t.listen}
            </button>
          </div>
        )}

        {screen === 'messages' && (
          <div className="text-center space-y-4 w-full">
            <div className="text-8xl">✉️</div>
            <p className="text-xl font-bold text-gray-700">{t.messages}</p>
            <div className="bg-blue-50 rounded-3xl p-6 border border-blue-200">
              <p className="text-blue-700">Aucun nouveau message</p>
            </div>
            <button
              onClick={() => speak(`Messages. Aucun nouveau message pour vous.`)}
              className="bg-purple-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all w-full"
            >
              🔊 {t.listen}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
