import { useEffect, useRef } from 'react';

export interface ChatBotWidgetProps {
  id: string;
  color?: string;
  position?: 'bottom-right' | 'bottom-left';
  width?: number;
  height?: number;
  autoOpen?: number;
  exitIntent?: boolean;
  scrollTrigger?: number;
  sendPageContext?: boolean;
}

const ORIGIN = import.meta.env.VITE_APP_URL || window.location.origin;

export function ChatBotWidget({
  id,
  color = '#0a84ff',
  position = 'bottom-right',
  width = 400,
  height = 600,
  autoOpen,
  exitIntent,
  scrollTrigger,
  sendPageContext = true,
}: ChatBotWidgetProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetUrl = `${ORIGIN}/widget/${id}`;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !sendPageContext) return;

    const sendContext = () => {
      const pageText = document.body.innerText?.slice(0, 5000) || '';
      const selectedText = window.getSelection()?.toString()?.slice(0, 1000) || '';
      iframe.contentWindow?.postMessage({
        type: 'cbs:page-context',
        context: {
          title: document.title,
          url: window.location.href,
          selectedText,
          pageText,
        },
      }, ORIGIN);
    };

    // Send context on load and on selection change
    iframe.addEventListener('load', sendContext);
    const onSelectionChange = () => {
      const selected = window.getSelection()?.toString();
      if (selected) {
        iframe.contentWindow?.postMessage({
          type: 'cbs:page-context',
          context: { selectedText: selected.slice(0, 1000) },
        }, ORIGIN);
      }
    };
    document.addEventListener('selectionchange', onSelectionChange);

    return () => {
      iframe.removeEventListener('load', sendContext);
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, [sendPageContext]);

  const isMobile = window.innerWidth <= 640;
  const containerStyle: React.CSSProperties = isMobile
    ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', zIndex: 2147483646 }
    : {
        position: 'fixed',
        bottom: position === 'bottom-left' ? '88px' : '88px',
        [position === 'bottom-left' ? 'left' : 'right']: '20px',
        width: Math.min(Math.max(width, 320), 700),
        height: Math.min(Math.max(height, 400), 900),
        borderRadius: '16px',
        zIndex: 2147483646,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      };

  return (
    <div style={containerStyle}>
      <iframe
        ref={iframeRef}
        src={widgetUrl}
        title="Chat Widget"
        allow="clipboard-write"
        style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
      />
    </div>
  );
}
