export interface Product {
    id: number;
    name: string;
    slug: string;
    price: number;
    oldPrice?: number | null;
    imageUrl?: string | null;
    category?: string | null;
    stock: number;
    hidden: boolean;
    description?: string | null;
    createdAt: string;
}

export interface ProductListResponse {
    items: Product[];
    total: number;
    page: number;
}
