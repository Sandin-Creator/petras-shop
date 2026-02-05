import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        // Placeholder login since we don't have full auth flow in frontend yet
        // In a real app, this would POST to /api/auth/login
        setTimeout(() => {
            setLoading(false);
            setError("Invalid credentials (Demo Mode)");
        }, 1000);
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                        Or{' '}
                        <Link to="/" className="font-medium text-primary hover:text-primary/90">
                            back to shopping
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                required
                                className="relative block w-full rounded-t-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:z-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="relative block w-full rounded-b-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:z-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign in
                        </button>
                    </div>
                    {error && (
                        <p className="text-center text-sm text-destructive font-medium">{error}</p>
                    )}
                </form>
            </div>
        </div>
    );
}
