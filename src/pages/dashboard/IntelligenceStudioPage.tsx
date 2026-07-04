import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import ToolGuide from '@/components/ui/ToolGuide';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Download, Tag, MessageSquare, User, Bot, X, Plus, Calendar } from 'lucide-react';

interface Conversation {
  id: string;
  chatbot_id: string;
  session_id: string;
  visitor_id: string;
  messages: Array<{ role: string; content: string }>;
  started_at: string;
  last_message_at: string;
}

interface Annotation {
  id: string;
  conversation_id: string;
  user_id: string;
  annotation: string;
  message_index: number;
  created_at: string;
}

interface Tag_ {
  id: string;
  conversation_id: string;
  tag: string;
  created_at: string;
}

const IntelligenceStudioPage = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [tags, setTags] = useState<Tag_[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [annotationIndex, setAnnotationIndex] = useState<number | null>(null);
  const [newTag, setNewTag] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!chatbotId) return;
    let cancelled = false;
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const { data, error: convErr } = await supabase
          .from('conversations')
          .select('*')
          .eq('chatbot_id', chatbotId)
          .order('last_message_at', { ascending: false })
          .limit(50);
        if (convErr) throw convErr;

        const { data: tagData } = await supabase
          .from('conversation_tags')
          .select('tag')
          .in('conversation_id', (data || []).map(c => c.id));
        const uniqueTags = [...new Set((tagData || []).map((t: Tag_) => t.tag))];

        if (!cancelled) {
          setConversations(data as Conversation[] || []);
          setAvailableTags(uniqueTags);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load conversations:', err);
          setLoading(false);
        }
      }
    };
    fetchConversations();
    return () => { cancelled = true; };
  }, [chatbotId]);

  const selectConversation = async (conv: Conversation) => {
    setSelectedConv(conv);
    const { data: annoData } = await supabase
      .from('conversation_annotations')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });
    setAnnotations(annoData as Annotation[] || []);

    const { data: tagData } = await supabase
      .from('conversation_tags')
      .select('*')
      .eq('conversation_id', conv.id);
    setTags(tagData as Tag_[] || []);
  };

  const handleAddAnnotation = async () => {
    if (!selectedConv || !newAnnotation.trim() || !user) return;
    const { error } = await supabase.from('conversation_annotations').insert({
      conversation_id: selectedConv.id,
      user_id: user.id,
      annotation: newAnnotation.trim(),
      message_index: annotationIndex,
    });
    if (error) {
      toast.error(error.message || 'Failed to add annotation');
    } else {
      toast.success('Annotation added');
      setNewAnnotation('');
      setAnnotationIndex(null);
      const { data } = await supabase
        .from('conversation_annotations')
        .select('*')
        .eq('conversation_id', selectedConv.id)
        .order('created_at', { ascending: true });
      setAnnotations(data as Annotation[] || []);
    }
  };

  const handleAddTag = async () => {
    if (!selectedConv || !newTag.trim()) return;
    const { error } = await supabase.from('conversation_tags').insert({
      conversation_id: selectedConv.id,
      tag: newTag.trim().toLowerCase(),
    });
    if (error) {
      toast.error(error.message || 'Failed to add tag');
    } else {
      toast.success('Tag added');
      setNewTag('');
      const { data } = await supabase
        .from('conversation_tags')
        .select('*')
        .eq('conversation_id', selectedConv.id);
      setTags(data as Tag_[] || []);
      if (!availableTags.includes(newTag.trim().toLowerCase())) {
        setAvailableTags(prev => [...prev, newTag.trim().toLowerCase()]);
      }
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    const { error } = await supabase.from('conversation_tags').delete().eq('id', tagId);
    if (!error) {
      setTags(prev => prev.filter(t => t.id !== tagId));
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    if (!selectedConv) return;
    setExporting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-conversation?conversation_id=${selectedConv.id}&format=${format}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${selectedConv.id}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Conversation exported');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (searchQuery) {
      const text = (conv.messages || []).map(m => m.content).join(' ').toLowerCase();
      if (!text.includes(searchQuery.toLowerCase())) return false;
    }
    if (tagFilter) {
      return tags.some(t => t.tag === tagFilter);
    }
    return true;
  });

  if (loading) {
    return (
      <PageWrapper>
        <SEO title="Intelligence Studio" noIndex />
        <div className="flex-1 min-w-0">
          <div className="mb-4 h-4 w-12 rounded bg-muted animate-pulse" />
          <div className="mb-4">
            <div className="h-6 w-72 rounded bg-muted animate-pulse" />
            <div className="mt-1 h-4 w-96 rounded bg-muted animate-pulse" />
          </div>
          <div className="mb-4 flex items-center gap-3">
            <div className="h-10 w-64 rounded-[10px] bg-muted animate-pulse" />
            <div className="h-10 w-28 rounded-[10px] bg-muted animate-pulse" />
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-[14px] border border-border bg-card p-4 animate-pulse" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-muted" />
                    <div className="h-3.5 w-32 rounded bg-muted" />
                  </div>
                  <div className="h-3 w-20 rounded bg-muted" />
                </div>
                <div className="h-3 w-full rounded bg-muted" />
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-5 w-20 rounded-full bg-muted" />
                  <div className="h-3 w-4 rounded bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <SEO title="Conversation Intelligence Studio" noIndex />
      <div className="flex-1 min-w-0">
        <button
          onClick={() => { if (selectedConv) { setSelectedConv(null); } else { navigate(-1); } }}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {selectedConv ? 'Back to list' : 'Back'}
        </button>

        {!selectedConv ? (
          <>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <h1 className="text-[22px] font-semibold text-foreground">Conversation Intelligence Studio</h1>
              <p className="mt-1 text-[13px] text-muted-foreground">Review, annotate, and export conversations.</p>
            </motion.div>

            <ToolGuide
              storageKey="walkthrough-intelligence"
              title="How Intelligence Studio works"
              description="Browse past conversations, search for specific content, annotate messages with notes, tag conversations for organization, and export data for external analysis."
              steps={[
                'Use the search bar to find conversations containing specific keywords or phrases.',
                'Click any conversation to open it — you\'ll see the full message history with user and bot messages.',
                'Click "+ Annotate" on any message to add a note. Annotations are visible in the sidebar under "All Annotations".',
                'Add tags to conversations for filtering. Use the tag filter dropdown to narrow the conversation list.',
              ]}
            />

            <div className="mt-4 mb-4 flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages..."
                  className="w-full rounded-[10px] border border-border bg-background pl-9 pr-3.5 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              {availableTags.length > 0 && (
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="rounded-[10px] border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">All tags</option>
                  {availableTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              )}
            </div>

            {filteredConversations.length === 0 ? (
              <div className="rounded-[14px] border border-border bg-card p-8 text-center" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <p className="text-[13px] text-muted-foreground">No conversations found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConversations.map((conv, i) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="rounded-[14px] border border-border bg-card p-4 cursor-pointer transition-all hover:border-border/80 hover:shadow-sm active:scale-[0.99]"
                    style={{ boxShadow: 'var(--shadow-sm)' }}
                    onClick={() => selectConversation(conv)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[13px] font-medium text-foreground">
                          {conv.session_id?.slice(0, 12)}...
                        </span>
                        {conv.visitor_id && (
                          <span className="text-[11px] text-muted-foreground">— {conv.visitor_id?.slice(0, 12)}...</span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-[12px] text-muted-foreground line-clamp-2">
                      {(conv.messages || []).slice(-1).map(m => m.content).join(' ')}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground bg-[hsl(var(--color-surface-1))] px-2 py-0.5 rounded-full">
                        {(conv.messages || []).length} messages
                      </span>
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {conv.started_at ? new Date(conv.started_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[14px] border border-border bg-card p-5"
                style={{ boxShadow: 'var(--shadow-sm)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[15px] font-semibold text-foreground">Session Replay</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExport('json')}
                      disabled={exporting}
                      className="inline-flex items-center gap-1 rounded-[8px] border border-border px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-[hsl(var(--color-surface-1))] transition-colors"
                    >
                      <Download className="h-3 w-3" /> JSON
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      disabled={exporting}
                      className="inline-flex items-center gap-1 rounded-[8px] border border-border px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-[hsl(var(--color-surface-1))] transition-colors"
                    >
                      <Download className="h-3 w-3" /> CSV
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {(selectedConv.messages || []).map((msg, idx) => {
                    const msgAnnotations = annotations.filter(a => a.message_index === idx);
                    return (
                      <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? '' : 'flex-row-reverse'}`}>
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                          msg.role === 'user' ? 'bg-primary/10' : 'bg-[hsl(var(--color-surface-2))]'
                        }`}>
                          {msg.role === 'user' ? <User className="h-3.5 w-3.5 text-primary" /> : <Bot className="h-3.5 w-3.5 text-muted-foreground" />}
                        </div>
                        <div className={`flex-1 max-w-[80%] ${msg.role === 'user' ? '' : 'text-right'}`}>
                          <div className={`rounded-[12px] px-3.5 py-2.5 text-[13px] leading-relaxed inline-block text-left ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-[hsl(var(--color-surface-1))] text-foreground'
                          }`}>
                            {msg.content}
                          </div>
                          {msgAnnotations.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {msgAnnotations.map(a => (
                                <div key={a.id} className="text-[11px] text-warning bg-warning/5 rounded-[6px] px-2 py-1">
                                  {a.annotation}
                                </div>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() => setAnnotationIndex(idx)}
                            className={`mt-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors ${
                              annotationIndex === idx ? 'text-primary' : ''
                            }`}
                          >
                            + Annotate
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {annotationIndex !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[14px] border border-border bg-card p-4"
                  style={{ boxShadow: 'var(--shadow-sm)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-medium text-foreground">Add Annotation (message #{annotationIndex})</span>
                    <button onClick={() => setAnnotationIndex(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAnnotation}
                      onChange={(e) => setNewAnnotation(e.target.value)}
                      placeholder="Write an annotation..."
                      className="flex-1 rounded-[8px] border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      onClick={handleAddAnnotation}
                      className="rounded-[8px] bg-primary px-4 py-2 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="rounded-[14px] border border-border bg-card p-5"
                style={{ boxShadow: 'var(--shadow-sm)' }}
              >
                <h3 className="text-[13px] font-semibold text-foreground mb-3">Details</h3>
                <div className="space-y-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Session ID</span>
                    <span className="text-foreground font-mono text-[10px]">{selectedConv.session_id?.slice(0, 16)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Visitor ID</span>
                    <span className="text-foreground font-mono text-[10px]">{selectedConv.visitor_id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Started</span>
                    <span className="text-foreground">{selectedConv.started_at ? new Date(selectedConv.started_at).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Messages</span>
                    <span className="text-foreground">{(selectedConv.messages || []).length}</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="rounded-[14px] border border-border bg-card p-5"
                style={{ boxShadow: 'var(--shadow-sm)' }}
              >
                <h3 className="text-[13px] font-semibold text-foreground mb-3">Tags</h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {tags.map(t => (
                    <span key={t.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] text-primary">
                      {t.tag}
                      <button onClick={() => handleRemoveTag(t.id)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    className="flex-1 rounded-[8px] border border-border bg-background px-3 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={handleAddTag}
                    className="rounded-[8px] bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="rounded-[14px] border border-border bg-card p-5"
                style={{ boxShadow: 'var(--shadow-sm)' }}
              >
                <h3 className="text-[13px] font-semibold text-foreground mb-3">All Annotations</h3>
                {annotations.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">No annotations yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {annotations.map(a => (
                      <div key={a.id} className="rounded-[8px] bg-[hsl(var(--color-surface-1))] p-2.5">
                        <p className="text-[12px] text-foreground">{a.annotation}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Message #{a.message_index ?? 'N/A'} — {new Date(a.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default IntelligenceStudioPage;
