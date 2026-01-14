'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, Loader2 } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
  loading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'default',
  loading = false
}: ConfirmModalProps) {
  const variantStyles = {
    danger: {
      icon: 'bg-red-100 text-red-600',
      button: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      icon: 'bg-amber-100 text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700'
    },
    default: {
      icon: 'bg-[#C9A962]/20 text-[#C9A962]',
      button: 'bg-[#C9A962] hover:bg-[#B8994D]'
    }
  }

  const styles = variantStyles[variant]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${styles.icon}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-600">{message}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-4 bg-gray-50 border-t">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${styles.button}`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
