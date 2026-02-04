import { useEffect, useState } from 'react';
import { Loader2, Search, Check, X, Package } from 'lucide-react';

interface OrderItem {
    id: number;
    quantity: number;
    price: number;
    product: {
        name: string;
        slug: string;
    };
}

interface Order {
    id: number;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string | null;
    status: string;
    total: number;
    createdAt: string;
    items: OrderItem[];
}

export function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/orders');
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: number, status: string) => {
        try {
            const res = await fetch(`/api/orders/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const filteredOrders = orders.filter(o =>
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        String(o.id).includes(search)
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'READY': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'CANCELLED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
        }
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
            </div>

            <div className="flex items-center gap-2 max-w-sm bg-card border rounded-md px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search orders..."
                    className="flex-1 bg-transparent outline-none text-sm"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="space-y-4">
                {filteredOrders.map(order => (
                    <div key={order.id} className="bg-card border rounded-lg p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 mb-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold">Order #{order.id}</h3>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {new Date(order.createdAt).toLocaleString()} • {order.customerName}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {order.status === 'PENDING' && (
                                    <button onClick={() => handleStatusUpdate(order.id, 'READY')} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">
                                        <Package className="h-3 w-3" /> Mark Ready
                                    </button>
                                )}
                                {order.status === 'READY' && (
                                    <button onClick={() => handleStatusUpdate(order.id, 'COMPLETED')} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-green-100 text-green-700 rounded-md hover:bg-green-200">
                                        <Check className="h-3 w-3" /> Complete
                                    </button>
                                )}
                                {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                                    <button onClick={() => handleStatusUpdate(order.id, 'CANCELLED')} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-red-100 text-red-700 rounded-md hover:bg-red-200">
                                        <X className="h-3 w-3" /> Cancel
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            {order.items.map(item => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span>
                                        <span className="font-medium">{item.quantity}x</span> {item.product.name}
                                    </span>
                                    <span>€{((item.price * item.quantity) / 100).toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between pt-2 border-t font-bold">
                                <span>Total</span>
                                <span>€{(order.total / 100).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t text-sm grid grid-cols-2 gap-4 text-muted-foreground">
                            <div>
                                <span className="block font-medium text-foreground">Contact</span>
                                {order.customerEmail && <div>{order.customerEmail}</div>}
                                {order.customerPhone && <div>{order.customerPhone}</div>}
                            </div>
                        </div>
                    </div>
                ))}

                {filteredOrders.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        No orders found.
                    </div>
                )}
            </div>
        </div>
    );
}
