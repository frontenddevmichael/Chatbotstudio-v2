import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WaitlistModalProps {
  open: boolean;
  onClose: () => void;
}

const WaitlistModal = ({ open, onClose }: WaitlistModalProps) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleSubmit = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('waitlist').insert({ email: email.trim() });
      if (error && error.code !== '23505') throw error;
      setSuccess(true);
      localStorage.setItem('waitlist_joined', 'true');
    } catch {
      // silently handle
    }
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[8px]" onClick={onClose} />

          <motion.div
            className="relative bg-[#141414] border border-white/[0.10] rounded-[20px] p-8 max-w-[420px] w-full shadow-xl"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] }}
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors">
              <X size={18} />
            </button>

            {success ? (
              <div className="text-center py-4">
                <motion.div
                  className="w-14 h-14 rounded-full bg-[#0a84ff]/10 flex items-center justify-center mx-auto mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Check size={28} className="text-[#0a84ff]" />
                </motion.div>
                <h3 className="text-[17px] font-semibold text-white/90 mb-2">You're on the list</h3>
                <p className="text-[13px] text-white/40">We'll notify you when Premium launches.</p>
              </div>
            ) : (
              <>
                <h3 className="text-[17px] font-semibold text-white/90 mb-2">Join the Premium Waitlist</h3>
                <p className="text-[13px] text-white/40 mb-6">Be first to unlock 10 chatbots, 10K messages, and more.</p>
                <div className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="your@email.com"
                    className="w-full h-10 bg-[#1c1c1c] border border-white/[0.06] rounded-[10px] px-4 text-[15px] text-white/90 placeholder:text-white/25 focus:outline-none focus:border-[#0a84ff]/40 focus:shadow-focus transition-all"
                    autoFocus
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full h-10 rounded-[10px] bg-[#0a84ff] text-white text-[14px] font-medium hover:bg-[#409cff] active:scale-[0.97] disabled:opacity-50 transition-all"
                  >
                    {submitting ? 'Joining...' : 'Join Waitlist'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WaitlistModal;
