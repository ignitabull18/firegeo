'use client';

import { useConversations, useConversation, useDeleteConversation } from '@/hooks/useConversations';
import { useSendMessage } from '@/hooks/useMessages';
import { useSession } from '@/lib/auth-client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Message } from '@/lib/db/schema';

import { Send, MessageCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { data: conversations, isLoading: conversationsLoading, refetch: refetchConversations } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const { data: conversationData, isLoading: messagesLoading, refetch: refetchMessages } = useConversation(selectedConversation);
  const sendMessageMutation = useSendMessage();
  const deleteConversationMutation = useDeleteConversation();
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const messages = useMemo(() => {
    return conversationData?.messages || [];
  }, [conversationData?.messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  if (isPending || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await sendMessageMutation.mutateAsync({
        message: input.trim(),
        conversationId: selectedConversation || undefined,
      });
      setInput('');
      await refetchMessages();
      await refetchConversations();
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startNewConversation = () => {
    setSelectedConversation(null);
    setInput('');
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      await deleteConversationMutation.mutateAsync(conversationId);
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
      }
      await refetchConversations();
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const formatMessageContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Chat</h1>
          <p className="text-gray-600">Chat with AI assistants for help and information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Conversations */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Conversations
                  </span>
                  <Button
                    onClick={startNewConversation}
                    size="sm"
                    className="btn-firecrawl-orange"
                  >
                    New Chat
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conversationsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : conversations && conversations.length > 0 ? (
                  <div className="space-y-2">
                    {conversations.map((conversation) => (
                      <div key={conversation.id} className="flex items-center justify-between">
                        <button
                          onClick={() => setSelectedConversation(conversation.id)}
                          className={`flex-1 text-left p-2 rounded-lg text-sm hover:bg-gray-100 ${
                            selectedConversation === conversation.id ? 'bg-gray-100 font-medium' : ''
                          }`}
                        >
                          <div className="truncate">
                            {conversation.title || 'New Conversation'}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {conversation.messages && conversation.messages.length > 0
                              ? conversation.messages[conversation.messages.length - 1].content.substring(0, 50)
                              : 'No messages yet'}
                          </div>
                        </button>
                        <Button
                          onClick={() => deleteConversation(conversation.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          disabled={deleteConversationMutation.isPending}
                        >
                          {deleteConversationMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            '×'
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm py-4 text-center">
                    No conversations yet. Start a new chat!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  {selectedConversation ? conversationData?.title || 'Chat' : 'New Chat'}
                </CardTitle>
              </CardHeader>
              
              {/* Messages Area */}
              <CardContent className="flex-1 overflow-y-auto p-4">
                {messagesLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageCircle className="h-12 w-12 mb-4" />
                    <p>Start a conversation by typing a message below</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message: Message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">
                            {formatMessageContent(message.content)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </CardContent>

              {/* Input Form */}
              <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isSubmitting}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || isSubmitting}
                    className="btn-firecrawl-orange"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}