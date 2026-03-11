import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = useCallback((menuItem, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.menu_item_id === menuItem.id);
      if (existing) {
        return prev.map(i =>
          i.menu_item_id === menuItem.id
            ? { ...i, quantity: i.quantity + quantity, subtotal: (i.quantity + quantity) * i.unit_price }
            : i
        );
      }
      return [...prev, {
        menu_item_id: menuItem.id,
        name: menuItem.name,
        unit_price: parseFloat(menuItem.price),
        quantity,
        subtotal: parseFloat(menuItem.price) * quantity,
        special_instructions: '',
      }];
    });
  }, []);

  const removeItem = useCallback((menuItemId) => {
    setItems(prev => prev.filter(i => i.menu_item_id !== menuItemId));
  }, []);

  const updateQuantity = useCallback((menuItemId, quantity) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    setItems(prev =>
      prev.map(i =>
        i.menu_item_id === menuItemId
          ? { ...i, quantity, subtotal: quantity * i.unit_price }
          : i
      )
    );
  }, [removeItem]);

  const updateInstructions = useCallback((menuItemId, instructions) => {
    setItems(prev =>
      prev.map(i =>
        i.menu_item_id === menuItemId
          ? { ...i, special_instructions: instructions }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const tax = subtotal * 0.12;
  const total = subtotal + tax;
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, updateInstructions,
      clearCart, subtotal, tax, total, itemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};