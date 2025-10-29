import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Conversation, ConversationMessage } from "@shared/schema";

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: conversations, isLoading: loadingConversations } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
    enabled: isOpen,
  });

  const { data: conversationData } = useQuery<Conversation & { messages: ConversationMessage[] }>({
    queryKey: ['/api/conversations', currentConversation],
    enabled: !!currentConversation,
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/conversations', { 
        title: `Chat - ${new Date().toLocaleDateString()}` 
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setCurrentConversation(data.id);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const res = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, { 
        content 
      });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', variables.conversationId] });
      setMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationData?.messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    const messageToSend = message;

    if (!currentConversation) {
      createConversationMutation.mutate(undefined, {
        onSuccess: (newConversation) => {
          setCurrentConversation(newConversation.id);
          sendMessageMutation.mutate({ 
            conversationId: newConversation.id, 
            content: messageToSend 
          });
        }
      });
    } else {
      sendMessageMutation.mutate({ 
        conversationId: currentConversation, 
        content: messageToSend 
      });
    }
  };

  const startNewChat = () => {
    setCurrentConversation(null);
    setMessage("");
    createConversationMutation.mutate();
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform"
        data-testid="button-open-chatbot"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl flex flex-col z-50" data-testid="card-chatbot">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Assistant
        </CardTitle>
        <div className="flex gap-2">
          {currentConversation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={startNewChat}
              data-testid="button-new-chat"
            >
              New Chat
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            data-testid="button-close-chatbot"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 overflow-hidden p-0">
        {loadingConversations ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !currentConversation ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Sparkles className="h-16 w-16 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Welcome to AI Assistant</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ask me anything about property management, maintenance, payments, or general questions.
            </p>
            <Button onClick={startNewChat} data-testid="button-start-chat">
              Start New Conversation
            </Button>

            {conversations && conversations.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="w-full">
                  <p className="text-sm font-medium mb-2">Recent Conversations</p>
                  <ScrollArea className="h-40">
                    {conversations.map((conv) => (
                      <Button
                        key={conv.id}
                        variant="ghost"
                        className="w-full justify-start text-left mb-1"
                        onClick={() => setCurrentConversation(conv.id)}
                        data-testid={`button-conversation-${conv.id}`}
                      >
                        <div className="truncate">
                          <div className="font-medium truncate">{conv.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString() : ''}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </ScrollArea>
                </div>
              </>
            )}
          </div>
        ) : (
          <ScrollArea className="h-full p-4" ref={scrollRef}>
            {conversationData?.messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                data-testid={`message-${msg.role}-${idx}`}
              >
                <div
                  className={`inline-block max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}
                  </span>
                </div>
              </div>
            ))}
            {sendMessageMutation.isPending && (
              <div className="text-left mb-4">
                <div className="inline-block bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>

      {currentConversation && (
        <>
          <Separator />
          <CardFooter className="p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex w-full gap-2"
            >
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={sendMessageMutation.isPending}
                data-testid="input-chat-message"
              />
              <Button
                type="submit"
                size="icon"
                disabled={sendMessageMutation.isPending || !message.trim()}
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
