/* eslint-disable */
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Product } from '../types/product';
import { useProductContext } from '../contexts/ProductContext';
import { IProductService } from '../services/productService';
import { getProductService } from '../services/DIContainer';

const useProducts = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const {
        products,
        setProducts,
        productsLoaded,
        setProductsLoaded,
        currentProduct,
        setCurrentProduct,
        selectedProducts,
        setSelectedProducts
    } = useProductContext();

    const [pagination, setPagination] = useState<{ total: number, page: number, totalPages: number } | null>(null);

    // useMemo ensures productService is a stable reference across renders
    // Prevents loadProductsPaginated from regenerating every render
    const productService: IProductService = useMemo(() => getProductService(), []);
    
    const loadProductsPaginated = useCallback(async (params: { page: number, limit: number, search?: string, category?: string, status?: string }) => {
        try {
            setLoading(true);
            setError(null);
            const response = await productService.getProductsPaginated(params);
            setProducts(response.products);
            setPagination(response.pagination);
            setProductsLoaded(true);
            return response;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load products');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [productService, setProducts, setProductsLoaded]);

    const loadProducts = useCallback(async (params?: { search?: string, category?: string, status?: string, limit?: number }) => {
        try {
            setLoading(true);
            setError(null);
            const productList = await productService.getProducts(params);
            setProducts(Array.isArray(productList) ? productList : []);
            setProductsLoaded(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load products');
        } finally {
            setLoading(false);
        }
    }, [productService, setProducts]);

    // Data is now loaded explicitly by components using loadProductsPaginated
    // or loadProducts when specifically needed (e.g. for small datasets or dropdowns)

    // Data fetching responsibility is moved to components to avoid redundant global sync storms


    const createProduct = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            setError(null);
            const newProduct = await productService.createProduct(productData);
            setProducts((prev: Product[]) => [...prev, newProduct]);
            setPagination((prev: any) => prev ? { ...prev, total: prev.total + 1 } : null);
            window.dispatchEvent(new Event('inventory-updated'));
            return newProduct;
        } catch (err: any) {
            const errorMessage = err?.data?.error || err?.response?.data?.error || err?.message || 'Failed to create product';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [productService, setProducts]);

    const updateProduct = useCallback(async (updatedProduct: Product) => {
        try {
            setError(null);
            const result = await productService.updateProduct(updatedProduct);
            
            // Log for verification as requested by user
            console.log('[useProducts] Update successful. Received from API:', result);

            setProducts((prev: Product[]) => prev.map(p => p.id === updatedProduct.id ? result : p));
            
            if (currentProduct?.id === updatedProduct.id) {
                setCurrentProduct(result);
            }
            
            window.dispatchEvent(new Event('inventory-updated'));
            return result;
        } catch (err: any) {
            const errorMessage = err?.data?.error || err?.response?.data?.error || err?.message || 'Failed to update product';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [productService, setProducts, currentProduct, setCurrentProduct]);

    const deleteProduct = useCallback(async (id: string, quiet = false) => {
        try {
            setError(null);
            // Optimistic UI updates using functional pattern to avoid stale state
            setProducts((prev: Product[]) => prev.filter(p => p.id !== id));
            setPagination((prev: any) => prev ? { ...prev, total: Math.max(0, prev.total - 1) } : null);
            
            if (currentProduct?.id === id) {
                setCurrentProduct(null);
            }
            setSelectedProducts((prev: Product[]) => prev.filter(p => p.id !== id));

            await productService.deleteProduct(id);

            if (!quiet) {
                setProductsLoaded(false);
                window.dispatchEvent(new Event('inventory-updated'));
            }
        } catch (err: any) {
            const errorMessage = err?.data?.error || err?.message || 'Failed to delete product';
            setError(errorMessage);
            // Re-fetch to ensure UI is in sync after failure
            window.dispatchEvent(new Event('inventory-updated'));
            throw new Error(errorMessage);
        }
    }, [productService, setProducts, currentProduct, setCurrentProduct, setSelectedProducts, setProductsLoaded]);

    const deleteProducts = useCallback(async (ids: string[], quiet = false) => {
        try {
            setError(null);
            // Optimistic UI updates using functional pattern
            setProducts((prev: Product[]) => prev.filter(p => !ids.includes(p.id)));
            setPagination((prev: any) => prev ? { ...prev, total: Math.max(0, prev.total - ids.length) } : null);
            setSelectedProducts((prev: Product[]) => prev.filter(p => !ids.includes(p.id)));

            // Hit the API
            await productService.deleteProducts(ids);

            if (!quiet) {
                setProductsLoaded(false);
                window.dispatchEvent(new Event('inventory-updated'));
            }
        } catch (err: any) {
            const errorMessage =
                err?.data?.error ||
                err?.response?.data?.error ||
                err?.message ||
                'Failed to delete products';
            setError(errorMessage);
            // Re-fetch to ensure UI is in sync after failure
            window.dispatchEvent(new Event('inventory-updated'));
            throw new Error(errorMessage);
        }
    }, [productService, setProducts, setSelectedProducts, setProductsLoaded]);

    const searchProducts = useCallback(async (query: string) => {
        try {
            setError(null);
            const results = await productService.searchProducts(query);
            return results;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to search products';
            setError(errorMessage);
            return [];
        }
    }, [productService]);

    const exportProducts = useCallback(async (format: 'csv' | 'json') => {
        try {
            setError(null);
            const blob = await productService.exportProducts(format);
            return blob;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to export products';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [productService]);

    // Optimistic stock update for instant UI feedback
    const updateStock = useCallback((updates: { productId: string, quantity: number }[]) => {
        const newProducts = products.map(p => {
            const update = updates.find(u => u.productId === p.id);
            if (update && typeof p.stock === 'number') {
                return { ...p, stock: Math.max(0, p.stock - update.quantity) };
            }
            return p;
        });
        setProducts(newProducts);
    }, [products, setProducts]);

    return {
        products,
        loading,
        error,
        createProduct,
        updateProduct,
        deleteProduct,
        deleteProducts,
        searchProducts,
        exportProducts,
        updateStock,
        pagination,
        loadProducts,
        loadProductsPaginated,
        refetch: loadProducts,
        currentProduct,
        setCurrentProduct,
        selectedProducts,
        setSelectedProducts,
        getAllProductIds: productService.getAllProductIds.bind(productService),
    };
};

export { useProducts };
export default useProducts;
