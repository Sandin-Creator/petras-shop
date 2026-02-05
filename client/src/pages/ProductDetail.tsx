import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Product } from "../types/product";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";

export function ProductDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { addItem } = useCart();
    const { t } = useLanguage();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/products/${slug}`)
            .then((res) => {
                if (!res.ok) throw new Error("Product not found");
                return res.json();
            })
            .then((data: Product) => setProduct(data))
            .catch((err) => {
                console.error(err);
                setError(t.product.notFound);
            })
            .finally(() => setLoading(false));
    }, [slug, t]);

    if (loading) return (
        <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    if (error || !product) return (
        <div className="flex h-96 flex-col items-center justify-center gap-4">
            <p className="text-destructive font-medium">{error}</p>
            <Link to="/" className="text-primary hover:underline flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> {t.product.backToShop}
            </Link>
        </div>
    );

    const hasSale = product.oldPrice && product.oldPrice > product.price;
    const salePercent = hasSale ? Math.round(100 - (product.price / (product.oldPrice!)) * 100) : 0;

    return (
        <div className="py-12">
            <Link to="/" className="text-muted-foreground hover:text-foreground flex items-center gap-2 mb-8 text-sm">
                <ArrowLeft className="h-4 w-4" /> {t.product.backToShop}
            </Link>

            <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
                {/* Gallery */}
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
                    <img
                        src={product.imageUrl || "/images/placeholder.png"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.src = "/images/placeholder.png")}
                    />
                    {hasSale && (
                        <span className="absolute top-4 right-4 rounded-full bg-destructive px-3 py-1 text-sm font-bold text-destructive-foreground">
                            -{salePercent}%
                        </span>
                    )}
                </div>

                {/* Info */}
                <div className="space-y-8">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{product.name}</h1>
                        <p className="mt-2 text-muted-foreground uppercase tracking-widest text-sm font-medium">
                            {product.category || "Uncategorized"}
                        </p>
                    </div>

                    <div className="flex items-baseline gap-4">
                        {hasSale && (
                            <span className="text-2xl text-muted-foreground line-through">
                                €{(product.oldPrice! / 100).toFixed(2)}
                            </span>
                        )}
                        <span className={`text-4xl font-bold ${hasSale ? 'text-destructive' : 'text-primary'}`}>
                            €{(product.price / 100).toFixed(2)}
                        </span>
                    </div>

                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {product.description || "No description available."}
                    </p>

                    <div className="pt-8 border-t">
                        {product.stock > 0 ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                                    <span className="block h-2 w-2 rounded-full bg-green-600" />
                                    {t.product.inStock} ({product.stock} available)
                                </div>
                                <button
                                    onClick={() => addItem(product)}
                                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                                >
                                    {t.product.addToCart} - €{(product.price / 100).toFixed(2)}
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-destructive font-medium">
                                <span className="block h-2 w-2 rounded-full bg-destructive" />
                                {t.product.outOfStock}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
