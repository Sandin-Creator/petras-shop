import { useEffect, useState } from 'react';
import { Loader2, Plus, Search, Edit, Trash2, Eye, EyeOff, Upload, X, ImageIcon, Filter, ArrowUpDown, Wand2 } from 'lucide-react';
import type { Product } from '../../types/product';
import { removeBackground } from '@imgly/background-removal';

interface ProductFormData {
    name: string;
    slug: string;
    price: string;
    stock: string;
    category: string;
    imageUrl: string;
    hidden: boolean;
    description: string;
}

const INITIAL_FORM: ProductFormData = {
    name: '',
    slug: '',
    price: '',
    stock: '',
    category: '',
    imageUrl: '',
    hidden: false,
    description: ''
};

const CATEGORIES = ['clothes', 'shoes', 'accessories', 'electronics', 'perfume', 'cosmetics'];

export function AdminProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [sortOption, setSortOption] = useState<'newest' | 'price-asc' | 'price-desc' | 'name-asc'>('newest');

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM);

    // Upload & AI State
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [removeBgEnabled, setRemoveBgEnabled] = useState(false);
    const [isRemovingBg, setIsRemovingBg] = useState(false);
    const [bgColor, setBgColor] = useState<'transparent' | 'white' | 'light-gray' | 'warm-beige' | 'soft-pink' | 'mint-green' | 'black'>('transparent');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products?take=100&orderBy=id:desc&includeHidden=true');
            const data = await res.json();
            setProducts(data.items);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    // Filter & Sort Logic
    const filteredProducts = products
        .filter(p =>
            (filterCategory === 'all' || p.category === filterCategory) &&
            (p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()))
        )
        .sort((a, b) => {
            if (sortOption === 'price-asc') return a.price - b.price;
            if (sortOption === 'price-desc') return b.price - a.price;
            if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
            return b.id - a.id; // newest (using ID as proxy for time if created desc)
        });

    const compositeImage = async (blob: Blob, color: string): Promise<Blob> => {
        if (color === 'transparent') return blob;

        const colorMap: Record<string, string> = {
            'white': '#ffffff',
            'light-gray': '#f3f4f6',
            'warm-beige': '#f5f5dc',
            'soft-pink': '#fce7f3',
            'mint-green': '#d1fae5',
            'black': '#000000'
        };

        const hex = colorMap[color] || '#ffffff';

        const img = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context failed');

        // Fill background
        ctx.fillStyle = hex;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw image
        ctx.drawImage(img, 0, 0);

        return new Promise((resolve, reject) => {
            canvas.toBlob(b => {
                if (b) resolve(b);
                else reject(new Error('Canvas to Blob failed'));
            }, 'image/png');
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        setError(null);

        try {
            let file = e.target.files[0];

            // AI Background Removal
            if (removeBgEnabled) {
                setIsRemovingBg(true);
                // Remove background
                const transparentBlob = await removeBackground(file);
                // Composite if needed
                const finalBlob = await compositeImage(transparentBlob, bgColor);

                // Create new file from blob
                file = new File([finalBlob], file.name.replace(/\.[^/.]+$/, "") + ".png", { type: 'image/png' });
                setIsRemovingBg(false);
            }

            const fd = new FormData();
            fd.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: fd
            });
            const data = await res.json();
            if (data.url) {
                setFormData(prev => ({ ...prev, imageUrl: data.url }));
            }
        } catch (err) {
            console.error('Upload failed', err);
            setError('Image upload/processing failed. Try again.');
        } finally {
            setUploading(false);
            setIsRemovingBg(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const url = editingId ? `/api/products/${editingId}` : '/api/products';
            const method = editingId ? 'PUT' : 'POST';

            const payload = {
                ...formData,
                price: Math.round(Number(formData.price) * 100), // Convert to cents
                stock: Number(formData.stock)
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || 'Operation failed');
            }

            // Refresh list
            await fetchProducts();
            closeModal();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const openCreateModal = () => {
        setEditingId(null);
        setFormData(INITIAL_FORM);
        setRemoveBgEnabled(false); // Reset AI toggle
        setIsModalOpen(true);
    };

    const openEditModal = (p: Product) => {
        setEditingId(p.id);
        setFormData({
            name: p.name,
            slug: p.slug,
            price: String(p.price / 100), // Convert cents to decimal for display
            stock: String(p.stock),
            category: p.category || '',
            imageUrl: p.imageUrl || '',
            hidden: p.hidden || false,
            description: p.description || ''
        });
        setRemoveBgEnabled(false);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setError(null);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await fetch(`/api/products/${id}`, { method: 'DELETE' });
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleVisibility = async (p: Product) => {
        try {
            const updated = !p.hidden;
            await fetch(`/api/products/${p.id}/visibility`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hidden: updated })
            });
            setProducts(prev => prev.map(item => item.id === p.id ? { ...item, hidden: updated } : item));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                <button onClick={openCreateModal} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 w-full md:w-auto justify-center">
                    <Plus className="h-4 w-4" /> Add Product
                </button>
            </div>

            {/* Toolbar: Search, Filter, Sort */}
            <div className="flex flex-col md:flex-row gap-4 bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 w-full md:w-auto bg-muted/50 rounded-md px-3 py-2 flex-1">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="flex-1 bg-transparent outline-none text-sm"
                        value={search}
                        onChange={handleSearch}
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    <div className="flex items-center gap-2 border rounded-md px-3 py-2 min-w-[140px] bg-card">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <select
                            className="bg-transparent outline-none text-sm w-full cursor-pointer text-foreground [&>option]:bg-card [&>option]:text-foreground"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 border rounded-md px-3 py-2 min-w-[140px] bg-card">
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        <select
                            className="bg-transparent outline-none text-sm w-full cursor-pointer text-foreground [&>option]:bg-card [&>option]:text-foreground"
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as any)}
                        >
                            <option value="newest">Newest First</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="name-asc">Name: A to Z</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="border rounded-lg bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr className="text-left">
                                <th className="p-4 font-medium text-muted-foreground w-16">Image</th>
                                <th className="p-4 font-medium text-muted-foreground min-w-[150px]">Name</th>
                                <th className="p-4 font-medium text-muted-foreground">Category</th>
                                <th className="p-4 font-medium text-muted-foreground">Price</th>
                                <th className="p-4 font-medium text-muted-foreground">Stock</th>
                                <th className="p-4 font-medium text-muted-foreground">Status</th>
                                <th className="p-4 font-medium text-muted-foreground text-right w-[120px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-muted/5">
                                    <td className="p-4">
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt="" className="h-10 w-10 rounded-md object-cover border" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 font-medium whitespace-nowrap">{product.name}</td>
                                    <td className="p-4 capitalize">{product.category || '-'}</td>
                                    <td className="p-4">€{(product.price / 100).toFixed(2)}</td>
                                    <td className="p-4">{product.stock}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.hidden ? 'bg-muted text-muted-foreground' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                            {product.hidden ? 'Hidden' : 'Visible'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleToggleVisibility(product)} className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground" title={product.hidden ? "Show" : "Hide"}>
                                                {product.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                            <button onClick={() => openEditModal(product)} className="p-2 hover:bg-muted rounded-md text-blue-500 hover:text-blue-600">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-muted rounded-md text-red-500 hover:text-red-600">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-foreground">No products found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-lg rounded-xl shadow-lg border max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold">{editingId ? 'Edit Product' : 'New Product'}</h2>
                            <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Product Name"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Slug</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        value={formData.slug}
                                        onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                        placeholder="product-slug"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Stock</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Description</label>
                                <textarea
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm h-24 resize-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Product description... (optional)"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Category</label>
                                <select
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="">Select Category</option>
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c} className="capitalize">{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Image</label>

                                <div className="bg-muted/30 p-4 rounded-lg border mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Wand2 className="h-4 w-4 text-purple-500" />
                                            <span className="text-sm font-medium">AI Background Removal</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs">Background:</label>
                                            <select
                                                className="text-xs border rounded px-1 py-0.5 bg-card text-foreground"
                                                value={bgColor}
                                                onChange={(e) => setBgColor(e.target.value as any)}
                                                disabled={!removeBgEnabled}
                                            >
                                                <option value="transparent">Transparent</option>
                                                <option value="white">White</option>
                                                <option value="light-gray">Light Gray</option>
                                                <option value="warm-beige">Warm Beige</option>
                                                <option value="soft-pink">Soft Pink</option>
                                                <option value="mint-green">Mint Green</option>
                                                <option value="black">Black</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => setRemoveBgEnabled(!removeBgEnabled)}
                                                className={`text-xs px-2 py-0.5 rounded-full transition-colors ${removeBgEnabled ? 'bg-purple-100 text-purple-700 font-bold' : 'bg-muted text-muted-foreground'}`}
                                            >
                                                {removeBgEnabled ? 'ON' : 'OFF'}
                                            </button>
                                        </div>
                                    </div>
                                    {removeBgEnabled && (
                                        <p className="text-xs text-muted-foreground">
                                            Upload an image and we'll automatically remove the background. This runs locally on your device!
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-4">
                                    {formData.imageUrl && (
                                        <img src={formData.imageUrl} alt="Preview" className="h-16 w-16 object-cover rounded-md border" />
                                    )}
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            className="w-full rounded-md border bg-background px-3 py-2 text-sm mb-2"
                                            placeholder="Image URL"
                                            value={formData.imageUrl}
                                            onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                        />
                                        <div className="flex items-center gap-2">
                                            <label className={`cursor-pointer inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-md transition-colors ${uploading ? 'bg-muted cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                                                {uploading ? (
                                                    <>
                                                        {isRemovingBg ? <Wand2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3 animate-bounce" />}
                                                        {isRemovingBg ? 'Removing BG...' : 'Uploading...'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <ImageIcon className="h-3 w-3" />
                                                        Choose / Take Photo
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    capture="environment"
                                                    onChange={handleImageUpload}
                                                    disabled={uploading}
                                                />
                                            </label>
                                            <span className="text-xs text-muted-foreground">Supports Mobile Camera</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="hidden"
                                    checked={formData.hidden}
                                    onChange={e => setFormData({ ...formData, hidden: e.target.checked })}
                                    className="rounded border-gray-300"
                                />
                                <label htmlFor="hidden" className="text-sm font-medium">Hide Product</label>
                            </div>

                            {error && <div className="text-sm text-destructive font-medium bg-destructive/10 p-2 rounded">{error}</div>}

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md">Cancel</button>
                                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50">
                                    {submitting && <Loader2 className="inline mr-2 h-3 w-3 animate-spin" />}
                                    {editingId ? 'Save Changes' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
