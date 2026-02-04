import { useState } from "react";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function Checkout() {
    const { items, cartTotal, clearCart } = useCart();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        customerName: "",
        customerEmail: "",
        customerPhone: ""
    });

    if (items.length === 0 && !success) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <p className="text-muted-foreground text-lg">{t.cart.empty}</p>
                <Link to="/" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" /> {t.checkout.back}
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-6 text-center">
                <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-10 w-10" />
                </div>
                <p className="text-muted-foreground max-w-md">
                    {t.checkout.success.messagePart1}
                    {formData.customerEmail && <span> {t.checkout.success.messagePart2} <strong>{formData.customerEmail}</strong>.</span>}
                    {t.checkout.success.messagePart3}
                </p>
                <Link to="/" className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-md px-8 flex items-center justify-center text-sm font-medium shadow mt-4">
                    {t.checkout.success.continue}
                </Link>
            </div >
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const payload = {
            ...formData,
            items: items.map(i => ({ id: i.id, quantity: i.quantity }))
        };

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to place order');
            }

            clearCart();
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="py-12 max-w-4xl mx-auto">
            <Link to="/" className="text-muted-foreground hover:text-foreground flex items-center gap-2 mb-8 text-sm">
                <ArrowLeft className="h-4 w-4" /> {t.checkout.back}
            </Link>

            <h1 className="text-3xl font-bold mb-8">{t.checkout.title}</h1>

            <div className="grid md:grid-cols-2 gap-12">
                {/* Form */}
                <div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium">{t.checkout.form.name}</label>
                            <input
                                id="name"
                                type="text"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.customerName}
                                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="phone" className="text-sm font-medium">{t.checkout.form.phone}</label>
                            <input
                                id="phone"
                                type="tel"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.customerPhone}
                                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">{t.checkout.form.email}</label>
                            <input
                                id="email"
                                type="email"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.customerEmail}
                                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-md px-8 flex items-center justify-center text-sm font-bold shadow disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : t.checkout.form.placeOrder}
                        </button>
                    </form>
                </div>

                {/* Summary */}
                <div className="bg-muted/30 p-6 rounded-xl h-fit border">
                    <h3 className="font-semibold text-lg mb-4">{t.checkout.summary.title}</h3>
                    <div className="space-y-4 mb-4 max-h-80 overflow-y-auto pr-2">
                        {items.map(item => (
                            <div key={item.id} className="flex gap-4">
                                <div className="h-16 w-16 bg-white rounded-md border overflow-hidden flex-shrink-0">
                                    <img src={item.imageUrl || "/images/placeholder.png"} className="h-full w-full object-cover" alt={item.name} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-bold text-sm">€{((item.price * item.quantity) / 100).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                    <div className="border-t pt-4 flex items-center justify-between text-lg font-bold">
                        <span>{t.checkout.summary.total}</span>
                        <span>€{(cartTotal / 100).toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                        {t.checkout.summary.agreement}
                    </p>
                </div>
            </div>
        </div>
    );
}
