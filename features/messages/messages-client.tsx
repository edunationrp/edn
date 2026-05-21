'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { insertRecord } from '@/lib/supabase/mutations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Mail, Send, Search, Mic, MicOff, Volume2, Plus,
  ArrowLeft, CheckCheck, Clock, Loader2
} from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'

interface Message {
  id: string
  subject: string
  body: string
  is_read: boolean
  created_at: string
  sender_id: string
  has_audio: boolean
  sender: { first_name: string; last_name: string; avatar_url: string | null }
}

interface MessagesClientProps {
  currentUserId: string
  schoolId: string
  messages: Message[]
  unreadCount: number
}

export function MessagesClient({ currentUserId, schoolId, messages: initialMessages, unreadCount }: MessagesClientProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState(initialMessages)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Compose form
  const [recipientId, setRecipientId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [searchUsers, setSearchUsers] = useState<Array<{ id: string; first_name: string; last_name: string }>>([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  async function markAsRead(messageId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('messages').update({ is_read: true }).eq('id', messageId)
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_read: true } : m))
  }

  function openMessage(msg: Message) {
    setSelectedMessage(msg)
    if (!msg.is_read) markAsRead(msg.id)
    setShowCompose(false)
  }

  async function searchRecipients(query: string) {
    if (query.length < 2) return
    setIsSearchingUsers(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .neq('id', currentUserId)
      .limit(10)
    setSearchUsers((data as Array<{ id: string; first_name: string; last_name: string }> | null) ?? [])
    setIsSearchingUsers(false)
  }

  async function sendMessage() {
    if (!recipientId || !subject || !body) return
    setIsSending(true)

    await insertRecord('messages', {
      sender_id: currentUserId,
      recipient_id: recipientId,
      school_id: schoolId,
      subject,
      body,
      is_read: false,
      has_audio: false,
    })

    setShowCompose(false)
    setRecipientId('')
    setSubject('')
    setBody('')
    setSearchUsers([])
    setIsSending(false)
  }

  function speakMessage(text: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'fr-FR'
      utterance.rate = 0.9
      speechSynthesis.speak(utterance)
    }
  }

  async function toggleRecording() {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = e => audioChunksRef.current.push(e.data)
        mediaRecorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop())
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          const reader = new FileReader()
          reader.onloadend = () => {
            setBody(prev => prev + '\n[Message vocal enregistré]')
          }
          reader.readAsDataURL(audioBlob)
        }
        mediaRecorder.start()
        setIsRecording(true)
      } catch {
        alert('Accès au microphone refusé')
      }
    }
  }

  const filteredMessages = messages.filter(m =>
    m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${m.sender.first_name} ${m.sender.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Messages
            {unreadCount > 0 && (
              <Badge className="bg-primary text-white ml-1">{unreadCount} non lu{unreadCount > 1 ? 's' : ''}</Badge>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Messagerie interne sécurisée</p>
        </div>
        <Button onClick={() => { setShowCompose(true); setSelectedMessage(null) }}>
          <Plus className="h-4 w-4 mr-1" />
          Nouveau message
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Liste des messages */}
        <div className="xl:col-span-1 flex flex-col">
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 rounded-lg border bg-white">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Mail className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun message</p>
              </div>
            ) : (
              filteredMessages.map(msg => (
                <button
                  key={msg.id}
                  className={`w-full text-left p-4 border-b last:border-0 hover:bg-muted/50 transition-colors ${
                    selectedMessage?.id === msg.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  } ${!msg.is_read ? 'bg-blue-50/50' : ''}`}
                  onClick={() => openMessage(msg)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                      {getInitials(`${msg.sender.first_name} ${msg.sender.last_name}`)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-sm truncate ${!msg.is_read ? 'font-bold' : 'font-medium'}`}>
                          {msg.sender.first_name} {msg.sender.last_name}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${!msg.is_read ? 'font-semibold text-gray-800' : 'text-muted-foreground'}`}>
                        {msg.subject}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{msg.body}</p>
                    </div>
                    {!msg.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Panneau de droite : message sélectionné ou composition */}
        <div className="xl:col-span-2">
          {showCompose ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Nouveau message</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowCompose(false)}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Retour
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4 overflow-y-auto">
                <div className="space-y-2">
                  <Label>Destinataire</Label>
                  <Input
                    placeholder="Rechercher un utilisateur…"
                    onChange={e => searchRecipients(e.target.value)}
                  />
                  {isSearchingUsers && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Recherche…
                    </div>
                  )}
                  {searchUsers.length > 0 && !recipientId && (
                    <div className="border rounded-lg overflow-hidden">
                      {searchUsers.map(u => (
                        <button
                          key={u.id}
                          className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm border-b last:border-0"
                          onClick={() => { setRecipientId(u.id); setSearchUsers([]) }}
                        >
                          {u.first_name} {u.last_name}
                        </button>
                      ))}
                    </div>
                  )}
                  {recipientId && (
                    <Badge className="bg-primary/10 text-primary">
                      {searchUsers.find(u => u.id === recipientId)?.first_name ?? 'Sélectionné'}
                      <button className="ml-2 text-xs" onClick={() => setRecipientId('')}>✕</button>
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Objet</Label>
                  <Input
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Objet du message…"
                  />
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <Label>Message</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={toggleRecording}
                      className={isRecording ? 'text-red-500' : ''}
                    >
                      {isRecording ? (
                        <><MicOff className="h-4 w-4 mr-1" />Arrêter</>
                      ) : (
                        <><Mic className="h-4 w-4 mr-1" />Audio</>
                      )}
                    </Button>
                  </div>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    placeholder="Écrivez votre message ici…"
                  />
                </div>

                <div className="flex justify-end gap-2 flex-shrink-0">
                  <Button variant="outline" onClick={() => setShowCompose(false)}>Annuler</Button>
                  <Button onClick={sendMessage} disabled={!recipientId || !subject || !body || isSending}>
                    {isSending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Envoi…</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" />Envoyer</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : selectedMessage ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {getInitials(`${selectedMessage.sender.first_name} ${selectedMessage.sender.last_name}`)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{selectedMessage.subject}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        De : {selectedMessage.sender.first_name} {selectedMessage.sender.last_name}
                        {' · '}
                        {formatDate(selectedMessage.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => speakMessage(selectedMessage.body)}
                      title="Écouter le message"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCompose(true)
                        setSubject(`Re: ${selectedMessage.subject}`)
                        setRecipientId(selectedMessage.sender_id)
                      }}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Répondre
                    </Button>
                  </div>
                </div>
                <Separator className="mt-3" />
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedMessage.body}</p>
                </div>
                {selectedMessage.is_read && (
                  <div className="flex items-center gap-1.5 mt-4 text-xs text-green-600">
                    <CheckCheck className="h-3.5 w-3.5" />
                    Lu
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center rounded-lg border border-dashed bg-muted/20">
              <div className="text-center">
                <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground font-medium">Sélectionnez un message</p>
                <p className="text-sm text-muted-foreground mt-1">
                  ou{' '}
                  <button
                    className="text-primary hover:underline font-medium"
                    onClick={() => setShowCompose(true)}
                  >
                    écrivez un nouveau message
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
