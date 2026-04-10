interface BillItem {
    price: number;
    quantity: number;
}

export const calculateTotalPrice = (items: BillItem[], taxRate: number): number => {
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = subtotal * (taxRate / 100);
    return subtotal + tax;
};

export const calculateDiscountedPrice = (totalPrice: number, discountRate: number): number => {
    return totalPrice - (totalPrice * (discountRate / 100));
};

export const calculateTaxAmount = (subtotal: number, taxRate: number): number => {
    return subtotal * (taxRate / 100);
};

export const calculateFinalAmount = (items: BillItem[], taxRate: number, discountRate: number): number => {
    const totalPrice = calculateTotalPrice(items, taxRate);
    return calculateDiscountedPrice(totalPrice, discountRate);
};

// Added missing function that components are trying to import
export const calculateTotal = (items: BillItem[], taxRate: number = 0): number => {
    return calculateTotalPrice(items, taxRate);
};
