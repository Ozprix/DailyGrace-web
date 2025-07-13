
// src/components/grace-companion-chat.tsx
"use client";

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2, AlertCircle, Bot, User as UserIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { analytics, app as firebaseApp } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';
import { v4 as uuidv4 } from 'uuid';

// Firebase imports
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, type Firestore, where } from 'firebase/firestore';


interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  role?: 'user' | 'model'; // Keep for potential direct use from Firestore data
  sessionId?: string; // For internal use
}

export function GraceCompanionChat() {
  const { user } = useAuth();
  const { preferences, isLoaded: preferencesLoaded } = useUserPreferences();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const processedMessageIds = useRef(new Set<string>());


  const [db, setDb] = useState<Firestore | null>(null);

  useEffect(() => {
    const firestoreDb = getFirestore(firebaseApp);
    setDb(firestoreDb);

    const newSessionId = uuidv4();
    setSessionId(newSessionId);

    const welcomeId = 'welcome-' + Date.now();
    setMessages([
      {
        id: welcomeId,
        sender: 'ai',
        text: "Hello! I'm Grace, your AI companion. How can I assist you on your spiritual journey today? Feel free to ask questions about the Bible, share your thoughts, or request a devotional thought.",
        timestamp: new Date(),
        role: 'model',
        sessionId: newSessionId,
      },
    ]);
    if (analytics) {
      logEvent(analytics, 'grace_companion_chat_initialized', { session_id: newSessionId });
    }
    processedMessageIds.current.add(welcomeId);
  }, [user]);


  useEffect(() => {
    if (!db || !sessionId || !user?.uid) {
      if (!user?.uid) setMessages([]);
      return;
    }

    const messagesCollectionRef = collection(db, 'generate');
    const q = query(
      messagesCollectionRef,
      where("userId", "==", user.uid),
      where("sessionId", "==", sessionId),
      orderBy('createTime', 'asc')
    );


    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessagesList: Message[] = [];
      let newAiResponseReceived = false;

      snapshot.docChanges().forEach((change) => {
        const messageData = change.doc.data() as any;
        const messageId = change.doc.id;

        if (messageData.sessionId === sessionId && messageData.userId === user?.uid && !processedMessageIds.current.has(messageId)) {
          const sender = messageData.role === 'user' ? 'user' : 'ai';
          let text = "";

          if (sender === 'ai') {
            if (messageData.response) {
              if (typeof messageData.response === 'string') {
                text = messageData.response;
              } else if (messageData.response.parts && Array.isArray(messageData.response.parts)) {
                text = messageData.response.parts.map((part: { text: string }) => part.text).join('\n');
              } else if (messageData.response.text) {
                text = messageData.response.text;
              }
            } else if (messageData.parts && Array.isArray(messageData.parts)) {
              text = messageData.parts.map((part: { text: string }) => part.text).join('\n');
            }
             if (text.trim() !== '') newAiResponseReceived = true;
          } else { 
            if (messageData.prompt && typeof messageData.prompt === 'string') {
                text = messageData.prompt;
            } else if (messageData.parts && Array.isArray(messageData.parts)) {
                text = messageData.parts.map((part: { text: string }) => part.text).join('\n');
            }
          }
          
          text = text.trim();
          const timestamp = messageData.createTime?.toDate() || new Date();

          if (change.type === 'added' && text) {
            newMessagesList.push({
              id: messageId,
              sender: sender,
              text: text,
              timestamp: timestamp,
              role: messageData.role,
              sessionId: messageData.sessionId,
            });
            processedMessageIds.current.add(messageId);
          }
        }
      });

      if (newMessagesList.length > 0) {
        setMessages((prevMessages) => {
          const combined = [...prevMessages, ...newMessagesList];
           const uniqueMessages = Array.from(new Map(combined.map(item => [item.id, item])).values());
          return uniqueMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        });
      }
      
      if (newAiResponseReceived) {
        setIsLoadingResponse(false);
      }

    }, (err) => {
      console.error("Error listening to Firestore messages:", err);
      setError("Failed to load new messages. Check permissions.");
      setIsLoadingResponse(false);
    });

    return () => unsubscribe();

  }, [db, sessionId, user?.uid]);


  useEffect(() => {
    const scrollToBottom = () => {
       if (scrollAreaRef.current) {
        const { scrollHeight, clientHeight, scrollTop } = scrollAreaRef.current;
        if (scrollHeight - clientHeight - scrollTop < 50) {
             scrollAreaRef.current.scrollTo({ top: scrollHeight, behavior: 'smooth' });
        } else if (messages.length === 1 && messages[0].id.startsWith('welcome-')) {
             scrollAreaRef.current.scrollTo({ top: scrollHeight, behavior: 'smooth' });
        }
      }
    };
    const timeoutId = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timeoutId);
  }, [messages]);


  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoadingResponse || !db || !sessionId || !user?.uid) {
        if (!user?.uid && !error) {
            setError("You must be logged in to send messages.");
        }
        return;
    }

    const userMessageText = inputValue;
    setInputValue('');
    setIsLoadingResponse(true);
    setError(null);

    // REMOVED OPTIMISTIC UPDATE
    // The onSnapshot listener will now handle displaying the user's message once it's saved to Firestore.

    const messageToSendToFirestore = {
      prompt: userMessageText,
      role: 'user',
      createTime: serverTimestamp(),
      sessionId: sessionId,
      userId: user.uid,
      status: "NEW",
    };

    if (analytics) {
      logEvent(analytics, 'grace_companion_send_message_attempt_ext', {
        message_length: userMessageText.length,
        subscription_status: preferences.subscriptionStatus || 'unknown',
        session_id: sessionId,
        user_id: user?.uid || 'anonymous'
      });
    }

    try {
      await addDoc(collection(db, 'generate'), messageToSendToFirestore);
      // The onSnapshot listener will now handle adding this message to the UI.
    } catch (err: any) {
      console.error("Error writing message to Firestore:", err);
      let errorMessage = "Sorry, I couldn't send your message. Please try again.";
      if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      setError(errorMessage);
      setIsLoadingResponse(false); // Stop loading on send error.

      if (analytics) {
        logEvent(analytics, 'grace_companion_send_message_error_ext', {
          error_message: err.message,
          session_id: sessionId,
           user_id: user?.uid || 'anonymous'
        });
      }
    }
  };
  
  const displayMessages = messages;

  if (!user?.uid) {
       return (
            <Card className="w-full h-[calc(100vh-100px)] sm:h-[calc(100vh-120px)] max-w-3xl mx-auto shadow-xl flex flex-col bg-card/80 backdrop-blur-sm border-border/50 justify-center items-center">
                <CardContent className="flex flex-col items-center text-center p-6">
                     <UserIcon size={48} className="text-muted-foreground mb-4"/>
                    <h3 className="text-xl font-semibold mb-2">Sign In Required</h3>
                    <p className="text-muted-foreground">Please sign in to start chatting with Grace.</p>
                </CardContent>
            </Card>
       );
  }

  if (!preferencesLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading chat preferences...</p>
      </div>
    );
  }
   if (!db) {
     return (
       <div className="flex flex-col items-center justify-center h-full">
         <AlertCircle className="h-8 w-8 text-destructive" />
         <p className="mt-2 text-destructive">Error initializing chat service.</p>
       </div>
     );
   }

  return (
    <Card className="w-full h-[calc(100vh-100px)] sm:h-[calc(100vh-120px)] max-w-3xl mx-auto shadow-xl flex flex-col bg-card/80 backdrop-blur-sm border-border/50">
      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-full p-4 sm:p-6" ref={scrollAreaRef}>
          <div className="space-y-6">
            {displayMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'ai' && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback><Bot size={20} className="text-primary" /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[70%] rounded-xl px-4 py-3 shadow-md text-sm
                    ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted text-muted-foreground rounded-bl-none'
                    }
                    ${msg.id.startsWith('error-') || msg.id.startsWith('send-error-') ? 'bg-destructive/20 text-destructive-foreground border border-destructive' : ''}`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <p className={`text-xs mt-1.5 ${msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground/70 text-left'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                 {msg.sender === 'user' && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback>
                        {user?.email ? user.email.substring(0,1).toUpperCase() : <UserIcon size={18} />}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoadingResponse && (
              <div className="flex items-end gap-2 justify-start">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback><Bot size={20} className="text-primary animate-pulse" /></AvatarFallback>
                </Avatar>
                <div className="max-w-[70%] rounded-xl px-4 py-3 shadow-md bg-muted text-muted-foreground rounded-bl-none flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-border/50 bg-background/50 backdrop-blur-sm">
        {error && !isLoadingResponse && (
            <div className="text-xs text-destructive mb-2 flex items-center gap-1.5">
                <AlertCircle size={14}/> {error}
            </div>
        )}
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Type your message or question..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-grow text-sm h-11"
            disabled={isLoadingResponse || !preferencesLoaded || !db || !sessionId || !user?.uid}
            aria-label="Chat message input"
          />
          <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={isLoadingResponse || !inputValue.trim() || !db || !sessionId || !user?.uid}>
            {isLoadingResponse ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </form>
    </Card>
  );
}
