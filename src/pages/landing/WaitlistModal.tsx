import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface WaitlistModalProps {
  open: boolean;
  onClose: () => void;
}

const WaitlistModal = ({ open, onClose }: WaitlistModalProps) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Exit intent — show once per session
  useEffect(() => {
    if (localStorage.getItem('waitlist_joined')) return;
    const handler = (e: MouseEvent) => {
      if (e.clientY < 5 && !open) {
        // We can't open from here since we don't control parent state
        // Exit intent handled in Landing.tsx
      }
    };
    document.addEventListener('mouseleave', handler);
    return () => document.removeEventListener('mouseleave', handler);
  }, [open]);

  const handleSubmit = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('waitlist').insert({ email: email.trim() });
      if (error && error.code === '23505') {
        setSuccess(true);
      } else if (error) {
        throw error;
      } else {
        setSuccess(true);
      }
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
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            className="relative bg-[#111118] border border-[#1e1e2e] rounded-2xl p-8 max-w-md w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X size={20} />
            </button>

            {success ? (
              <div className="text-center py-4">
                <motion.div
                  className="w-16 h-16 rounded-full bg-[#00d4ff]/10 flex items-center justify-center mx-auto mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Check size={32} className="text-[#00d4ff]" />
                </motion.div>
                <h3 className="font-display text-xl font-bold text-white mb-2">You're on the list!</h3>
                <p className="text-sm text-gray-500">We'll notify you when Premium launches.</p>
              </div>
            ) : (
              <>
                <h3 className="font-display text-xl font-bold text-white mb-2">Join the Premium Waitlist</h3>
                <p className="text-sm text-gray-500 mb-6">Be first to unlock 10 chatbots, 10K messages, and more.</p>
                <div className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="your@email.com"
                    className="w-full bg-[#0c0c14] border border-[#1e1e2e] rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00d4ff]/50"
                    autoFocus
                  />
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full bg-[#00d4ff] text-[#080810] hover:bg-[#00d4ff]/90 font-semibold"
                  >
                    {submitting ? 'Joining...' : 'Join Waitlist'}
                  </Button>
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
