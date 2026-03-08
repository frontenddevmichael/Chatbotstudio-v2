import { useParams } from 'react-router-dom';
import { useChatbot } from '@/hooks/useChatbot';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import AdBanner from '@/components/ads/AdBanner';
import Spinner from '@/components/ui/Spinner';
import { Copy, ExternalLink, Code } from 'lucide-react';
import { toast } from 'sonner';

const DeployPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: chatbot, isLoading } = useChatbot(id!);

  if (isLoading) return <PageWrapper><div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div></PageWrapper>;
  if (!chatbot) return <PageWrapper><p className="text-muted-foreground">Chatbot not found</p></PageWrapper>;

  const widgetUrl = `${window.location.origin}/widget/${chatbot.embed_token}`;
  const embedCode = `<iframe src="${widgetUrl}" width="400" height="600" frameborder="0" style="border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.15)"></iframe>`;
  const scriptCode = `<script>\n(function(){\n  var d=document,s=d.createElement('iframe');\n  s.src='${widgetUrl}';\n  s.style='position:fixed;bottom:20px;right:20px;width:380px;height:560px;border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.15);z-index:9999';\n  d.body.appendChild(s);\n})();\n</script>`;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <PageWrapper>
      <SEO title={`Deploy - ${chatbot.name}`} noIndex />
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Deploy — {chatbot.name}</h1>

      <div className="space-y-6">
        {/* Preview link */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <ExternalLink className="h-4 w-4 text-primary" /> Preview Link
          </h3>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={widgetUrl}
              className="flex-1 rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs text-foreground"
            />
            <button onClick={() => copy(widgetUrl)} className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90">
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <a href={widgetUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
            Open in new tab <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Embed code */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Code className="h-4 w-4 text-primary" /> Iframe Embed
          </h3>
          <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs text-foreground">{embedCode}</pre>
          <button onClick={() => copy(embedCode)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <Copy className="h-3 w-3" /> Copy embed code
          </button>
        </div>

        {/* Script embed */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Code className="h-4 w-4 text-primary" /> Floating Widget Script
          </h3>
          <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs text-foreground">{scriptCode}</pre>
          <button onClick={() => copy(scriptCode)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <Copy className="h-3 w-3" /> Copy script
          </button>
        </div>

        <AdBanner />
      </div>
    </PageWrapper>
  );
};

export default DeployPage;
