import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/components/layout/AppLayout';
import { Send, Loader2, MessageCircle, ArrowLeft } from 'lucide-react';
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
  const [showConversations, setShowConversations] = useState(!userId);

  const { data: conversations = [], isLoading: convLoading } = useConversations();
  const { data: messages = [], isLoading: msgLoading } = useDirectMessages(userId);
  const { data: allProfiles = [] } = useAllProfiles();
  const sendMessage = useSendDirectMessage();
  const markRead = useMarkDMRead();

  useDMSubscription(userId);

  // Mark messages as read when viewing a conversation
  useEffect(() => {
    if (userId) {
      markRead.mutate(userId);
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // On mobile, show conversations list when no userId
  useEffect(() => {
    setShowConversations(!userId);
  }, [userId]);

  const selectedUser = userId
    ? conversations.find((c) => c.otherUser.id === userId)?.otherUser ??
      allProfiles.find((p) => p.id === userId)
    : null;

  const handleSend = () => {
    if (!userId || !newMessage.trim()) return;
    sendMessage.mutate(
      { receiverId: userId, content: newMessage.trim() },
      { onSuccess: () => setNewMessage('') }
    );
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 h-[calc(100vh-64px)] lg:h-screen flex flex-col">
        <h1 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          Messages
        </h1>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Conversations list */}
          <div
            className={cn(
              'w-full lg:w-80 shrink-0 bg-card rounded-xl border border-border/50 shadow-soft overflow-hidden flex flex-col',
              userId && 'hidden lg:flex'
            )}
          >
            <div className="p-3 border-b border-border">
              <h2 className="text-sm font-medium text-muted-foreground">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {convLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : conversations.length > 0 ? (
                conversations.map((conv) => (
                  <button
                    key={conv.otherUser.id}
                    onClick={() => navigate(`/messages/${conv.otherUser.id}`)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left',
                      userId === conv.otherUser.id && 'bg-muted'
                    )}
                  >
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarImage src={conv.otherUser.avatar ?? undefined} />
                      <AvatarFallback>{(conv.otherUser.name ?? '?')[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground truncate">
                          {conv.otherUser.name}
                        </span>
                        {conv.unreadCount > 0 && (
                          <Badge className="bg-primary text-primary-foreground text-xs h-5 min-w-[20px] flex items-center justify-center">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.lastMessage.sender_id === user?.id ? 'You: ' : ''}
                        {conv.lastMessage.content}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-12 px-4">
                  <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No conversations yet. Message someone from the Dashboard!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Message thread */}
          <div
            className={cn(
              'flex-1 bg-card rounded-xl border border-border/50 shadow-soft overflow-hidden flex flex-col',
              !userId && 'hidden lg:flex'
            )}
          >
            {userId && selectedUser ? (
              <>
                {/* Thread header */}
                <div className="p-3 border-b border-border flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => navigate('/messages')}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={selectedUser.avatar ?? undefined} />
                    <AvatarFallback>{(selectedUser.name ?? '?')[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedUser.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedUser.city || selectedUser.gym || ''}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {msgLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={cn('flex gap-2', isMe && 'flex-row-reverse')}
                        >
                          <div
                            className={cn(
                              'max-w-[75%] rounded-xl px-4 py-2 text-sm',
                              isMe
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground'
                            )}
                          >
                            {msg.content}
                          </div>
                          <span className="text-xs text-muted-foreground self-end">
                            {new Date(msg.created_at).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input */}
                <div className="p-3 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || sendMessage.isPending}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center px-4">
                <div>
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium text-foreground mb-1">Select a conversation</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose someone from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Messages;
