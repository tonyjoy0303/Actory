import React, { useState } from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import API from "@/lib/api";

const ContactModal = ({ recipientId, recipientName, onClose }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setIsSending(true);
      const { data } = await API.post('/messages', {
        recipientId,
        content: message.trim()
      });

      if (data.success) {
        toast.success(`Message sent to ${recipientName}`);
        setMessage('');
        onClose();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Contact {recipientName}</DialogTitle>
        <DialogDescription>
          Send a message to {recipientName} through Actory's messaging system.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid gap-2">
          <label htmlFor="message" className="text-sm font-medium">
            Your Message
          </label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px]"
            placeholder="Write your message here..."
            disabled={isSending}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSending}>
          Cancel
        </Button>
        <Button onClick={handleSendMessage} disabled={isSending || !message.trim()}>
          {isSending ? 'Sending...' : 'Send Message'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default ContactModal;