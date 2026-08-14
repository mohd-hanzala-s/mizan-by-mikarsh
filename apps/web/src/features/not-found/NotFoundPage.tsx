import { useNavigate } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-16 px-16 py-64">
      <FileQuestion className="size-64 text-text-tertiary" aria-hidden="true" />
      <div className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-h2 text-text-primary">Page not found</h1>
        <p className="text-body text-text-secondary max-w-xs">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate('/', { replace: true })}
        className="rounded-md bg-brand-teal900 px-24 py-12 text-body-sm font-medium text-white hover:opacity-90"
      >
        Go to Dashboard
      </button>
    </main>
  )
}
