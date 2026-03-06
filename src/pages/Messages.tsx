import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AppLayout from '@/components/layout/AppLayout';
import { Send, ArrowLeft, MessageCircle } from 'lucide-react';
import {
  useConversations,
  useDirectMessages,
  useSendDirectMessage,
  useMarkDMRead,
  useDMSubscription,
} from '@/hooks/useDirectMessages';
import { useAllProfiles } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const Messages = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showConversations, setShowConversations] = useState(!userId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: conversations = [], isLoading: convLoading } = useConversations();
  const { data: messages = [], isLoading: msgLoading } = useDirectMessages(userId);
  const { data: allProfiles = [] } = useAllProfiles();
  const sendMessage = useSendDirectMessage();
  const markRead = useMarkDMRead();

  useDMSubscription(userId);

  useEffect(() => {
    if (userId) markRead.mutate(userId);
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setShowConversations(!userId);
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedUser = userId
    ? conversations.find((c) => c.otherUser.id === userId)?.otherUser ??
      allProfiles.find((p) => p.id === userId)
    : null;

  const handleSend = () => {
    if (!userId || !newMessage.trim() || sending) return;
    setSending(true);
    sendMessage.mutate(
      { receiverId: userId, content: newMessage.trim() },
      {
        onSuccess: () => {
          setNewMessage('');
          setSending(false);
          if (textareaRef.current) textareaRef.current.style.height = '40px';
        },
        onError: () => setSending(false),
      }
    );
  };

  const handleQuickTemplate = (text: string) => {
    if (!userId || sending) return;
    setSending(true);
    sendMessage.mutate(
      { receiverId: userId, content: text },
      {
        onSuccess: () => setSending(false),
        onError: () => setSending(false),
      }
    );
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    const el = e.target;
    el.style.height = '40px';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const shouldShowTimestamp = (index: number) => {
    if (index === 0) return true;
    const prev = new Date(messages[index - 1].created_at).getTime();
    const curr = new Date(messages[index].created_at).getTime();
    return curr - prev > 5 * 60 * 1000;
  };

  return (
    <AppLayout>
      <div
        className="flex flex-col"
        style={{
          height: `calc(100vh - 52px - var(--sat) - var(--bottom-nav-height) - var(--sab))`,
        }}
      >
        {/* Conversations list */}
        <div className={cn(
          'flex-1 flex flex-col overflow-hidden',
          userId && 'hidden lg:flex lg:w-80 lg:shrink-0 lg:border-r',
          !userId && 'w-full',
        )} style={{ borderColor: '#1E1E1E' }}>
          {!userId && (
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #1E1E1E' }}>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, color: '#F5F0E8' }}>
                Messages
              </h1>
            </div>
          )}
          <div className="flex-1 overflow-y-auto scroll-container">
            {convLoading ? (
              <div className="space-y-1 p-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton" style={{ width: '60%', height: 14 }} />
                      <div className="skeleton" style={{ width: '80%', height: 12 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length > 0 ? (
              conversations.map((conv) => (
                <button
                  key={conv.otherUser.id}
                  onClick={() => navigate(`/messages/${conv.otherUser.id}`)}
                  className="w-full flex items-center gap-3 p-3 transition-colors active:scale-[0.98]"
                  style={{
                    background: userId === conv.otherUser.id ? '#0D0D0D' : 'transparent',
                    borderBottom: '1px solid #1A1A1A',
                  }}
                >
                  <Avatar className="w-11 h-11 shrink-0">
                    <AvatarImage src={conv.otherUser.avatar ?? undefined} />
                    <AvatarFallback style={{ background: '#141414', color: '#888' }}>
                      {(conv.otherUser.name ?? '?')[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#F5F0E8' }} className="truncate">
                        {conv.otherUser.name}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span
                          className="flex items-center justify-center shrink-0"
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: '#16A34A',
                            color: '#000',
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: '#555' }} className="truncate">
                      {conv.lastMessage.sender_id === user?.id ? 'You: ' : ''}
                      {conv.lastMessage.content}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center text-center px-4 py-12">
                <div>
                  <MessageCircle style={{ width: 40, height: 40, color: '#333', margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 13, color: '#555' }}>
                    No conversations yet
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Message thread */}
        {userId && selectedUser ? (
          <div className={cn('flex-1 flex flex-col overflow-hidden', !userId && 'hidden lg:flex')}>
            {/* Thread header */}
            <div
              className="flex items-center gap-3 shrink-0"
              style={{
                padding: '10px 16px',
                borderBottom: '1px solid #1E1E1E',
              }}
            >
              <button
                className="touch-target lg:hidden"
                onClick={() => navigate('/messages')}
              >
                <ArrowLeft style={{ width: 20, height: 20, color: '#888' }} />
              </button>
              <Avatar className="w-9 h-9">
                <AvatarImage src={selectedUser.avatar ?? undefined} />
                <AvatarFallback style={{ background: '#141414', color: '#888' }}>
                  {(selectedUser.name ?? '?')[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 15, color: '#F5F0E8' }}>
                  {selectedUser.name}
                </p>
                <div className="flex items-center gap-1">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: '#555' }}>Online</span>
                </div>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto scroll-container px-4 py-3">
              {msgLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div style={{ width: 24, height: 24, border: '2px solid #1E1E1E', borderTopColor: '#16A34A', borderRadius: '50%', animation: 'spinRefresh 600ms linear infinite' }} />
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id}>
                      {shouldShowTimestamp(i) && (
                        <div className="text-center my-3">
                          <span style={{ fontSize: 11, color: '#555' }}>
                            {new Date(msg.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                      <div
                        className={cn('flex gap-2 mb-1.5', isMe ? 'justify-end' : 'justify-start')}
                        style={{
                          animation: i === messages.length - 1 ? 'countUp 200ms ease-out' : undefined,
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '75%',
                            padding: '10px 14px',
                            fontSize: 15,
                            lineHeight: 1.4,
                            borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            background: isMe ? '#16A34A' : '#1E1E1E',
                            color: isMe ? '#000' : '#F5F0E8',
                          }}
                        >
                          {msg.content}
                        </div>
                      </div>
                      {isMe && (
                        <div className="flex justify-end mb-2">
                          <span style={{ fontSize: 10, color: msg.is_read ? '#16A34A' : '#333' }}>
                            ✓✓
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick templates for first message */}
            {messages.length === 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {[
                  "Hi, I'm interested in your training. Are you available this week?",
                  "Can you tell me more about your packages?",
                  "Do you offer home training sessions?",
                ].map(t => (
                  <button
                    key={t}
                    onClick={() => handleQuickTemplate(t)}
                    disabled={sending}
                    className="active:scale-[0.96] transition-transform"
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      background: 'rgba(22,163,74,0.1)',
                      border: '1px solid rgba(22,163,74,0.2)',
                      color: '#16A34A',
                      fontSize: 12,
                    }}
                  >
                    {t.length > 35 ? t.slice(0, 35) + '...' : t}
                  </button>
                ))}
              </div>
            )}

            {/* Input bar */}
            <div
              className="shrink-0 flex items-end gap-2"
              style={{
                padding: '8px 16px',
                paddingBottom: `calc(8px + var(--keyboard-height, 0px))`,
                borderTop: '1px solid #1E1E1E',
              }}
            >
              <textarea
                ref={textareaRef}
                placeholder="Message..."
                value={newMessage}
                onChange={handleTextareaInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                style={{
                  flex: 1,
                  minHeight: 40,
                  maxHeight: 120,
                  padding: '10px 16px',
                  borderRadius: 20,
                  background: '#161616',
                  border: '1px solid #252525',
                  color: '#F5F0E8',
                  fontSize: 15,
                  fontFamily: "'Manrope', sans-serif",
                  resize: 'none',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                className="shrink-0 flex items-center justify-center active:scale-[0.96] transition-all"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: newMessage.trim() ? '#16A34A' : 'rgba(22,163,74,0.3)',
                  opacity: newMessage.trim() ? 1 : 0.4,
                  transition: 'opacity 150ms ease, background 150ms ease',
                  marginBottom: 2,
                }}
              >
                <Send style={{ width: 16, height: 16, color: '#000' }} />
              </button>
            </div>
          </div>
        ) : !userId ? null : (
          <div className="hidden lg:flex flex-1 items-center justify-center text-center px-4">
            <div>
              <MessageCircle style={{ width: 48, height: 48, color: '#333', margin: '0 auto 12px' }} />
              <h3 style={{ fontWeight: 600, color: '#F5F0E8', marginBottom: 4 }}>Select a conversation</h3>
              <p style={{ fontSize: 13, color: '#555' }}>Choose someone from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Messages;
