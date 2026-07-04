import { useState, useCallback, useRef, useEffect } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const PRESET_PALETTES = [
  { name: 'Ocean', colors: ['#0ea5e9', '#06b6d4', '#0891b2'] },
  { name: 'Sunset', colors: ['#f97316', '#ef4444', '#ec4899'] },
  { name: 'Forest', colors: ['#22c55e', '#16a34a', '#15803d'] },
  { name: 'Royal', colors: ['#8b5cf6', '#7c3aed', '#6d28d9'] },
  { name: 'Slate', colors: ['#64748b', '#475569', '#334155'] },
  { name: 'Rose', colors: ['#f43f5e', '#e11d48', '#be123c'] },
];

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [190, 100, 50];
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

const ColorPicker = ({ value, onChange }: ColorPickerProps) => {
  const [hsl, setHsl] = useState<[number, number, number]>(() => hexToHsl(value));
  const [hexInput, setHexInput] = useState(value);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);

  const updateFromHsl = useCallback((h: number, s: number, l: number) => {
    const hex = hslToHex(h, s, l);
    setHsl([h, s, l]);
    setHexInput(hex);
    onChange(hex);
  }, [onChange]);

  // Draw gradient canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    // Saturation-lightness gradient
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        const s = (x / w) * 100;
        const l = 100 - (y / h) * 100;
        ctx.fillStyle = `hsl(${hsl[0]}, ${s}%, ${l}%)`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [hsl]);

  const handleCanvasInteraction = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current && e.type !== 'mousedown') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const s = Math.round(x * 100);
    const l = Math.round(100 - y * 100);
    updateFromHsl(hsl[0], s, l);
  }, [hsl, updateFromHsl]);

  const handleHexChange = (input: string) => {
    setHexInput(input);
    if (/^#[0-9a-f]{6}$/i.test(input)) {
      const newHsl = hexToHsl(input);
      setHsl(newHsl);
      onChange(input);
    }
  };

  return (
    <div className="space-y-4">
      {/* HSL Canvas picker */}
      <div className="space-y-2">
        <canvas
          ref={canvasRef}
          width={256}
          height={160}
          className="w-full cursor-crosshair rounded-lg border border-border"
          style={{ imageRendering: 'pixelated' }}
          onMouseDown={(e) => { isDragging.current = true; handleCanvasInteraction(e); }}
          onMouseMove={handleCanvasInteraction}
          onMouseUp={() => { isDragging.current = false; }}
          onMouseLeave={() => { isDragging.current = false; }}
        />
        {/* Hue slider */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-muted-foreground w-6">H</label>
          <input
            type="range"
            min={0}
            max={360}
            value={hsl[0]}
            onChange={(e) => updateFromHsl(Number(e.target.value), hsl[1], hsl[2])}
            className="flex-1 accent-primary"
            style={{
              background: `linear-gradient(to right, 
                hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), 
                hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))`,
              height: '8px',
              borderRadius: '4px',
            }}
          />
        </div>
      </div>

      {/* Hex input + preview */}
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 shrink-0 rounded-lg border border-border"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => handleHexChange(e.target.value)}
          placeholder="#00d4ff"
          maxLength={7}
          className="w-28 rounded-md border border-border bg-card px-3 py-2 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Preset palettes */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Quick Palettes</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {PRESET_PALETTES.map((palette) => (
            <button
              key={palette.name}
              type="button"
              onClick={() => {
                handleHexChange(palette.colors[0]);
                const newHsl = hexToHsl(palette.colors[0]);
                setHsl(newHsl);
                onChange(palette.colors[0]);
              }}
              className="group flex flex-col items-center gap-1 rounded-lg border border-border p-2 transition-colors hover:border-primary/30"
            >
              <div className="flex gap-0.5">
                {palette.colors.map((c) => (
                  <div key={c} className="h-4 w-4 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground">{palette.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
