import { useState } from 'react';
import { format } from 'date-fns';
import { Mail, Send, Reply, MessageSquare, Plus, User, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetMessages, useSendMessage, useMarkAsRead } from '@/hooks/useMessages';
import { useGetStudents } from '@/hooks/useStudents';
import { useGetLecturers } from '@/hooks/useLecturers';
import { useAuth } from '@/hooks/useAuth';

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  recipientRole: string;
  subject: string;
  body: string;
  read: boolean;
  createdAt: string;
  parentId?: string;
};

export function Inbox({ role }: { role: 'student' | 'lecturer' }) {
  const { user } = useAuth();
  const [folder, setFolder] = useState('inbox');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Compose form state
  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const { data: messages, isLoading } = useGetMessages({ userId: user?.id, folder });
  const { data: students } = useGetStudents();
  const { data: lecturers } = useGetLecturers();
  const { mutate: sendMessage } = useSendMessage();
  const { mutate: markRead } = useMarkAsRead();

  const allMessages = (messages as Message[]) ?? [];
  const allStudents = (students as Record<string, unknown>[]) ?? [];
  const allLecturers = (lecturers as Record<string, unknown>[]) ?? [];

  const selected = selectedId ? allMessages.find((m) => m.id === selectedId) ?? null : null;

  function handleSelect(msg: Message) {
    setSelectedId(msg.id);
    setReplyText('');
    if (!msg.read && msg.recipientId === user?.id) {
      markRead(msg.id);
    }
  }

  function handleSendReply() {
    if (!selected || !replyText.trim()) return;
    sendMessage({
      senderId: user?.id,
      senderName: user?.name,
      senderRole: role,
      recipientId: selected.senderId,
      recipientName: selected.senderName,
      recipientRole: selected.senderRole,
      subject: `Re: ${selected.subject}`,
      body: replyText.trim(),
      parentId: selected.parentId ?? selected.id,
    });
    setReplyText('');
  }

  function handleNewMessage() {
    if (!recipientId || !subject.trim() || !body.trim()) return;
    const recipientList = role === 'student' ? allLecturers : allStudents;
    const recipient = recipientList.find((r) => r.id === recipientId);
    sendMessage({
      senderId: user?.id,
      senderName: user?.name,
      senderRole: role,
      recipientId,
      recipientName: recipient?.name ?? '',
      recipientRole: role === 'student' ? 'lecturer' : 'student',
      subject: subject.trim(),
      body: body.trim(),
    });
    setComposeOpen(false);
    setRecipientId('');
    setSubject('');
    setBody('');
  }

  function resetCompose() {
    setRecipientId('');
    setSubject('');
    setBody('');
    setComposeOpen(false);
  }

  const unreadCount = allMessages.filter((m) => !m.read && m.recipientId === user?.id).length;

  return (
    <div>
      <PageHeader
        title="Messages"
        description={role === 'student' ? 'Communicate with your lecturers' : 'Communicate with your students'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <Tabs value={folder} onValueChange={(v) => { setFolder(v); setSelectedId(null); }}>
              <TabsList className="h-8">
                <TabsTrigger value="inbox" className="text-xs px-3 gap-1">
                  <Mail className="size-3.5" />
                  Inbox
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-0.5 text-xs px-1 py-0">{unreadCount}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent" className="text-xs px-3 gap-1">
                  <Send className="size-3.5" />
                  Sent
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button size="sm" className="gap-1 text-xs h-8" onClick={() => setComposeOpen(true)}>
              <Plus className="size-3.5" /> Compose
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : allMessages.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">
              <MessageSquare className="size-8 mx-auto mb-2 text-muted-foreground/40" />
              No messages yet.
            </CardContent></Card>
          ) : (
            <div className="space-y-1">
              {allMessages.map((msg) => {
                const isUnread = !msg.read && msg.recipientId === user?.id;
                const isSelected = selectedId === msg.id;
                const displayName = folder === 'inbox' ? msg.senderName : msg.recipientName;
                return (
                  <button
                    key={msg.id}
                    onClick={() => handleSelect(msg)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:bg-accent'
                    } ${isUnread ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isUnread ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        <User className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs truncate ${isUnread ? 'font-semibold' : ''}`}>
                            {displayName}
                          </span>
                          {isUnread && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${isUnread ? 'font-medium' : 'text-muted-foreground'}`}>
                          {msg.subject}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {format(new Date(msg.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <Card className="min-h-[400px] flex flex-col">
              <CardContent className="py-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-semibold text-sm">{selected.subject}</h2>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="size-3" />{selected.senderName}</span>
                      <ChevronRight className="size-3" />
                      <span>{selected.recipientName}</span>
                      <span>&middot; {format(new Date(selected.createdAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0 capitalize">{selected.senderRole}</Badge>
                </div>

                <Separator />

                <div className="py-4 text-sm whitespace-pre-line leading-relaxed flex-1">
                  {selected.body}
                </div>

                <Separator />

                {/* Reply */}
                {folder === 'inbox' && (
                  <div className="pt-4 space-y-3">
                    <Label htmlFor="reply" className="text-xs font-medium flex items-center gap-1.5">
                      <Reply className="size-3" /> Reply
                    </Label>
                    <Textarea
                      id="reply"
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                    />
                    <Button size="sm" className="gap-1" onClick={handleSendReply} disabled={!replyText.trim()}>
                      <Send className="size-3" /> Send Reply
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="min-h-[400px]">
              <CardContent className="py-16 text-center text-muted-foreground">
                <MessageSquare className="size-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm">Select a message to read</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={(open) => { if (!open) resetCompose(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">
                To ({role === 'student' ? 'Lecturer' : 'Student'})
              </Label>
              <Select value={recipientId} onValueChange={setRecipientId}>
                <SelectTrigger id="recipient">
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {(role === 'student' ? allLecturers : allStudents).map((r) => (
                    <SelectItem key={String(r.id)} value={String(r.id)}>
                      {String(r.name ?? r.firstName + ' ' + r.lastName)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Type your message..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetCompose}>Cancel</Button>
            <Button onClick={handleNewMessage} disabled={!recipientId || !subject.trim() || !body.trim()}>
              <Send className="size-3.5 mr-1" /> Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
