'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { MessageCircle, Send, Phone, Mail, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  from: 'user' | 'support';
  createdAt: any;
}

interface Ticket {
  id: string;
  subject: string;
  status: 'open' | 'pending' | 'closed';
  createdAt: any;
  lastMessage: string;
}

const FAQS = [
  {
    question: '如何更改送貨地址？',
    answer: '你可以係「我的地址」度新增、編輯或刪除送貨地址。結帳時可以選擇已儲存既地址。'
  },
  {
    question: '我可以點樣取消訂單？',
    answer: '如果訂單尚未處理，你可以係「我的訂單」度取消訂單。如果已經開始處理，請聯絡我地既客戶服務。'
  },
  {
    question: '退款既流程係點？',
    answer: '申請退款後，我地會係3-5個工作天內處理。款項會退回到你既原有付款方式。'
  },
  {
    question: '我既個人資料會點樣處理？',
    answer: '我地非常重視你既私隱。所有個人資料都會加密儲存，並只會用於處理你既訂單。'
  },
  {
    question: '送貨時間大概要幾耐？',
    answer: '一般情況下，市區送貨大概1-2個鐘，偏遠地區可能需要2-4個鐘。'
  }
];

export default function CustomerSupportPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'faq'>('chat');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth!, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchMessages(currentUser.uid);
        await fetchTickets(currentUser.uid);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchMessages = async (userId: string) => {
    if (!db) return;
    const q = query(
      collection(db!, 'users', userId, 'supportMessages'),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
    setMessages(msgs);
  };

  const fetchTickets = async (userId: string) => {
    if (!db) return;
    const q = query(
      collection(db!, 'users', userId, 'supportTickets'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const tks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
    setTickets(tks);
  };

  const handleSendMessage = async () => {
    if (!user || !message.trim() || !db) return;

    setSending(true);
    try {
      // Add user message
      await addDoc(collection(db!, 'users', user.uid, 'supportMessages'), {
        content: message,
        from: 'user',
        createdAt: serverTimestamp()
      });

      // Create or update ticket
      if (tickets.length === 0) {
        await addDoc(collection(db!, 'users', user.uid, 'supportTickets'), {
          subject: '一般查詢',
          status: 'open',
          lastMessage: message,
          createdAt: serverTimestamp()
        });
      } else {
        // Update latest ticket
        const latestTicket = tickets[0];
        await import('firebase/firestore').then(({ doc, updateDoc }) => 
          updateDoc(doc(db!, 'users', user.uid, 'supportTickets', latestTicket.id), {
            lastMessage: message,
            updatedAt: serverTimestamp()
          })
        );
      }

      setMessage('');
      await fetchMessages(user.uid);
      await fetchTickets(user.uid);

      // Simulate auto-reply after a short delay
      setTimeout(async () => {
        await addDoc(collection(db!, 'users', user.uid, 'supportMessages'), {
          content: '多謝你既訊息！我地既客戶服務團隊會係工作時間內盡快回覆你。一般處理時間為1-2個工作天。',
          from: 'support',
          createdAt: serverTimestamp()
        });
        await fetchMessages(user.uid);
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">客戶服務</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
            activeTab === 'chat' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600'
          }`}
        >
          <MessageCircle className="w-5 h-5" /> 在線客服
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
            activeTab === 'faq' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600'
          }`}
        >
          ❓ 常見問題
        </button>
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Contact Info */}
          <div className="bg-purple-50 p-4 border-b">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-purple-700">
                <Mail className="w-4 h-4" />
                <span className="text-sm">support@shopsagi.com</span>
              </div>
              <div className="flex items-center gap-2 text-purple-700">
                <Clock className="w-4 h-4" />
                <span className="text-sm">回覆時間：1-2工作天</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>有任何問題都可以搵我地！</p>
                <p className="text-sm">一般會係1-2個工作天內回覆</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.from === 'user'
                        ? 'bg-purple-600 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    }`}
                  >
                    <p>{msg.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="輸入你想問既問題..."
                className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || sending}
                className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-3">
          {FAQS.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl border overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                className="w-full p-4 text-left flex justify-between items-center"
              >
                <span className="font-medium">{faq.question}</span>
                {expandedFAQ === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {expandedFAQ === index && (
                <div className="px-4 pb-4 text-gray-600">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
