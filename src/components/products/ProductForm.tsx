import React, { useState } from 'react';
import { Product } from '../../types/product';
import { useProducts } from '../../hooks/useProducts';
import './addProduct.css';

interface ProductFormProps {
  onClose?: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ onClose }) => {
  const { createProduct } = useProducts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [product, setProduct] = useState<Product>({
    id: '',
    name: '',
    price: 0,
    description: '',
    tax: 0,
    taxRate: 0,
    quantity: 0,
    createdAt: '',
    updatedAt: '',
    customFields: {}
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumberField = ['price', 'tax', 'taxRate', 'quantity'].includes(name);
    const finalValue = isNumberField ? (value === '' ? 0 : Number(value)) : value;

    setProduct(prev => {
      let updated = { ...prev, [name]: finalValue };
      if (name === 'tax') updated.taxRate = Number(value);
      else if (name === 'taxRate') updated.tax = Number(value);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const productToSave = {
        ...product,
        price: Number(product.price),
        tax: Number(product.tax),
        taxRate: Number(product.taxRate),
        quantity: Number(product.quantity),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 🔥 Step 1: Data save karo
      await createProduct(productToSave);

      // 🔥 Step 2: Turant modal band karo
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Save error:", error);
      // Agar error aaye tab bhi band karne ki koshish karein taaki user stuck na ho
      if (onClose) onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <h2 className="product-form-title">Add New Product</h2>
      <div className="form-group">
        <label htmlFor="name">Product Name</label>
        <input type="text" id="name" name="name" value={product.name} onChange={handleChange} required disabled={isSubmitting} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="price">Price</label>
          <input type="number" id="price" name="price" value={product.price || ''} onChange={handleChange} required min="0" step="0.01" disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="tax">Tax (%)</label>
          <input type="number" id="tax" name="tax" value={product.tax || ''} onChange={handleChange} min="0" disabled={isSubmitting} />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" value={product.description} onChange={handleChange} rows={3} disabled={isSubmitting} />
      </div>
      <div className="form-group">
        <label htmlFor="quantity">Quantity</label>
        <input type="number" id="quantity" name="quantity" value={product.quantity || ''} onChange={handleChange} min="0" disabled={isSubmitting} />
      </div>
      <button type="submit" className="product-save-btn" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Product'}
      </button>
    </form>
  );
};

export default ProductForm;