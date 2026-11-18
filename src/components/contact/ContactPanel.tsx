import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { Send, User, MessageSquare, Clock, Check, CheckCheck, X, ChevronRight, Sparkles, AlertCircle, Smile, Link, Bell, Paperclip, Loader2 } from 'lucide-react';
import { db } from '../../firebase';

import { storage } from '../../utils/storage';
import { googleSync } from '../../utils/googleSync';
import { addNotification, NOTIF_TYPES, subscribeToUserNotifications, markUserNotifAsRead } from '../../utils/notifications';

import { collection, query, onSnapshot, addDoc, orderBy, serverTimestamp, where, limit, setDoc, doc, updateDoc } from 'firebase/firestore';

const ContactPanel = forwardRef(({ isOpen }, ref) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [userName, setUserName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userNotifs, setUserNotifs] = useState([]);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const messagesEndRef = useRef(null);

  // 1. Initialize Session from LocalStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('porto_chat_user');
    if (savedUser) {
      try {
        const { name, id } = JSON.parse(savedUser);
        if (name && id) {
          setUserName(name);
          setSessionId(id);
          setIsRegistered(true);
        }
      } catch (e) {
        console.error("Failed to parse saved chat user", e);
      }
    }
  }, []);

  // 1.5 Subscribe to User Notifications
  useEffect(() => {
    if (!sessionId) return;
    const unsub = subscribeToUserNotifications(sessionId, (notifs) => {
      setUserNotifs(notifs);
    });
    return () => unsub();
  }, [sessionId]);

  // 2. Sync Messages (Real-time 2-way)
  useEffect(() => {
    if (!isRegistered || !sessionId || !isOpen) return;

    const q = query(
      collection(db, 'porto_messages'), 
      where('roomId', '==', sessionId),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      msgs.sort((a, b) => {
        const timeA = a.timestamp?.seconds || Date.now() / 1000;
        const timeB = b.timestamp?.seconds || Date.now() / 1000;
        return timeA - timeB;
      });
      setMessages(msgs);
    }, (err) => {
      console.error("Chat sync error:", err);
    });

    const convRef = doc(db, 'porto_conversations', sessionId);
    const unsubConv = onSnapshot(convRef, (snap) => {
      if (!snap.exists()) {
        localStorage.removeItem('porto_chat_user');
        setSessionId('');
        setIsRegistered(false);
        setMessages([]);
      }
    }, (err) => {
      console.error("Conversation sync error:", err);
    });

    const updateOnline = async () => {
      try {
        await updateDoc(convRef, { online: true, lastSeen: serverTimestamp() });

      } catch (e) {}
    };
    updateOnline();

    return () => {
      unsubscribe();
      unsubConv();
    };
  }, [isRegistered, sessionId, isOpen]);

  const isInitialLoad = useRef(true);

  // 3. Scroll to bottom logic
  const scrollToBottom = (instant = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
    }
  };

  // Scroll on messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(isInitialLoad.current);
      isInitialLoad.current = false;
    }
  }, [messages]);

  // Scroll on open (Instant jump to bottom)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Lock body scroll
      const timer = setTimeout(() => scrollToBottom(true), 50);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = ''; // Unlock
      isInitialLoad.current = true; // Reset for next open
    }
  }, [isOpen]);

  // Scroll on window resize (keyboard pop up)
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
      scrollToBottom(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const handleStartChat = async (e) => {
    e.preventDefault();
    if (!userName.trim() || !initialMessage.trim()) return;

    setIsLoading(true);
    const newSessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    try {
      await setDoc(doc(db, 'porto_conversations', newSessionId), {
        id: newSessionId,
        userName: userName,
        lastMessage: initialMessage,
        lastMessageTime: serverTimestamp(),
        unread: 1,
        online: true,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, 'porto_messages'), {
        roomId: newSessionId,
        text: initialMessage,
        senderId: 'user',
        senderName: userName,
        timestamp: serverTimestamp()
      });

      localStorage.setItem('porto_chat_user', JSON.stringify({ name: userName, id: newSessionId }));
      setSessionId(newSessionId);
      setIsRegistered(true);
      addNotification(NOTIF_TYPES.CHAT, 'Percakapan Dimulai', `${userName} baru saja memulai chat.`);
      
      // Sync lead to Google Sheets
      googleSync.syncContactToSheets(userName, initialMessage, newSessionId);
    } catch (err) {
      console.error("Error starting chat:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !sessionId) return;
    const text = inputText;
    setInputText('');
    try {
      await addDoc(collection(db, 'porto_messages'), {
        roomId: sessionId,
        text,
        senderId: 'user',
        senderName: userName,
        timestamp: serverTimestamp()
      });
      await updateDoc(doc(db, 'porto_conversations', sessionId), {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        unread: 1
      });
      addNotification(NOTIF_TYPES.CHAT, 'Pesan Chat Baru', `${userName}: ${text}`);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !sessionId) return;
    
    setIsUploadingFile(true);
    try {
      const url = await googleSync.uploadFileToDrive(file);
      const text = `File terlampir: ${file.name}\n${url}`;
      
      await addDoc(collection(db, 'porto_messages'), {
        roomId: sessionId,
        text,
        senderId: 'user',
        senderName: userName,
        timestamp: serverTimestamp()
      });
      await updateDoc(doc(db, 'porto_conversations', sessionId), {
        lastMessage: "File dikirim",
        lastMessageTime: serverTimestamp(),
        unread: 1
      });
      addNotification(NOTIF_TYPES.CHAT, 'File Diterima', `${userName} mengirim file: ${file.name}`);
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Gagal mengupload file ke Google Drive");
    } finally {
      setIsUploadingFile(false);
    }
  };


  return (
    <div ref={ref} className={`contact-panel${isOpen ? ' open' : ''}`} style={{ 
      display: 'flex', flexDirection: 'column', 
      background: 'var(--cms-panel-bg)',
      backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)',
      boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
      border: '1px solid var(--glass-border)',
      zIndex: 2000,
      overflow: 'hidden',
      borderRadius: 44,
    }}>
      {/* Header - Fixed Height, shrinks on keyboard pop */}
      <div style={{ 
        padding: windowHeight < 550 ? '12px 20px' : '24px 32px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        borderBottom: '1px solid var(--glass-border)', 
        background: 'var(--cms-panel-bg)', 
        zIndex: 10,
        flexShrink: 0,
        transition: 'padding 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            width: windowHeight < 550 ? 32 : 44, 
            height: windowHeight < 550 ? 32 : 44, 
            borderRadius: 12, background: 'var(--cms-accent)', color: '#fff', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            boxShadow: '0 8px 20px var(--cms-accent-soft)',
            transition: 'all 0.3s ease'
          }}>
            <MessageSquare size={windowHeight < 550 ? 16 : 22} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: windowHeight < 550 ? 14 : 18, fontWeight: 900, color: 'var(--cms-text)', letterSpacing: '-0.02em', transition: 'font-size 0.3s ease' }}>Pesan Langsung</div>
            {windowHeight >= 550 && <div style={{ fontSize: 13, color: '#10b981', fontWeight: 800 }}>Operator Online</div>}
          </div>
        </div>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('porto_close_contact'))} 
          style={{ 
            width: windowHeight < 550 ? 36 : 44, 
            height: windowHeight < 550 ? 36 : 44, 
            borderRadius: 12, background: 'var(--cms-switcher-bg)', border: 'none', 
            color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
            transition: 'all 0.3s ease'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Area - Fills space */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {!isRegistered ? (
          <>
            {/* Fake Messages Area to look like chat */}
            <div style={{ flex: 1, padding: window.innerWidth < 480 ? '20px' : '32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ 
                alignSelf: 'flex-start', maxWidth: '88%',
                animation: 'cmsPopIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                <div style={{ 
                  padding: window.innerWidth < 480 ? '12px 20px' : '16px 24px', 
                  borderRadius: '22px 22px 22px 6px',
                  background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)',
                  fontSize: window.innerWidth < 480 ? 14 : 15, fontWeight: 600, lineHeight: 1.5,
                  border: '1px solid var(--glass-border)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                }}>
                  Halo! Ingin bertanya sesuatu? Tim kami siap membantu Anda secara langsung.
                </div>
              </div>
            </div>

            {/* Compact Form at the bottom, looking like an input area */}
            <div style={{ padding: '0 24px 32px', position: 'relative', flexShrink: 0, animation: 'cmsSlideUp 0.5s ease' }}>
              <form onSubmit={handleStartChat} style={{ 
                background: 'var(--cms-input-bg)', backdropFilter: 'blur(15px)', 
                borderRadius: 28, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, 
                border: '1.5px solid var(--glass-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' 
              }}>
                <input placeholder="Nama Anda..." required value={userName} onChange={e => setUserName(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 100, border: '1px solid var(--glass-border)', background: 'var(--cms-card-bg)', padding: '0 16px', fontSize: 14, fontWeight: 600, color: 'var(--cms-text)', outline: 'none' }} />
                
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <textarea placeholder="Pesan pertama Anda..." required value={initialMessage} onChange={e => setInitialMessage(e.target.value)} style={{ flex: 1, minHeight: 48, maxHeight: 120, borderRadius: 24, border: '1px solid var(--glass-border)', background: 'var(--cms-card-bg)', padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--cms-text)', resize: 'none', outline: 'none', fontFamily: 'inherit' }} />
                  
                  <button type="submit" disabled={isLoading || !userName.trim() || !initialMessage.trim()} style={{ 
                    width: 48, height: 48, borderRadius: '50%', background: 'var(--cms-accent)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)', opacity: (isLoading || !userName.trim() || !initialMessage.trim()) ? 0.5 : 1, boxShadow: (userName.trim() && initialMessage.trim()) ? '0 10px 25px rgba(var(--cms-accent-rgb), 0.3)' : 'none', transform: (userName.trim() && initialMessage.trim()) ? 'scale(1)' : 'scale(0.95)'
                  }}>
                    {isLoading ? <Loader2 size={20} className="cms-spin" /> : <Send size={20} style={{ marginLeft: 2 }} />}
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <>
            {/* User Notifications Feed - Scrollable if many */}
            {userNotifs.length > 0 && (
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)', background: 'rgba(var(--cms-accent-rgb), 0.02)', maxHeight: 150, overflowY: 'auto', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Bell size={14} color="var(--cms-accent)" />
                  <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-accent)', letterSpacing: '0.05em' }}>PEMBERITAHUAN SISTEM</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {userNotifs.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => !n.read && markUserNotifAsRead(n.id)}
                      style={{ 
                        padding: '12px 16px', borderRadius: 16, background: n.read ? 'rgba(0,0,0,0.03)' : 'var(--cms-card-bg)',
                        border: '1px solid var(--glass-border)', boxShadow: n.read ? 'none' : '0 4px 12px rgba(0,0,0,0.03)',
                        cursor: 'pointer', transition: 'all 0.2s ease',
                        position: 'relative', overflow: 'hidden'
                      }}
                    >
                      {!n.read && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--cms-accent)' }} />}
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', fontWeight: 600, marginTop: 2 }}>{n.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages Area - Scrollable */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              minHeight: 0,
              padding: window.innerWidth < 480 ? '20px 20px' : '32px 32px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 16 
            }}>
              {messages.map((msg) => {
                const isMe = msg.senderId === 'user';
                return (
                  <div key={msg.id} style={{ 
                    alignSelf: isMe ? 'flex-end' : 'flex-start', 
                    maxWidth: '88%',
                    display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start',
                    animation: 'cmsPopIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}>
                    <div style={{ 
                      padding: window.innerWidth < 480 ? '12px 20px' : '16px 24px', 
                      borderRadius: isMe ? '22px 22px 6px 22px' : '22px 22px 22px 6px',
                      background: isMe ? 'var(--cms-accent)' : 'var(--cms-switcher-bg)',
                      color: isMe ? '#fff' : 'var(--cms-text)',
                      fontSize: window.innerWidth < 480 ? 14 : 15, 
                      fontWeight: 600, 
                      lineHeight: 1.5,
                      boxShadow: isMe ? '0 12px 30px rgba(var(--cms-accent-rgb), 0.25)' : '0 4px 15px rgba(0,0,0,0.03)',
                      border: isMe ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--glass-border)',
                      letterSpacing: '-0.01em'
                    }}>
                      {msg.text}
                    </div>
                    <div style={{ fontSize: 10, color: '#999', fontWeight: 800, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Baru saja'}
                      {isMe && <CheckCheck size={12} color="var(--cms-accent)" />}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Redesign */}
            <div style={{ padding: '16px 24px 32px', position: 'relative', flexShrink: 0, background: 'linear-gradient(to top, var(--cms-bg) 60%, transparent)' }}>
              <form onSubmit={handleSendMessage} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: 'var(--cms-input-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '32px', 
                padding: '6px 6px 6px 20px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
                backdropFilter: 'blur(10px)'
              }}>
                <label style={{ 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: 'var(--cms-text-muted)', marginRight: '12px', transition: 'color 0.2s'
                }} onMouseEnter={e=>e.currentTarget.style.color='var(--cms-text)'} onMouseLeave={e=>e.currentTarget.style.color='var(--cms-text-muted)'}>
                  {isUploadingFile ? <Loader2 size={20} className="cms-spin" /> : <Paperclip size={20} />}
                  <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={isUploadingFile} />
                </label>
                
                <input 
                  placeholder="Ketik balasan..." 
                  value={inputText} 
                  onChange={e => setInputText(e.target.value)} 
                  style={{ 
                    flex: 1, border: 'none', background: 'transparent', 
                    fontSize: '15px', color: 'var(--cms-text)', 
                    outline: 'none', height: '42px', fontWeight: 500, minWidth: 0
                  }} 
                />
                
                <button 
                  type="submit" 
                  disabled={!inputText.trim()} 
                  style={{ 
                    width: '42px', height: '42px', borderRadius: '50%', 
                    background: inputText.trim() ? 'var(--cms-accent)' : 'transparent', 
                    color: inputText.trim() ? '#fff' : 'var(--cms-text-muted)',
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    cursor: inputText.trim() ? 'pointer' : 'default',
                    transition: 'all 0.25s ease', flexShrink: 0,
                    boxShadow: inputText.trim() ? '0 8px 20px rgba(var(--cms-accent-rgb), 0.3)' : 'none'
                  }}
                >
                  <Send size={20} style={{ marginLeft: inputText.trim() ? 2 : 0 }} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

ContactPanel.displayName = 'ContactPanel';
export default ContactPanel;
