import { useEffect, useState, useCallback } from 'react';
import { Product } from '../types/product';
import { useProductContext } from '../contexts/ProductContext';
import { IProductService } from '../services/productService';
import { getProductService } from '../services/DIContainer';

const useProducts = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { 
        products, 
        setProducts,
        currentProduct, 
        setCurrentProduct, 
        selectedProducts, 
        setSelectedProducts 
    } = useProductContext();
    
    const productService: IProductService = getProductService();

    const loadProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Console log to check data in F12
            console.log("%c Hook: Fetching Products...", "color: orange; font-weight: bold;");
            
            const response: any = await productService.getProducts();
            
            // 🔥 FIXED: Robust mapping to handle any API response format
            let list: Product[] = [];
            if (response && response.data) {
                list = Array.isArray(response.data) ? response.data : (response.data.products || []);
            } else if (response && response.products) {
                list = response.products;
            } else if (Array.isArray(response)) {
                list = response;
            }

            console.log("Hook: Products Loaded ->", list);
            setProducts(list);
        } catch (err) {
            console.error('Hook: Product Fetch Error ->', err);
            setError(err instanceof Error ? err.message : 'Failed to load products');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [productService, setProducts]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const createProduct = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            setError(null);
            const newProduct = await productService.createProduct(productData);
            
            // Force refresh after creation
            setTimeout(() => { loadProducts(); }, 200);
            return newProduct;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create product';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [productService, loadProducts]);

    const updateProduct = useCallback(async (updatedProduct: Product) => {
        try {
            setError(null);
            const result = await productService.updateProduct(updatedProduct);
            const currentList = Array.isArray(products) ? products : [];
            setProducts(currentList.map(p => p.id === updatedProduct.id ? result : p));
            if (currentProduct?.id === updatedProduct.id) setCurrentProduct(result);
            return result;
        } catch (err) {
            throw err;
        }
    }, [productService, setProducts, products, currentProduct, setCurrentProduct]);

    const deleteProduct = useCallback(async (id: string) => {
        try {
            setError(null);
            await productService.deleteProduct(id);
            
            // 🔥 SAFETY CHECK for History Delete Crash
            const currentList = Array.isArray(products) ? products : [];
            setProducts(currentList.filter(p => p.id !== id));
            
            if (currentProduct?.id === id) setCurrentProduct(null);
            
            const currentSelected = Array.isArray(selectedProducts) ? selectedProducts : [];
            setSelectedProducts(currentSelected.filter(p => p.id !== id));
            
            // Sync with backend
            setTimeout(() => { loadProducts(); }, 200);
        } catch (err) {
            throw err;
        }
    }, [productService, setProducts, products, currentProduct, setCurrentProduct, selectedProducts, setSelectedProducts, loadProducts]);

    const searchProducts = useCallback(async (query: string) => {
        try {
            return await productService.searchProducts(query);
        } catch (err) {
            return [];
        }
    }, [productService]);

    const exportProducts = useCallback(async (format: 'csv' | 'json') => {
        try {
            return await productService.exportProducts(format);
        } catch (err) {
            throw err;
        }
    }, [productService]);

    return {
        products: Array.isArray(products) ? products : [],
        loading,
        error,
        createProduct,
        updateProduct,
        deleteProduct,
        searchProducts,
        exportProducts,
        refetch: loadProducts,
        currentProduct,
        setCurrentProduct,
        selectedProducts: Array.isArray(selectedProducts) ? selectedProducts : [],
        setSelectedProducts,
    };
};

export { useProducts };
export default useProducts;