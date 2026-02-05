import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Product } from "../types/product";

export interface CartItem extends Product {
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addItem: (product: Product) => void;
    removeItem: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    cartTotal: number;
    itemCount: number;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem("cart");
        return saved ? JSON.parse(saved) : [];
    });
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(items));
    }, [items]);

    const addItem = (product: Product) => {
        setItems((current) => {
            const existing = current.find((item) => item.id === product.id);
            if (existing) {
                return current.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...current, { ...product, quantity: 1 }];
        });
        setIsOpen(true);
    };

    const removeItem = (productId: number) => {
        setItems((current) => current.filter((item) => item.id !== productId));
    };

    const updateQuantity = (productId: number, quantity: number) => {
        if (quantity < 1) return removeItem(productId);
        setItems((current) =>
            current.map((item) =>
                item.id === productId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => setItems([]);

    const cartTotal = items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    const itemCount = items.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                cartTotal,
                itemCount,
                isOpen,
                setIsOpen,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
