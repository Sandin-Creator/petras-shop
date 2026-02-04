import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export function CartDrawer() {
    const { items, removeItem, updateQuantity, cartTotal, isOpen, setIsOpen } = useCart();
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <div className="relative z-50 flex h-full w-full max-w-md flex-col bg-background shadow-xl animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between border-b p-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" /> {t.cart.title}
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="rounded-full p-2 hover:bg-muted transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
                            <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
                            <p className="text-lg font-medium text-muted-foreground">{t.cart.empty}</p>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-primary hover:underline"
                            >
                                {t.cart.continue}
                            </button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="flex gap-4 rounded-lg border p-3 bg-card">
                                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-gray-100">
                                    <img
                                        src={item.imageUrl || "/images/placeholder.png"}
                                        alt={item.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="flex flex-1 flex-col justify-between">
                                    <div>
                                        <h3 className="font-medium">{item.name}</h3>
                                        <p className="text-sm font-bold text-primary mt-1">
                                            €{(item.price / 100).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1 h-8">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="text-destructive hover:bg-destructive/10 p-2 rounded-md transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <div className="border-t p-4 space-y-4 bg-muted/20">
                        <div className="flex items-center justify-between text-lg font-bold">
                            <span>{t.cart.total}</span>
                            <span>€{(cartTotal / 100).toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            Taxes and shipping calculated at checkout
                        </p>
                        <Link
                            to="/checkout"
                            onClick={() => setIsOpen(false)}
                            className={cn(
                                "flex w-full items-center justify-center rounded-lg bg-primary px-8 py-3 font-bold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl",
                                "disabled:opacity-50 disabled:pointer-events-none"
                            )}
                        >
                            {t.cart.checkout}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
