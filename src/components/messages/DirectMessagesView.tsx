import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { Conversation, Message, User } from '../../types/index';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { ReportModal } from '../common/ReportModal';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Search, 
  MoreVertical, 
  ShieldAlert, 
  Ban, 
  Flag, 
  Image as ImageIcon, 
  X, 
  CheckCheck,
  Lock
} from 'lucide-react';

interface DirectMessagesViewProps {
  initialRecipientId?: string;
  onSelectUser: (username: string) => void;
}

export const DirectMessagesView: React.FC<DirectMessagesViewProps> = ({
  initialRecipientId,
  onSelectUser
}) => {
  const { currentUser, allUsers, blockUser } = useAuth();
  const { showToast } = useNotifications();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Start new conversation modal
  const [showNewDMModal, setShowNewDMModal] = useState(false);

  // Thread options & report
  const [showThreadMenu, setShowThreadMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    if (!currentUser) return;
    try {
      setLoadingConvs(true);
      const res = await api.getConversations();
      setConversations(res.conversations || []);
      if (res.conversations?.length > 0 && !activeConvId) {
        setActiveConvId(res.conversations[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [currentUser]);

  // Handle initialRecipientId if provided
  useEffect(() => {
    if (initialRecipientId && currentUser) {
      startDMWithUser(initialRecipientId);
    }
  }, [initialRecipientId]);

  const loadMessages = async (convId: string) => {
    try {
      setLoadingMessages(true);
      const res = await api.getMessages(convId);
      setMessages(res.messages || []);
      // Mark as read in state
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c));
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
      const interval = setInterval(() => loadMessages(activeConvId), 5000);
      return () => clearInterval(interval);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startDMWithUser = async (targetUserId: string) => {
    try {
      const res = await api.startConversation(targetUserId);
      setActiveConvId(res.conversation.id);
      await loadConversations();
      setShowNewDMModal(false);
    } catch (err: any) {
      showToast(err.message || 'Could not start conversation', 'error');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !imageUrl.trim()) || !activeConvId) return;

    try {
      const attachments = imageUrl.trim() ? [{ type: 'image' as const, url: imageUrl.trim(), name: 'Image' }] : undefined;
      const res = await api.sendMessage(activeConvId, {
        content: text.trim(),
        attachments
      });
      setMessages(prev => [...prev, res.message]);
      setText('');
      setImageUrl('');
      setShowImageInput(false);
      // Update conversation last message in list
      setConversations(prev => prev.map(c => {
        if (c.id === activeConvId) {
          return {
            ...c,
            lastMessage: {
              content: res.message.content,
              senderDisplayName: res.message.senderDisplayName,
              createdAt: res.message.createdAt,
              isRead: true
            }
          };
        }
        return c;
      }));
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
    }
  };

  const activeConversation = conversations.find(c => c.id === activeConvId);
  const otherParticipant = activeConversation?.participants.find(p => p.id !== currentUser?.id);

  const handleBlockActiveUser = async () => {
    if (!otherParticipant) return;
    if (window.confirm(`Are you sure you want to block @${otherParticipant.username}?`)) {
      await blockUser(otherParticipant.id);
      showToast(`Blocked @${otherParticipant.username}`, 'info');
      setShowThreadMenu(false);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const other = c.participants.find(p => p.id !== currentUser?.id);
    if (!other) return false;
    return other.displayName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      other.username.toLowerCase().includes(searchFilter.toLowerCase());
  });

  return (
    <div
      id="direct-messages-view"
      className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm h-[calc(100vh-8rem)] flex flex-col md:flex-row"
    >
      {/* Sidebar List of Conversations */}
      <div className={`w-full md:w-80 border-r border-gray-200 dark:border-neutral-800 flex flex-col bg-white dark:bg-neutral-900/90 ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Direct Messages</h2>
          </div>
          <button
            onClick={() => setShowNewDMModal(true)}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm transition"
            title="Start new conversation"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-100 dark:border-neutral-800">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-neutral-800/40">
          {loadingConvs ? (
            <div className="py-8 text-center text-xs text-gray-400 dark:text-neutral-500">Loading messages...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500 dark:text-neutral-400 space-y-2">
              <p>No conversations yet.</p>
              <button
                onClick={() => setShowNewDMModal(true)}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Start a conversation
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const other = conv.participants.find(p => p.id !== currentUser?.id);
              const isActive = conv.id === activeConvId;

              if (!other) return null;

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full p-3.5 flex items-start gap-3 text-left transition ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-600/15 border-l-4 border-blue-600'
                      : 'hover:bg-gray-50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <img
                    src={other.avatar}
                    alt={other.displayName}
                    className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200 dark:border-neutral-700 mt-0.5"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{other.displayName}</span>
                        {other.isVerified && <VerifiedBadge size="sm" />}
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-neutral-500 shrink-0">
                        {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    <p className="text-[11px] truncate text-gray-500 dark:text-neutral-400">
                      {typeof conv.lastMessage === 'string' ? conv.lastMessage : conv.lastMessage?.content || 'Started a conversation'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active Conversation Main Thread */}
      {activeConvId && otherParticipant ? (
        <div className="flex-1 flex flex-col bg-gray-50/50 dark:bg-neutral-950/60">
          {/* Header */}
          <div className="p-3.5 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveConvId(null)}
                className="md:hidden p-1 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <button
                onClick={() => onSelectUser(otherParticipant.username)}
                className="flex items-center gap-2.5 text-left group"
              >
                <img
                  src={otherParticipant.avatar}
                  alt={otherParticipant.displayName}
                  className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-neutral-700 group-hover:border-blue-500 transition"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {otherParticipant.displayName}
                    </span>
                    {otherParticipant.isVerified && <VerifiedBadge size="sm" />}
                  </div>
                  <span className="text-[10px] text-gray-500 dark:text-neutral-400">@{otherParticipant.username}</span>
                </div>
              </button>
            </div>

            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowThreadMenu(!showThreadMenu)}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showThreadMenu && (
                <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-1.5 shadow-xl z-30 text-gray-700 dark:text-neutral-200 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setShowThreadMenu(false);
                      setShowReportModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 text-left"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Report User</span>
                  </button>
                  <button
                    onClick={handleBlockActiveUser}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 text-left"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Block @{otherParticipant.username}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
            {/* End-to-end trust indicator */}
            <div className="p-2.5 bg-white dark:bg-neutral-900/60 rounded-xl border border-gray-200 dark:border-neutral-800/80 text-[11px] text-gray-500 dark:text-neutral-400 flex items-center justify-center gap-1.5 max-w-md mx-auto text-center shadow-xs">
              <Lock className="w-3 h-3 text-gray-400" />
              <span>Direct messages are private to thread participants.</span>
            </div>

            {loadingMessages ? (
              <div className="py-8 text-center text-xs text-gray-400 dark:text-neutral-500">Loading conversation...</div>
            ) : messages.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 dark:text-neutral-500">No messages yet. Send a greeting!</div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUser?.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <img
                        src={msg.senderAvatar}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover shrink-0 mb-1 border border-gray-200 dark:border-neutral-700"
                        referrerPolicy="no-referrer"
                      />
                    )}

                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1.5 ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                          : 'bg-white dark:bg-neutral-800 text-gray-800 dark:text-neutral-100 rounded-bl-none border border-gray-200 dark:border-neutral-700 shadow-xs'
                      }`}
                    >
                      {msg.attachments?.map((att, idx) => (
                        <img
                          key={idx}
                          src={att.url}
                          alt=""
                          className="w-full max-h-56 object-cover rounded-xl mb-2"
                          referrerPolicy="no-referrer"
                        />
                      ))}
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <div className={`text-[9px] flex items-center gap-1 justify-end ${isMe ? 'text-blue-100' : 'text-gray-400 dark:text-neutral-400'}`}>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && <CheckCheck className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Image input attachment preview if active */}
          {showImageInput && (
            <div className="p-3 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 flex items-center gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Attach image URL (https://...)"
                className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  setImageUrl('');
                  setShowImageInput(false);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowImageInput(!showImageInput)}
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
              title="Attach Image URL"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Message @${otherParticipant.username}...`}
              className="flex-1 px-4 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              disabled={!text.trim() && !imageUrl.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-40 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center p-8 text-center text-xs text-gray-500 dark:text-neutral-400 space-y-3">
          <div className="max-w-sm space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Your Conversations</h3>
            <p>Select a message thread on the left or start a new direct communication.</p>
            <button
              onClick={() => setShowNewDMModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              Start New Message
            </button>
          </div>
        </div>
      )}

      {/* Start New DM Modal */}
      {showNewDMModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl text-gray-900 dark:text-neutral-100">
            <button
              onClick={() => setShowNewDMModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Start Direct Message</h3>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {allUsers
                .filter(u => u.id !== currentUser?.id)
                .map((u) => (
                  <button
                    key={u.id}
                    onClick={() => startDMWithUser(u.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-neutral-950/80 hover:bg-gray-100 dark:hover:bg-neutral-800/80 border border-gray-200 dark:border-neutral-800 text-left transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={u.avatar}
                        alt={u.displayName}
                        className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-200 dark:border-neutral-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{u.displayName}</span>
                          {u.isVerified && <VerifiedBadge size="sm" />}
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-neutral-400">@{u.username}</span>
                      </div>
                    </div>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold shrink-0">Message</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {otherParticipant && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          category="user"
          targetId={otherParticipant.id}
          targetTitleOrSnippet={`@${otherParticipant.username}`}
        />
      )}
    </div>
  );
};
