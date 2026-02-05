import { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, LogOut, Loader2, Menu, Bell, BellOff } from 'lucide-react';

export function AdminLayout() {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [notificationsOn, setNotificationsOn] = useState(false);
    const lastCheckedRef = useRef<Date>(new Date());

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        checkAuth();
        const saved = localStorage.getItem('admin_notifications');
        if (saved === 'true') setNotificationsOn(true);
    }, []);

    // Polling Effect
    useEffect(() => {
        if (!notificationsOn || !authorized) return;

        const interval = setInterval(async () => {
            try {
                const since = lastCheckedRef.current.toISOString();
                const res = await fetch(`/api/orders?since=${since}`);
                if (res.ok) {
                    const newOrders = await res.json();

                    if (newOrders.length > 0) {
                        // Notify
                        new Notification('PetrasShop Alert', {
                            body: `You have ${newOrders.length} new order(s)!`,
                            icon: '/favicon.ico'
                        });

                        // Play Sound (Beep)
                        try {
                            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                            const osc = ctx.createOscillator();
                            const gain = ctx.createGain();
                            osc.connect(gain);
                            gain.connect(ctx.destination);
                            osc.type = 'sine';
                            osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
                            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5); // Drop to A4
                            gain.gain.setValueAtTime(0.5, ctx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                            osc.start();
                            osc.stop(ctx.currentTime + 0.5);
                        } catch (e) {
                            console.error("Audio error", e);
                        }
                    }
                    // Update ref to now
                    lastCheckedRef.current = new Date();
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 30000); // Poll every 30s

        return () => clearInterval(interval);
    }, [notificationsOn, authorized]);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();

            if (data.user && data.user.role === 'ADMIN') {
                setAuthorized(true);
            } else {
                navigate('/login');
            }
        } catch (err) {
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const toggleNotifications = async () => {
        if (!notificationsOn) {
            const perm = await Notification.requestPermission();
            if (perm === 'granted') {
                setNotificationsOn(true);
                localStorage.setItem('admin_notifications', 'true');
                lastCheckedRef.current = new Date(); // Start checking from now
                new Notification('Notifications Enabled', { body: 'You will be notified of new orders.' });
            } else {
                alert('Please allow notifications in your browser settings.');
            }
        } else {
            setNotificationsOn(false);
            localStorage.setItem('admin_notifications', 'false');
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        navigate('/login');
    };

    // Close sidebar on route change (mobile)
    useEffect(() => {
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    }, [location.pathname]);

    // Handle screen resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                // Desktop: Default to open if not manually toggled (simplified for now)
                // setIsSidebarOpen(true); 
            } else {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!authorized) return null;

    const navItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/products', icon: Package, label: 'Products' },
        { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    ];

    return (
        <div className="min-h-screen bg-muted/20 flex relative">
            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 bottom-0 left-0 z-40 bg-card border-r transition-all duration-300 flex flex-col
                    ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:translate-x-0 md:w-20'}
                `}
            >
                <div className="h-16 flex items-center justify-center border-b px-4">
                    {isSidebarOpen ? (
                        <span className="font-bold text-xl tracking-tight">Petras<span className="text-primary">Admin</span></span>
                    ) : (
                        <span className="font-bold text-xl text-primary">P</span>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                                title={item.label}
                            >
                                <Icon className="h-5 w-5 shrink-0" />
                                {isSidebarOpen && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t mt-auto">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Logout"
                    >
                        <LogOut className="h-5 w-5 shrink-0" />
                        {isSidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'} w-full`}>
                <header className="h-16 bg-background/80 backdrop-blur border-b sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 hover:bg-muted rounded-md"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={toggleNotifications}
                            className={`p-2 rounded-full transition-colors ${notificationsOn
                                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                : 'text-muted-foreground hover:bg-muted'
                                }`}
                            title={notificationsOn ? "Disable Notifications" : "Enable Notifications"}
                        >
                            {notificationsOn ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                        </button>

                        <div className="text-sm text-muted-foreground hidden md:block">
                            Administrator
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
