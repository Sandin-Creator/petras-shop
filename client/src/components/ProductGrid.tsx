import { useEffect, useState } from "react";
import type { Product, ProductListResponse } from "../types/product";
import { ProductCard } from "./ProductCard";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";

export function ProductGrid() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        setLoading(true);
        const query = searchParams.toString();
        fetch(`/api/products?${query}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch products");
                return res.json();
            })
            .then((data: ProductListResponse) => {
                setProducts(data.items);
            })
            .catch((err) => {
                console.error(err);
                setError("Failed to load products. Please try again later.");
            })
            .finally(() => setLoading(false));
    }, [searchParams]);

    if (loading) {
        return (
            <div className="flex h-64 w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-64 w-full items-center justify-center text-destructive">
                {error}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex h-64 w-full items-center justify-center text-muted-foreground">
                No products found.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}
