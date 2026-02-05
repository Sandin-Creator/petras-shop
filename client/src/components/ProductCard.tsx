import type { Product } from "../types/product";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const hasSale = product.oldPrice && product.oldPrice > product.price;
    const salePercent = hasSale ? Math.round(100 - (product.price / (product.oldPrice!)) * 100) : 0;
    const { t } = useLanguage();

    return (
        <Link to={`/product/${product.slug}`} className="group relative rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md block">
            <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100 relative">
                <img
                    src={product.imageUrl || "/images/placeholder.png"}
                    alt={product.name}
                    className="h-full w-full object-cover object-center transition-transform group-hover:scale-105"
                    onError={(e) => (e.currentTarget.src = "/images/placeholder.png")}
                />
                {hasSale && (
                    <span className="absolute top-2 right-2 rounded-full bg-destructive px-2 py-1 text-xs font-bold text-destructive-foreground">
                        SALE -{salePercent}%
                    </span>
                )}
            </div>
            <div className="p-4">
                <h3 className="text-lg font-semibold leading-none tracking-tight mb-2 truncate">
                    {product.name}
                </h3>
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        {hasSale && (
                            <span className="text-sm text-muted-foreground line-through">
                                €{(product.oldPrice! / 100).toFixed(2)}
                            </span>
                        )}
                        <span className={`font-bold ${hasSale ? 'text-destructive' : 'text-primary'}`}>
                            €{(product.price / 100).toFixed(2)}
                        </span>
                    </div>

                    <span className="rounded-md bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-secondary/80">
                        {t.product.view}
                    </span>
                </div>
            </div>
        </Link>
    );
}
