import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const addToCart = useCallback((item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  // Legacy alias used by old POSInterface / BrowseMenu
  const addItem = useCallback((item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, {
        id: item.id,
        menu_item_id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        unit_price: parseFloat(item.price),
        quantity: 1,
      }];
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart(prev => prev.filter(c => c.id !== id));
  }, []);
  const removeItem = removeFromCart;

  const updateQty = useCallback((id, qty) => {
    if (qty <= 0) setCart(prev => prev.filter(c => c.id !== id));
    else setCart(prev => prev.map(c => c.id === id ? { ...c, quantity: qty } : c));
  }, []);
  const updateQuantity = updateQty;

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal  = cart.reduce((s, i) => s + (i.price || i.unit_price || 0) * i.quantity, 0);
  const subtotal   = cartTotal;
  const tax        = cartTotal * 0.12;
  const total      = cartTotal + tax;
  const itemCount  = cart.reduce((s, i) => s + i.quantity, 0);

  // items alias for legacy components
  const items = cart.map(c => ({
    ...c,
    unit_price: c.unit_price || c.price,
    subtotal: (c.unit_price || c.price) * c.quantity,
  }));

  return (
    <CartContext.Provider value={{
      cart, items,
      addToCart, addItem,
      removeFromCart, removeItem,
      updateQty, updateQuantity,
      clearCart,
      cartTotal, subtotal, tax, total, itemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}