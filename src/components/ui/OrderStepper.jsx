import { Check, X, Ban } from 'lucide-react'
import { LIME, LIME_TEXT } from '../../theme/adminColors'

const HAPPY_PATH = ['requested', 'approved', 'accepted', 'dispatched', 'delivered']
const HAPPY_LABELS = ['Requested', 'Approved', 'Accepted', 'Dispatched', 'Delivered']

/**
 * Compact horizontal order-lifecycle stepper. Shows at a glance exactly
 * where an order sits in requested → approved → accepted → dispatched →
 * delivered. Rejected/cancelled orders render as a distinct terminal state
 * instead of a broken/partial happy-path bar.
 */
export default function OrderStepper({ status }) {
  if (status === 'rejected' || status === 'cancelled') {
    const isRejected = status === 'rejected'
    return (
      <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
            isRejected ? 'bg-danger-100 text-danger-600' : 'bg-slate-200 text-slate-500'
          }`}
        >
          {isRejected ? <X size={12} /> : <Ban size={12} />}
        </div>
        <span
          className={`text-xs font-semibold capitalize ${
            isRejected ? 'text-danger-600' : 'text-slate-500'
          }`}
        >
          {status}
        </span>
      </div>
    )
  }

  const currentStep = HAPPY_PATH.indexOf(status)

  return (
    <div className="flex items-center">
      {HAPPY_PATH.map((step, i) => {
        const done = i < currentStep
        const active = i === currentStep
        const isLast = i === HAPPY_PATH.length - 1

        return (
          <div key={step} className="flex flex-1 items-center last:flex-initial">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300"
                style={
                  done
                    ? { backgroundColor: LIME, color: LIME_TEXT }
                    : active
                    ? { backgroundColor: LIME, color: LIME_TEXT, boxShadow: '0 0 0 3px rgba(217,255,106,0.25)' }
                    : { backgroundColor: '#F1F5F9', color: '#94A3B8' }
                }
              >
                {done ? <Check size={12} /> : i + 1}
              </div>
              <span
                className={`hidden text-[10px] font-medium sm:block ${
                  active ? 'text-slate-900' : done ? 'text-slate-500' : 'text-slate-300'
                }`}
              >
                {HAPPY_LABELS[i]}
              </span>
            </div>
            {!isLast && (
              <div
                className="mx-1.5 h-[3px] flex-1 rounded-full transition-all duration-500 sm:-mt-4"
                style={{ backgroundColor: done ? LIME : '#E2E8F0' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
