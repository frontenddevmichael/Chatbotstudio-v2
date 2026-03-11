import { useParams } from 'react-router-dom';
import { useChatbot } from '@/hooks/useChatbot';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import Spinner from '@/components/ui/Spinner';
import { Copy, ExternalLink, Code, MessageSquare, Link as LinkIcon, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

type EmbedVariant = 'sdk' | 'floating' | 'iframe' | 'link';

const DeployPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: chatbot, isLoading } = useChatbot(id!);
  const [variant, setVariant] = useState<EmbedVariant>('sdk');

  if (isLoading) return <PageWrapper><div className="flex justify-center py-20"><Spinner className="h-6 w-6" /></div></PageWrapper>;
  if (!chatbot) return <PageWrapper><p className="text-[13px] text-muted-foreground">Chatbot not found</p></PageWrapper>;

  const getPublishedOrigin = () => {
    const origin = window.location.origin;
    if (origin.includes('-preview--') && origin.includes('.lovable.app')) {
      return 'https://ideaweave-bot.lovable.app';
    }
    return origin;
  };

  const baseUrl = getPublishedOrigin();
  const widgetUrl = `${baseUrl}/widget/${chatbot.embed_token}`;
  const embedJsUrl = `${baseUrl}/embed.js`;
  const primaryColor = chatbot.primary_color || '#0a84ff';

  const codes: Record<EmbedVariant, { label: string; icon: React.ElementType; code: string; desc: string }> = {
    sdk: {
      label: 'SDK (Recommended)',
      icon: Zap,
      desc: 'Lightweight launcher with toggle bubble, lazy loading, and mobile support',
      code: `<!-- ChatBot Studio Embed -->\n<script>\n  window.$chatbot = {\n    id: "${chatbot.embed_token}",\n    color: "${primaryColor}",\n    position: "bottom-right",\n    width: 400,      // optional: 320–700\n    height: 600,     // optional: 400–900\n    // autoOpen: 5000 // optional: auto-open after ms\n  };\n</script>\n<script src="${embedJsUrl}" async></script>`,
    },
    floating: {
      label: 'Floating Widget',
      icon: MessageSquare,
      desc: 'Fixed bubble in the bottom-right corner of your site (no toggle)',
      code: `<script>\n(function(){\n  var d=document,s=d.createElement('iframe');\n  s.src='${widgetUrl}';\n  s.style='position:fixed;bottom:20px;right:20px;width:380px;height:560px;border:none;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.3);z-index:9999';\n  d.body.appendChild(s);\n})();\n</script>`,
    },
    iframe: {
      label: 'Inline Iframe',
      icon: Code,
      desc: 'Embed directly in a page section',
      code: `<iframe src="${widgetUrl}" width="400" height="600" frameborder="0" style="border-radius:14px;box-shadow:0 4px 24px rgba(0,0,0,0.15)"></iframe>`,
    },
    link: {
      label: 'Direct Link',
      icon: LinkIcon,
      desc: 'Share a standalone URL to the chatbot',
      code: widgetUrl,
    },
  };

  const current = codes[variant];
  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copied to clipboard'); };

  const variants: EmbedVariant[] = ['sdk', 'floating', 'iframe', 'link'];

  return (
    <PageWrapper>
      <SEO title={`Deploy — ${chatbot.name}`} noIndex />
      <div className="max-w-[640px]">
        <h1 className="text-[22px] font-semibold text-foreground mb-6">Deploy — {chatbot.name}</h1>

        {/* Preview link */}
        <div className="mb-4 rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="mb-3 flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
            <ExternalLink className="h-3.5 w-3.5 text-primary" /> Preview Link
          </h3>
          <div className="flex items-center gap-2">
            <input readOnly value={widgetUrl} className="flex-1 rounded-[10px] border border-border bg-[hsl(var(--color-surface-3))] px-3 py-2 font-mono text-[12px] text-foreground" />
            <button onClick={() => copy(widgetUrl)} className="rounded-[10px] bg-primary px-3 py-2 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all">
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          <a href={widgetUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[12px] text-primary hover:underline">
            Open in new tab <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Variant selector */}
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {variants.map((v) => {
            const c = codes[v];
            const Icon = c.icon;
            return (
              <button
                key={v}
                onClick={() => setVariant(v)}
                className={`flex items-center gap-2 rounded-[10px] border px-3 py-2.5 text-[13px] font-medium transition-all ${
                  variant === v
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/20'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* Code block */}
        <div className="rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="mb-1 flex items-center gap-2 text-[13px] font-medium text-foreground">
            <current.icon className="h-3.5 w-3.5 text-primary" /> {current.label}
          </h3>
          <p className="mb-3 text-[12px] text-muted-foreground">{current.desc}</p>
          <pre className="overflow-x-auto rounded-[10px] bg-[hsl(var(--color-surface-3))] p-3 font-mono text-[12px] text-foreground whitespace-pre-wrap break-all">{current.code}</pre>
          <button onClick={() => copy(current.code)} className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline">
            <Copy className="h-3 w-3" /> Copy
          </button>

          {variant === 'sdk' && (
            <div className="mt-4 rounded-[10px] border border-border bg-muted/30 p-3">
              <p className="text-[12px] font-medium text-foreground mb-1">Public API</p>
              <pre className="text-[11px] font-mono text-muted-foreground leading-relaxed">{`window.ChatBotStudio.open()   // Open widget
window.ChatBotStudio.close()  // Close widget
window.ChatBotStudio.toggle() // Toggle
window.ChatBotStudio.setUser({ name, email })`}</pre>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default DeployPage;
