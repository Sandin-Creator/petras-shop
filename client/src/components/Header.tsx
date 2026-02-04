import { ShoppingBag, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

import flagEn from '../assets/flags/en.png';
import flagSe from '../assets/flags/sv.png';
import flagFi from '../assets/flags/fi.png';

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState<boolean | 'lang'>(false);
    const { language, setLanguage, t } = useLanguage();
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const { setIsOpen, itemCount } = useCart();

    // Initialize theme on mount
    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    // Map language code to flag image
    const getFlag = (lang: string) => {
        switch (lang) {
            case 'SE': return flagSe;
            case 'FI': return flagFi;
            case 'GB': default: return flagEn;
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newTheme);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 text-foreground transition-colors duration-300">
            {/* ... container ... */}
            <div className="container flex h-16 items-center justify-between px-4 md:px-6">
                {/* ... logo ... */}
                <div className="flex items-center gap-2">
                    <Link className="flex items-center gap-2 font-bold text-xl tracking-tight" to="/">
                        <ShoppingBag className="h-6 w-6 text-primary" />
                        <span>Petras<span className="text-primary">Shop</span></span>
                    </Link>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <Link to="/?category=Accessories" className="transition-colors hover:text-primary">{t.nav.accessories}</Link>
                    <Link to="/?sale=true" className="transition-colors hover:text-primary">{t.nav.sale}</Link>
                </nav>

                <div className="flex items-center gap-4">
                    {/* Visual Flags */}
                    {/* Language Dropdown */}
                    <div className="relative relative-group hidden md:flex items-center mr-2">
                        <button
                            onClick={() => setIsMenuOpen(prev => prev === 'lang' ? false : 'lang')}
                            className="transition-opacity hover:opacity-80"
                        >
                            <img src={getFlag(language)} alt={language} className="h-6 w-6 object-contain rounded-sm shadow-sm" />
                        </button>

                        {isMenuOpen === 'lang' && (
                            <div className="absolute top-full right-0 mt-2 w-40 bg-card border rounded-md shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={() => { setLanguage('GB'); setIsMenuOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-3 ${language === 'GB' ? 'font-bold text-primary' : ''}`}
                                >
                                    <img src={flagEn} alt="GB" className="h-4 w-6 object-cover rounded-sm shadow-sm" /> English
                                </button>
                                <button
                                    onClick={() => { setLanguage('SE'); setIsMenuOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-3 ${language === 'SE' ? 'font-bold text-primary' : ''}`}
                                >
                                    <img src={flagSe} alt="SE" className="h-4 w-6 object-cover rounded-sm shadow-sm" /> Svenska
                                </button>
                                <button
                                    onClick={() => { setLanguage('FI'); setIsMenuOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-3 ${language === 'FI' ? 'font-bold text-primary' : ''}`}
                                >
                                    <img src={flagFi} alt="FI" className="h-4 w-6 object-cover rounded-sm shadow-sm" /> Suomi
                                </button>
                            </div>
                        )}
                        {/* Backdrop to close */}
                        {isMenuOpen === 'lang' && (
                            <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                        )}
                    </div>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="transition-colors text-foreground hover:text-primary"
                        aria-label="Toggle theme"
                    >
                        <div className={`h-5 w-5 rounded-full shadow-[0_0_10px_currentColor] transition-all duration-500 ${theme === 'dark' ? 'bg-amber-400' : 'bg-slate-900 shadow-none'}`} />
                    </button>

                    {/* Search was moved to FilterBar but we keep it here if user wants quick search from nav? 
                        Actually, let's remove search from header if it's in FilterBar, OR keep it as global search. 
                        The screenshot showed search in the filter bar. I'll remove it from header to match screenshot cleanliness. */}

                    {/* ... Mobile Menu ... */}
                    <button
                        className="md:hidden text-muted-foreground hover:text-foreground"
                        onClick={() => setIsMenuOpen(prev => prev === true ? false : true)}
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <button
                        className="text-muted-foreground hover:text-foreground relative"
                        onClick={() => setIsOpen(true)}
                    >
                        <ShoppingBag className="h-5 w-5" />
                        {itemCount > 0 && (
                            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                {itemCount}
                            </span>
                        )}
                    </button>

                    {/* Sign In Removed */}
                </div>
            </div>

            {/* Mobile Nav */}
            {isMenuOpen === true && (
                <div className="md:hidden border-t p-4 space-y-4 bg-background">
                    <Link to="/?category=Clothes" className="block text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>Clothes</Link>
                    <Link to="/?category=Accessories" className="block text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>Accessories</Link>
                    <Link to="/?sale=true" className="block text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>Sale</Link>
                </div>
            )}
        </header>
    );
}
