import React, { createContext, useContext, useState } from 'react';
import { Product } from '../types/product';

interface ProductContextType {
  // Shared product list - loaded once, shared everywhere
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  productsLoaded: boolean;
  setProductsLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  // Selection state
  selectedProducts: Product[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  currentProduct: Product | null;
  setCurrentProduct: React.Dispatch<React.SetStateAction<Product | null>>;
  productFilters: {
    search: string;
    category: string;
    inStock: boolean | null;
  };
  setProductFilters: React.Dispatch<React.SetStateAction<{
    search: string;
    category: string;
    inStock: boolean | null;
  }>>;
  productCategories: string[];
  setProductCategories: React.Dispatch<React.SetStateAction<string[]>>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [productFilters, setProductFilters] = useState<ProductContextType['productFilters']>({
    search: '',
    category: '',
    inStock: null
  });
  const [productCategories, setProductCategories] = useState<string[]>([]);

  return (
    <ProductContext.Provider
      value={{
        products,
        setProducts,
        productsLoaded,
        setProductsLoaded,
        selectedProducts,
        setSelectedProducts,
        currentProduct,
        setCurrentProduct,
        productFilters,
        setProductFilters,
        productCategories,
        setProductCategories,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProductContext = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProductContext must be used within a ProductProvider');
  }
  return context;
};

export default ProductContext;
