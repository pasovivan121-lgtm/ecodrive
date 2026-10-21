import { useNavigate } from 'react-router-dom'
import { ArrowRight, Leaf, ShieldCheck } from 'lucide-react'
import { getAuth } from '../lib/auth'
import { Alert, Badge, Button, Card, PageHeader } from '../components/ui'

export function Login() {
  const navigate = useNavigate()
  const { cloudConfigured } = getAuth()

  return (
    <>
      <PageHeader
        eyebrow="Access"
        title="Demo mode, no account needed"
        description="This build stores everything locally in your browser. Continue to open the dashboard with the demo driver profile."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15 ring-1 ring-inset ring-brand/30">
              <Leaf className="h-5 w-5 text-brand-2" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Demo driver</p>
              <p className="text-xs text-muted">Local profile · no credentials</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Continue as the demo driver to explore route comparison, the garage, GPS recording and
            analytics. Nothing is uploaded and no personal data is requested.
          </p>
          <Button className="mt-4 w-full" onClick={() => navigate('/')}>
            Continue in demo mode <ArrowRight className="h-4 w-4" />
          </Button>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
            <ShieldCheck className="h-3.5 w-3.5" /> No account, no tracking, local storage only
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Cloud accounts
              </h2>
              <Badge tone={cloudConfigured ? 'info' : 'neutral'}>
                {cloudConfigured ? 'Configured, not wired' : 'Not configured'}
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Sign-in and cross-device sync are not implemented in this build. A production version
              would need an auth provider, a backend for trip storage and a signed-in user scope for
              every query.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted/80">
              This is stated as a limitation rather than simulated with a fake login form.
            </p>
          </Card>

          <Alert tone="info" title="Why demo mode exists">
            The project is evaluated as a working demonstration. Demo mode keeps every feature
            usable without inventing credentials or hiding the missing cloud integration.
          </Alert>
        </div>
      </div>
    </>
  )
}

export function NotFound() {
  return (
    <Card className="p-10 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">This road does not exist</h1>
      <p className="mt-2 text-sm text-muted">
        The page you followed is not part of EcoDrive Route AI.
      </p>
      <Button className="mt-5" onClick={() => (window.location.href = '/')}>
        Back to dashboard
      </Button>
    </Card>
  )
}
