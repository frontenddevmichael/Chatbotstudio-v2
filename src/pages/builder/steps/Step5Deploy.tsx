import { Sparkles, Copy, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Props {
  embedToken: string;
  primaryColor: string;
  botId: string | null;
}

const getPublishedOrigin = () => {
  const origin = window.location.origin;
  if (origin.includes('-preview--') && origin.includes('.lovable.app')) return 'https://ideaweave-bot.lovable.app';
  return origin;
};

const Step5Deploy = ({ embedToken, primaryColor, botId }: Props) => {
  const navigate = useNavigate();
  const baseUrl = getPublishedOrigin();
  const widgetUrl = embedToken ? `${baseUrl}/widget/${embedToken}` : '';
  const embedJsUrl = `${baseUrl}/embed.js`;
  const sdkSnippet = embedToken
    ? `<!-- ChatBot Studio Embed -->\n<script>\n  window.$chatbot = {\n    id: "${embedToken}",\n    color: "${primaryColor}",\n    position: "bottom-right"\n  };\n</script>\n<script src="${embedJsUrl}" async></script>`
    : '';

  return (
    <div className="space-y-6 text-center">
      <Sparkles className="mx-auto h-10 w-10 text-primary" />
      <h2 className="text-[22px] font-semibold text-foreground">Your chatbot is ready!</h2>
      <p className="text-[13px] text-muted-foreground">Deploy it anywhere with the SDK embed code</p>
      {embedToken ? (
        <>
          <div className="rounded-[14px] border border-border bg-card p-4 text-left">
            <p className="mb-2 text-[11px] font-medium tracking-[0.06em] uppercase text-muted-foreground">SDK Embed Code</p>
            <pre className="overflow-x-auto rounded-[10px] bg-[hsl(var(--color-surface-3))] p-3 font-mono text-[12px] text-foreground whitespace-pre-wrap">{sdkSnippet}</pre>
            <button type="button" onClick={() => { navigator.clipboard.writeText(sdkSnippet); toast.success('Copied!'); }} className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline">
              <Copy className="h-3 w-3" /> Copy code
            </button>
          </div>
          <a href={widgetUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline">
            <ExternalLink className="h-3.5 w-3.5" /> Open live preview
          </a>
        </>
      ) : (
        <p className="text-[13px] text-muted-foreground">Embed code will be available after saving.</p>
      )}
      <div>
        <button
          type="button"
          onClick={() => navigate(botId ? `/chatbot/${botId}` : '/dashboard')}
          className="rounded-[10px] bg-primary px-6 py-2.5 text-[15px] font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Step5Deploy;
