import React from 'react'
const _jsxFileName = ""; function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import { useQuery } from '@tanstack/react-query';
import API from "@/lib/api";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2 } from "lucide-react";



export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef(null);

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await API.get('/messages/conversations');
      return data.data || [];
    },
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', selectedConversation?.conversationId],
    queryFn: async () => {
      const { data } = await API.get(`/messages/${selectedConversation.conversationId}`);
      return data.data || [];
    },
    enabled: !!selectedConversation,
  });

  useEffect(() => {
    if (messages && messages.length > 0) {
      _optionalChain([endRef, 'access', _ => _.current, 'optionalAccess', _2 => _2.scrollIntoView, 'call', _3 => _3({ behavior: "smooth" })]);
    }
  }, [messages]);

  const send = async () => {
    if (!draft.trim() || !selectedConversation) return;

    try {
      setIsSending(true);
      const { data } = await API.post('/messages', {
        recipientId: selectedConversation.otherUser._id,
        content: draft.trim()
      });

      if (data.success) {
        setDraft("");
        // Refetch messages and conversations
        refetchMessages();
        refetchConversations();
        // Update unread count in header
        window.dispatchEvent(new Event('updateUnreadCount'));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      const { data } = await API.delete(`/messages/${messageId}`);
      if (data.success) {
        toast.success('Message deleted successfully');
        // Refetch messages and conversations
        refetchMessages();
        refetchConversations();
        // Update unread count in header
        window.dispatchEvent(new Event('updateUnreadCount'));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  return (
    React.createElement(React.Fragment, null
      , React.createElement(SEO, { title: "Messages", description: "Chat with other users on Actory."        , __self: this, __source: {fileName: _jsxFileName, lineNumber: 16}} )
      , React.createElement('section', { className: "container py-8 grid md:grid-cols-3 gap-6"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 17}}
        , React.createElement(Card, { className: "md:col-span-1", __self: this, __source: {fileName: _jsxFileName, lineNumber: 18}}
          , React.createElement(CardContent, { className: "p-0", __self: this, __source: {fileName: _jsxFileName, lineNumber: 19}}
            , React.createElement('div', { className: "p-4 border-b font-medium"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 20}}, "Conversations")
            , conversationsLoading ? (
              React.createElement('div', { className: "p-4 space-y-3" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 22}}
                , [1, 2, 3].map((i) => (
                  React.createElement('div', { key: i, className: "p-3 rounded-md bg-muted animate-pulse"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 24}}
                    , React.createElement('div', { className: "h-4 bg-muted-foreground/20 rounded mb-2" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 25}} )
                    , React.createElement('div', { className: "h-3 bg-muted-foreground/20 rounded w-3/4" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 26}} )
                  )
                ))
              )
            ) : conversations && conversations.length > 0 ? (
              React.createElement('div', { className: "max-h-96 overflow-y-auto" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 31}}
                , conversations.map((conv) => (
                  React.createElement('div', {
                    key: conv.conversationId,
                    className: `p-3 cursor-pointer border-b hover:bg-muted transition-colors ${selectedConversation?.conversationId === conv.conversationId ? 'bg-muted' : ''}`   ,
                    onClick: () => {
                     setSelectedConversation(conv);
                     // Update unread count after marking as read
                     setTimeout(() => window.dispatchEvent(new Event('updateUnreadCount')), 100);
                   }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 33}}
                    , React.createElement('div', { className: "flex items-center gap-3" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 37}}
                      , React.createElement(Avatar, { className: "h-10 w-10", __self: this, __source: {fileName: _jsxFileName, lineNumber: 38}}
                        , React.createElement(AvatarImage, { src: conv.otherUser.profileImage, alt: conv.otherUser.name , __self: this, __source: {fileName: _jsxFileName, lineNumber: 39}} )
                        , React.createElement(AvatarFallback, { __self: this, __source: {fileName: _jsxFileName, lineNumber: 40}}, conv.otherUser.name?.charAt(0) || 'U')
                      )
                      , React.createElement('div', { className: "flex-1 min-w-0" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 42}}
                        , React.createElement('div', { className: "flex items-center justify-between" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 43}}
                          , React.createElement('p', { className: "font-medium text-sm truncate" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 44}}, conv.otherUser.name)
                          , React.createElement('span', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 45}}, format(new Date(conv.lastMessage.createdAt), 'MMM d'))
                        )
                        , React.createElement('p', { className: "text-xs text-muted-foreground truncate" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 48}}, conv.lastMessage.content)
                        , React.createElement('div', { className: "flex items-center gap-2 mt-1" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 49}}
                          , conv.unreadCount > 0 && (
                            React.createElement(Badge, { variant: "destructive", className: "text-xs px-1 py-0" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 51}}, conv.unreadCount)
                          )
                          , React.createElement('span', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 53}}, conv.otherUser.role)
                        )
                      )
                    )
                  )
                ))
              )
            ) : (
              React.createElement('div', { className: "p-4 text-center text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 61}}, "No conversations yet")
            )
          )
        )

        , React.createElement(Card, { className: "md:col-span-2 flex flex-col"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 66}}
          , selectedConversation ? (
            React.createElement(React.Fragment, null
              , React.createElement('div', { className: "p-4 border-b" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 69}}
                , React.createElement('div', { className: "flex items-center gap-3" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 70}}
                  , React.createElement(Avatar, { className: "h-8 w-8", __self: this, __source: {fileName: _jsxFileName, lineNumber: 71}}
                    , React.createElement(AvatarImage, { src: selectedConversation.otherUser.profileImage, alt: selectedConversation.otherUser.name , __self: this, __source: {fileName: _jsxFileName, lineNumber: 72}} )
                    , React.createElement(AvatarFallback, { __self: this, __source: {fileName: _jsxFileName, lineNumber: 74}}, selectedConversation.otherUser.name?.charAt(0) || 'U')
                  )
                  , React.createElement('div', null
                    , React.createElement('p', { className: "font-medium" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 77}}, selectedConversation.otherUser.name)
                    , React.createElement('p', { className: "text-sm text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 78}}, selectedConversation.otherUser.role)
                  )
                )
              )
              , React.createElement(CardContent, { className: "flex-1 p-4 overflow-y-auto space-y-3"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 82}}
                , messagesLoading ? (
                  React.createElement('div', { className: "space-y-3" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 84}}
                    , [1, 2, 3].map((i) => (
                      React.createElement('div', { key: i, className: `max-w-[75%] p-3 rounded-lg animate-pulse ${i % 2 === 0 ? 'ml-auto bg-muted' : 'bg-muted'}` , __self: this, __source: {fileName: _jsxFileName, lineNumber: 86}}
                        , React.createElement('div', { className: "h-4 bg-muted-foreground/20 rounded" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 87}} )
                      )
                    ))
                  )
                ) : messages && messages.length > 0 ? (
                  messages.map((message) => {
                    const isFromMe = message.sender._id === JSON.parse(localStorage.getItem('user') || '{}')._id;
                    return React.createElement('div', {
                      key: message._id,
                      className: `max-w-[75%] p-3 rounded-lg relative group ${isFromMe ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted'}`,
                      __self: this,
                      __source: {fileName: _jsxFileName, lineNumber: 95}}
                      , React.createElement('p', { className: "text-sm" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 96}}, message.content)
                      , React.createElement('div', { className: "flex items-center justify-between mt-1" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 97}}
                        , React.createElement('p', { className: "text-xs opacity-70" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 98}}, format(new Date(message.createdAt), 'MMM d, h:mm a'))
                        , isFromMe && (
                          React.createElement(DropdownMenu, { __self: this, __source: {fileName: _jsxFileName, lineNumber: 100}}
                            , React.createElement(DropdownMenuTrigger, { asChild: true, __self: this, __source: {fileName: _jsxFileName, lineNumber: 101}}
                              , React.createElement('button', { className: "opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/10 rounded" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 102}}
                                , React.createElement(MoreVertical, { className: "h-3 w-3" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 103}} )
                              )
                            )
                            , React.createElement(DropdownMenuContent, { align: "end", __self: this, __source: {fileName: _jsxFileName, lineNumber: 105}}
                              , React.createElement(DropdownMenuItem, {
                                onClick: () => deleteMessage(message._id),
                                className: "text-destructive focus:text-destructive",
                                __self: this,
                                __source: {fileName: _jsxFileName, lineNumber: 106}}
                                , React.createElement(Trash2, { className: "h-4 w-4 mr-2" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 110}} )
                                , "Delete message"
                              )
                            )
                          )
                        )
                      )
                    );
                  })
                ) : (
                  React.createElement('div', { className: "text-center text-muted-foreground py-8" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 101}}, "No messages yet. Start the conversation!")
                )
                , React.createElement('div', { ref: endRef, __self: this, __source: {fileName: _jsxFileName, lineNumber: 103}} )
              )
              , React.createElement('div', { className: "p-4 border-t flex items-center gap-2"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 105}}
                , React.createElement(Input, {
                  className: "flex-1"           ,
                  placeholder: "Type a message..."  ,
                  value: draft,
                  onChange: (e) => setDraft(e.target.value),
                  onKeyPress: handleKeyPress,
                  disabled: isSending, __self: this, __source: {fileName: _jsxFileName, lineNumber: 106}}
                )
                , React.createElement(Button, {
                  variant: "default",
                  onClick: send,
                  disabled: isSending || !draft.trim(),
                  __self: this, __source: {fileName: _jsxFileName, lineNumber: 113}}
                  , isSending ? 'Sending...' : 'Send'
                )
              )
            )
          ) : (
            React.createElement('div', { className: "flex-1 flex items-center justify-center text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 121}}, "Select a conversation to start messaging")
          )
        )
      )
    )
  );
}
