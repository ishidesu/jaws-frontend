'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AdminProtected from '@/components/AdminProtected';
import Navbar from '@/components/Navbar';
import { getApiUrl, config, getJWTAuthHeaders, transformImageUrl } from '@/lib/config';
import { insertProductDirect } from '@/lib/supabase-direct';
import OptimizedImage from '@/components/OptimizedImage';

export default function CrewHomePage() {
  const [activeRoute, setActiveRoute] = useState('new-item');
  
  return (
    <AdminProtected>
      <div className="min-h-screen" style={{ backgroundColor: '#111111' }}>
        <Navbar crewHomeMenu={{ activeRoute, setActiveRoute }} />
        <CrewHomeContent activeRoute={activeRoute} setActiveRoute={setActiveRoute} />
      </div>
    </AdminProtected>
  );
}

function CrewHomeContent({ activeRoute, setActiveRoute }: { activeRoute: string; setActiveRoute: (route: string) => void }) {
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [editStocks, setEditStocks] = useState<{[key: string]: number}>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [vehicleType, setVehicleType] = useState('');
  const [itemType, setItemType] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [nameError, setNameError] = useState('');
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState<{[key: string]: string}>({});
  const [editingName, setEditingName] = useState<{[key: string]: string}>({});
  const [editingPrice, setEditingPrice] = useState<{[key: string]: string}>({});
  
  const [originalValues, setOriginalValues] = useState<{[key: string]: any}>({});
  
  const [updatingProducts, setUpdatingProducts] = useState<{[key: string]: boolean}>({});
  
  const [deletingProducts, setDeletingProducts] = useState<{[key: string]: boolean}>({});
  
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);
  const [showRefreshWarning, setShowRefreshWarning] = useState(false);

  // Manage Orders states
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersSearchQuery, setOrdersSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilterType, setDateFilterType] = useState<string>('all');
  const [specificDate, setSpecificDate] = useState<string>('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [editingStatus, setEditingStatus] = useState<{[key: string]: string}>({});
  const [originalStatus, setOriginalStatus] = useState<{[key: string]: string}>({});
  const [updatingOrders, setUpdatingOrders] = useState<{[key: string]: boolean}>({});
  const [ordersError, setOrdersError] = useState<string>('');
  const [showOrdersRefreshWarning, setShowOrdersRefreshWarning] = useState(false);

  const truncateText = (text: string, maxLength: number = 15): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatNumber = (value: string | number): string => {
    if (!value) return '';
    const numStr = value.toString().replace(/\./g, '');
    const num = parseInt(numStr);
    if (isNaN(num)) return '';
    return num.toLocaleString('id-ID');
  };

  const unformatNumber = (value: string): string => {
    return value.replace(/\./g, '');
  };

  const handlePriceChange = (value: string, productId?: string) => {
    const unformatted = unformatNumber(value);
    
    if (productId) {
      setEditingPrice(prev => ({...prev, [productId]: unformatted}));
    } else {
      setPrice(unformatted);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsFetchingProducts(true);
      setShowRefreshWarning(false);
      console.log('Fetching products from database...');
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
      
      console.log('Products fetched:', data?.length || 0, 'items');
      setProducts(data || []);
      
      const initialStocks: {[key: string]: number} = {};
      const initialDescriptions: {[key: string]: string} = {};
      const initialNames: {[key: string]: string} = {};
      const initialPrices: {[key: string]: string} = {};
      const originalVals: {[key: string]: any} = {};
      
      data?.forEach(product => {
        initialStocks[product.id] = product.stock;
        initialDescriptions[product.id] = product.description || '';
        initialNames[product.id] = product.name;
        initialPrices[product.id] = product.price.toString();
        
        originalVals[product.id] = {
          name: product.name,
          price: product.price.toString(),
          description: product.description || '',
          stock: product.stock
        };
      });
      
      setEditStocks(initialStocks);
      setEditingDescription(initialDescriptions);
      setEditingName(initialNames);
      setEditingPrice(initialPrices);
      setOriginalValues(originalVals);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsFetchingProducts(false);
    }
  };

  useEffect(() => {
    if (activeRoute === 'edit-item' || activeRoute === 'delete-item') {
      console.log('Loading products for route:', activeRoute);
      fetchProducts();
    } else if (activeRoute === 'manage-order') {
      console.log('Loading orders for manage-order');
      fetchOrders();
    }
  }, [activeRoute]);

  useEffect(() => {
    let warningTimeout: NodeJS.Timeout;
    let refreshTimeout: NodeJS.Timeout;

    if (isFetchingProducts && (activeRoute === 'edit-item' || activeRoute === 'delete-item')) {
      warningTimeout = setTimeout(() => {
        if (isFetchingProducts) {
          setShowRefreshWarning(true);
        }
      }, 3000);

      refreshTimeout = setTimeout(() => {
        if (isFetchingProducts) {
          console.log('Auto-refreshing page due to long fetching time...');
          window.location.reload();
        }
      }, 5000);
    } else {
      setShowRefreshWarning(false);
    }

    return () => {
      if (warningTimeout) clearTimeout(warningTimeout);
      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
  }, [isFetchingProducts, activeRoute]);

  // Auto refresh for manage orders if loading takes too long
  useEffect(() => {
    let warningTimeout: NodeJS.Timeout;
    let refreshTimeout: NodeJS.Timeout;

    if (isLoadingOrders && activeRoute === 'manage-order') {
      warningTimeout = setTimeout(() => {
        if (isLoadingOrders) {
          setShowOrdersRefreshWarning(true);
        }
      }, 3000);

      refreshTimeout = setTimeout(() => {
        if (isLoadingOrders) {
          console.log('Auto-refreshing page due to long orders fetching time...');
          window.location.reload();
        }
      }, 5000);
    } else {
      setShowOrdersRefreshWarning(false);
    }

    return () => {
      if (warningTimeout) clearTimeout(warningTimeout);
      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
  }, [isLoadingOrders, activeRoute]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleTxtFileUpload = (file: File) => {
    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setDescription(content);
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a .txt file only');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const txtFile = files.find(file => file.type === 'text/plain');
    
    if (txtFile) {
      handleTxtFileUpload(txtFile);
    } else {
      alert('Please drop a .txt file');
    }
  };

  const handleTxtInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleTxtFileUpload(e.target.files[0]);
    }
  };

  const checkNameExists = async (name: string): Promise<boolean> => {
    if (!name.trim()) return false;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('name', name.trim())
        .limit(1);
      
      if (error) {
        console.error('Error checking name:', error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking name:', error);
      return false;
    }
  };

  const handleNameChange = async (value: string) => {
    setItemName(value);
    setNameError('');
    
    if (value.trim().length > 0) {
      setIsCheckingName(true);
      
      // Debounce the check
      setTimeout(async () => {
        const exists = await checkNameExists(value);
        if (exists) {
          setNameError('Product name already exists. Please choose a different name.');
        }
        setIsCheckingName(false);
      }, 500);
    }
  };

  const uploadImageToBackend = async (imageFile: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const uploadUrl = getApiUrl(config.API_ENDPOINTS.UPLOAD_IMAGE);
      console.log('Uploading to:', uploadUrl);
      console.log('Backend URL from config:', config.BACKEND_URL);
      
      // Get JWT token
      const authHeaders = await getJWTAuthHeaders();
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          ...authHeaders,
        },
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        throw new Error(`Failed to upload image: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Upload success:', data);
      return data.image_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) {
      console.log('Already processing, ignoring duplicate submit');
      return;
    }

    if (nameError) {
      alert('Please fix the name error before submitting.');
      return;
    }

    const nameExists = await checkNameExists(itemName);
    if (nameExists) {
      setNameError('Product name already exists. Please choose a different name.');
      alert('Product name already exists. Please choose a different name.');
      return;
    }
    
    setIsLoading(true);
    console.log('=== Starting form submission ===');

    try {
      let imageUrl = '';
      
      if (image) {
        try {
          console.log('Starting image upload...');
          imageUrl = await uploadImageToBackend(image);
          console.log('Image uploaded successfully:', imageUrl);
        } catch (uploadError) {
          console.error('Image upload failed, continuing without image:', uploadError);
          imageUrl = '';
        }
      }

      const productData = {
        name: itemName,
        price: parseFloat(price),
        description: description,
        image_url: imageUrl,
        stock: parseInt(stock) || 0,
        vehicle_type: vehicleType,
        item_type: itemType,
      };

      console.log('Saving to database with data:', productData);
      
      const startTime = Date.now();
      console.log('Database insert started at:', new Date().toISOString());
      
      try {
        console.log('Using direct REST API (primary method)...');
        
        const insertPromise = insertProductDirect(productData);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timed out after 15 seconds')), 15000)
        );

        const directResponse = await Promise.race([insertPromise, timeoutPromise]) as any;
        
        const duration = Date.now() - startTime;
        console.log(`Direct API completed in ${duration}ms`);
        
        if (directResponse.error) {
          console.log('Direct API failed, trying Supabase client as fallback...');
          
          const fallbackPromise = supabase
            .from('products')
            .insert([productData])
            .select();
          
          const fallbackTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Fallback timed out after 10 seconds')), 10000)
          );

          const response = await Promise.race([fallbackPromise, fallbackTimeout]) as any;
          
          if (response.error) {
            throw new Error(`Both methods failed. Direct API: ${directResponse.error}, Supabase: ${response.error.message}`);
          }
          
          console.log('Supabase fallback succeeded:', response.data);
          var data = response.data;
        } else {
          console.log('Direct API succeeded:', directResponse.data);
          var data = directResponse.data;
        }

        console.log('Product saved successfully:', data);

        setItemName('');
        setPrice('');
        setDescription('');
        setStock('');
        setImage(null);
        setVehicleType('');
        setItemType('');
        setNameError('');
        setIsCheckingName(false);
        
        const fileInput = document.getElementById('image-upload') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        
        if (imageUrl) {
          alert('Item berhasil ditambahkan dengan gambar!');
        } else {
          alert('Item berhasil ditambahkan (tanpa gambar)!');
        }
        
        console.log('=== Form submission completed successfully ===');
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        throw dbError;
      }
      
    } catch (error) {
      console.error('=== Form submission failed ===', error);
      alert(`Gagal menambahkan item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handleStockChange = (productId: string, change: number) => {
    setEditStocks(prev => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + change)
    }));
  };

  const hasChanges = (productId: string) => {
    const original = originalValues[productId];
    if (!original) return false;
    
    const currentName = editingName[productId] || '';
    const currentPrice = editingPrice[productId] || '';
    const currentDescription = editingDescription[productId] || '';
    const currentStock = editStocks[productId];
    
    return (
      original.name !== currentName ||
      original.price !== currentPrice ||
      original.description !== currentDescription ||
      original.stock !== currentStock
    );
  };

  const handleConfirmEdit = async (productId: string) => {
    if (!hasChanges(productId)) {
      alert('Tidak ada perubahan untuk disimpan.');
      return;
    }

    const name = editingName[productId]?.trim();
    const priceStr = editingPrice[productId];
    const description = editingDescription[productId]?.trim();
    const stock = editStocks[productId];

    if (!name) {
      alert('Nama produk tidak boleh kosong!');
      return;
    }

    if (!priceStr || isNaN(parseFloat(priceStr)) || parseFloat(priceStr) <= 0) {
      alert('Harga harus berupa angka yang valid dan lebih dari 0!');
      return;
    }

    if (stock < 0) {
      alert('Stock tidak boleh negatif!');
      return;
    }

    const price = parseFloat(priceStr);

    setUpdatingProducts(prev => ({ ...prev, [productId]: true }));

    try {
      console.log('Updating product via REST API:', productId, {
        name,
        price,
        description: description || '',
        stock
      });

      // Get JWT token
      const authHeaders = await getJWTAuthHeaders();

      const response = await fetch(getApiUrl(`${config.API_ENDPOINTS.UPDATE_PRODUCT}/${productId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          name: name,
          price: price,
          description: description || '',
          stock: stock
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('REST API update successful:', result);
      
      if (result.data) {
        const updatedProduct = result.data;
        setOriginalValues(prev => ({
          ...prev,
          [productId]: {
            name: updatedProduct.name,
            price: updatedProduct.price.toString(),
            description: updatedProduct.description || '',
            stock: updatedProduct.stock
          }
        }));
        
        setEditingName(prev => ({ ...prev, [productId]: updatedProduct.name }));
        setEditingPrice(prev => ({ ...prev, [productId]: updatedProduct.price.toString() }));
        setEditingDescription(prev => ({ ...prev, [productId]: updatedProduct.description || '' }));
        setEditStocks(prev => ({ ...prev, [productId]: updatedProduct.stock }));
      }
      
      alert('Product berhasil diupdate!');
      
      fetchProducts().catch(err => console.error('Background refresh failed:', err));
      
    } catch (error) {
      console.error('Error updating product via REST API:', error);
      alert(`Gagal mengupdate product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log('Clearing loading state for product:', productId);
      setUpdatingProducts(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setDeletingProducts(prev => ({ ...prev, [productId]: true }));
    
    try {
      console.log('Deleting product via REST API:', productId);

      // Get JWT token
      const authHeaders = await getJWTAuthHeaders();

      const response = await fetch(getApiUrl(`${config.API_ENDPOINTS.DELETE_PRODUCT}/${productId}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('REST API delete successful:', result);
      
      setProducts(prev => prev.filter(product => product.id !== productId));
      
      setDeleteConfirm(null);
      
      alert('Item dan gambar berhasil dihapus!');
      
      fetchProducts().catch(err => console.error('Background refresh failed:', err));
      
    } catch (error) {
      console.error('Error deleting product via REST API:', error);
      alert(`Gagal menghapus item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingProducts(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleRefresh = async () => {
    if (activeRoute === 'edit-item' || activeRoute === 'delete-item') {
      setIsRefreshing(true);
      try {
        await fetchProducts();
      } finally {
        setIsRefreshing(false);
      }
    } else if (activeRoute === 'manage-order') {
      setIsRefreshing(true);
      try {
        await fetchOrders();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Manage Orders Functions
  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      setOrdersError('');
      
      // First, cancel expired pending orders
      try {
        console.log('Checking for expired pending orders...');
        const { data: cancelResult, error: cancelError } = await supabase
          .rpc('cancel_expired_orders');
        
        if (cancelError) {
          console.warn('RPC cancel_expired_orders error:', cancelError);
          // Fallback: manually cancel expired pending orders
          console.log('Attempting manual cancel of expired pending orders...');
          const now = new Date().toISOString();
          const { data: expiredOrders, error: fetchError } = await supabase
            .from('orders')
            .select('id, order_number')
            .eq('status', 'pending')
            .lt('expires_at', now);
          
          if (!fetchError && expiredOrders && expiredOrders.length > 0) {
            console.log(`Found ${expiredOrders.length} expired pending orders, cancelling...`);
            for (const order of expiredOrders) {
              const { error: updateError } = await supabase
                .from('orders')
                .update({ status: 'cancelled', updated_at: now })
                .eq('id', order.id);
              
              if (updateError) {
                console.error(`Failed to cancel order ${order.order_number}:`, updateError);
              } else {
                console.log(`Cancelled order ${order.order_number}`);
              }
            }
          }
        } else {
          console.log('Expired pending orders check result:', cancelResult);
        }
      } catch (err) {
        console.warn('Failed to cancel expired pending orders:', err);
      }

      // Second, cancel expired confirmed orders
      try {
        console.log('Checking for expired confirmed orders...');
        const { data: cancelConfirmedResult, error: cancelConfirmedError } = await supabase
          .rpc('cancel_expired_confirmed_orders');
        
        if (cancelConfirmedError) {
          console.warn('RPC cancel_expired_confirmed_orders error:', cancelConfirmedError);
          // Fallback: manually cancel expired confirmed orders
          console.log('Attempting manual cancel of expired confirmed orders...');
          const now = new Date().toISOString();
          const { data: expiredConfirmed, error: fetchError } = await supabase
            .from('orders')
            .select('id, order_number')
            .eq('status', 'confirmed')
            .lt('expires_at', now);
          
          if (!fetchError && expiredConfirmed && expiredConfirmed.length > 0) {
            console.log(`Found ${expiredConfirmed.length} expired confirmed orders, cancelling...`);
            for (const order of expiredConfirmed) {
              const { error: updateError } = await supabase
                .from('orders')
                .update({ status: 'cancelled', updated_at: now })
                .eq('id', order.id);
              
              if (updateError) {
                console.error(`Failed to cancel confirmed order ${order.order_number}:`, updateError);
              } else {
                console.log(`Cancelled confirmed order ${order.order_number}`);
              }
            }
          }
        } else {
          console.log('Expired confirmed orders check result:', cancelConfirmedResult);
        }
      } catch (err) {
        console.warn('Failed to cancel expired confirmed orders:', err);
      }
      
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Orders fetch error:', ordersError);
        throw ordersError;
      }

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        setIsLoadingOrders(false);
        return;
      }

      const ordersWithProfiles = await Promise.all(
        ordersData.map(async (order) => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, email')
              .eq('id', order.user_id)
              .single();

            const { data: items } = await supabase
              .from('order_items')
              .select('id, product_id, quantity, price_at_time')
              .eq('order_id', order.id);

            const itemsWithProducts = await Promise.all(
              (items || []).map(async (item) => {
                const { data: product } = await supabase
                  .from('products')
                  .select('name')
                  .eq('id', item.product_id)
                  .single();

                return {
                  ...item,
                  products: product || { name: 'Unknown Product' }
                };
              })
            );

            return {
              ...order,
              profiles: profile || { username: 'Unknown', email: 'N/A' },
              order_items: itemsWithProducts
            };
          } catch (err) {
            return {
              ...order,
              profiles: { username: 'Unknown', email: 'N/A' },
              order_items: []
            };
          }
        })
      );

      setOrders(ordersWithProfiles);
      
      const statusMap: {[key: string]: string} = {};
      const originalMap: {[key: string]: string} = {};
      ordersWithProfiles.forEach(order => {
        statusMap[order.id] = order.status;
        originalMap[order.id] = order.status;
      });
      setEditingStatus(statusMap);
      setOriginalStatus(originalMap);
      
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setOrdersError(error.message || 'Failed to fetch orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('id-ID');
  };

  const getDateFromOrderNumber = (orderNumber: string) => {
    const datePart = orderNumber.split('-')[1];
    if (datePart && datePart.length === 8) {
      const year = datePart.substring(0, 4);
      const month = datePart.substring(4, 6);
      const day = datePart.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    return null;
  };

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(ordersSearchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = order.status === statusFilter;
    }
    
    let matchesDate = true;
    if (dateFilterType !== 'all') {
      const orderDate = getDateFromOrderNumber(order.order_number);
      if (dateFilterType === 'today') {
        matchesDate = orderDate === getTodayDate();
      } else if (dateFilterType === 'specific' && specificDate) {
        matchesDate = orderDate === specificDate;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const hasOrderChanges = (orderId: string) => {
    return originalStatus[orderId] !== editingStatus[orderId];
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setEditingStatus(prev => ({
      ...prev,
      [orderId]: newStatus
    }));
  };

  const handleCancelOrderChanges = (orderId: string) => {
    setEditingStatus(prev => ({
      ...prev,
      [orderId]: originalStatus[orderId]
    }));
  };

  const handleSaveStatus = async (orderId: string) => {
    if (!hasOrderChanges(orderId)) return;

    setUpdatingOrders(prev => ({ ...prev, [orderId]: true }));

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: editingStatus[orderId] })
        .eq('id', orderId);

      if (error) throw error;

      setOriginalStatus(prev => ({
        ...prev,
        [orderId]: editingStatus[orderId]
      }));

      alert('Status pesanan berhasil diupdate!');
      
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Gagal mengupdate status pesanan');
    } finally {
      setUpdatingOrders(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'paid':
        return 'bg-purple-500';
      case 'confirmed':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const isOrderExpired = (order: any) => {
    // Only pending and confirmed orders can expire
    if (order.status !== 'pending' && order.status !== 'confirmed') return false;
    const expiresAt = new Date(order.expires_at).getTime();
    const now = Date.now();
    return expiresAt < now;
  };

  const getDisplayStatus = (order: any) => {
    if (isOrderExpired(order)) {
      if (order.status === 'pending') {
        return 'expired-pending';
      } else if (order.status === 'confirmed') {
        return 'expired-confirmed';
      }
    }
    return order.status;
  };

  const getDisplayStatusColor = (order: any) => {
    const displayStatus = getDisplayStatus(order);
    if (displayStatus === 'expired-pending' || displayStatus === 'expired-confirmed') {
      return 'bg-gray-600';
    }
    return getStatusColor(order.status);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (dateFilterType !== 'all') count++;
    return count;
  };

  const clearAllFilters = () => {
    setStatusFilter('all');
    setDateFilterType('all');
    setSpecificDate('');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showFilterDropdown && !target.closest('.filter-dropdown-container')) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getBreadcrumb = () => {
    switch (activeRoute) {
      case 'new-item':
        return 'home/Manage catalog/New item';
      case 'edit-item':
        return 'home/Manage catalog/Edit item';
      case 'delete-item':
        return 'home/Manage catalog/Delete item';
      case 'manage-order':
        return 'home/Manage order/View orders';
      default:
        return 'home/Manage catalog';
    }
  };

  const sidebarItems = [
    { id: 'manage-catalog', label: 'Manage catalog', items: [
      { id: 'new-item', label: 'New item' },
      { id: 'edit-item', label: 'Edit item' },
      { id: 'delete-item', label: 'Delete item' }
    ]},
    { id: 'manage-order', label: 'Manage order', items: [], isButton: true },
  ];

  return (
    <div className="flex">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <div className="hidden md:block w-64 bg-white p-4 min-h-screen">
        <nav className="space-y-2">
          {sidebarItems.map((section) => (
            <div key={section.id} className="mb-6">
              {/* Only show header if not a button */}
              {!section.isButton && (
                <h3 className="text-gray-600 text-sm font-medium mb-2">
                  {section.label}
                </h3>
              )}
              {section.items.length > 0 ? (
                section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveRoute(item.id)}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      activeRoute === item.id
                        ? 'bg-gray-200 text-black font-medium'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                    }`}
                  >
                    {item.label}
                  </button>
                ))
              ) : section.isButton ? (
                <button
                  onClick={() => setActiveRoute(section.id)}
                  className={`w-full text-left px-3 py-2 rounded text-sm ${
                    activeRoute === section.id
                      ? 'bg-gray-200 text-black font-medium'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                  }`}
                >
                  {section.label}
                </button>
              ) : null}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 text-white">
        {/* Mobile: Search and Refresh at Top */}
        <div className="md:hidden mb-4 flex items-center gap-2">
          {/* Search Input for Products */}
          {(activeRoute === 'edit-item' || activeRoute === 'delete-item') && (
            <>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                />
                <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-2 text-white rounded-lg transition-colors flex-shrink-0 ${
                  isRefreshing 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                title="Refresh"
              >
                <svg 
                  className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </>
          )}

          {/* Search Input for Orders */}
          {activeRoute === 'manage-order' && (
            <>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search order..."
                  value={ordersSearchQuery}
                  onChange={(e) => setOrdersSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                />
                <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="relative filter-dropdown-container">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="p-2 bg-gray-800 border border-gray-600 rounded-lg text-white hover:bg-gray-700 focus:outline-none focus:border-blue-500 flex items-center gap-1 flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {getActiveFiltersCount() > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {getActiveFiltersCount()}
                    </span>
                  )}
                </button>

                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 p-4">
                    <div className="mb-4">
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Filter by Status
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Filter by Date
                      </label>
                      <select
                        value={dateFilterType}
                        onChange={(e) => {
                          setDateFilterType(e.target.value);
                          if (e.target.value !== 'specific') {
                            setSpecificDate('');
                          }
                        }}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 mb-2 text-sm"
                      >
                        <option value="all">All Dates</option>
                        <option value="today">Today</option>
                        <option value="specific">Specific Date</option>
                      </select>

                      {dateFilterType === 'specific' && (
                        <input
                          type="date"
                          value={specificDate}
                          onChange={(e) => setSpecificDate(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                        />
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={clearAllFilters}
                        className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => setShowFilterDropdown(false)}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Breadcrumb with Desktop Search and Refresh */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-gray-400 text-sm md:text-base">
              {getBreadcrumb()}
            </div>
            
            {/* Search Results Counter */}
            {(activeRoute === 'edit-item' || activeRoute === 'delete-item') && searchQuery && (
              <div className="hidden md:block text-sm text-gray-500">
                ({filteredProducts.length} of {products.length} items)
              </div>
            )}
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            {/* Filter Button for Manage Orders */}
            {activeRoute === 'manage-order' && (
              <div className="relative filter-dropdown-container">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white hover:bg-gray-700 focus:outline-none focus:border-blue-500 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter
                  {getActiveFiltersCount() > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {getActiveFiltersCount()}
                    </span>
                  )}
                </button>

                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 p-4">
                    <div className="mb-4">
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Filter by Status
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Filter by Date
                      </label>
                      <select
                        value={dateFilterType}
                        onChange={(e) => {
                          setDateFilterType(e.target.value);
                          if (e.target.value !== 'specific') {
                            setSpecificDate('');
                          }
                        }}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 mb-2"
                      >
                        <option value="all">All Dates</option>
                        <option value="today">Today</option>
                        <option value="specific">Specific Date</option>
                      </select>

                      {dateFilterType === 'specific' && (
                        <input
                          type="date"
                          value={specificDate}
                          onChange={(e) => setSpecificDate(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                        />
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={clearAllFilters}
                        className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => setShowFilterDropdown(false)}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Refresh Button */}
            {(activeRoute === 'edit-item' || activeRoute === 'delete-item') && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 transition-colors ${
                  isRefreshing 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                title="Refresh data"
              >
                <svg 
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            )}
            
            {/* Search Input for Products */}
            {(activeRoute === 'edit-item' || activeRoute === 'delete-item') && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 w-64"
                />
                <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            )}

            {/* Search Input for Orders */}
            {activeRoute === 'manage-order' && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search order ID..."
                  value={ordersSearchQuery}
                  onChange={(e) => setOrdersSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 w-64"
                />
                <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Active Filters Display for Manage Orders */}
        {activeRoute === 'manage-order' && getActiveFiltersCount() > 0 && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-gray-400 text-sm">Active filters:</span>
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                Status: {statusFilter}
                <button
                  onClick={() => setStatusFilter('all')}
                  className="hover:bg-blue-700 rounded-full p-0.5"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {dateFilterType === 'today' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                Date: Today
                <button
                  onClick={() => setDateFilterType('all')}
                  className="hover:bg-green-700 rounded-full p-0.5"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {dateFilterType === 'specific' && specificDate && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                Date: {new Date(specificDate).toLocaleDateString('id-ID')}
                <button
                  onClick={() => {
                    setDateFilterType('all');
                    setSpecificDate('');
                  }}
                  className="hover:bg-green-700 rounded-full p-0.5"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-gray-400 hover:text-white text-sm underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Content Area */}
        {activeRoute === 'new-item' && (
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Top Row */}
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <input
                      type="text"
                      placeholder="Item name"
                      value={itemName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className={`w-full p-4 bg-transparent border rounded text-white placeholder-gray-400 focus:outline-none ${
                        nameError 
                          ? 'border-red-500 focus:border-red-400' 
                          : 'border-gray-600 focus:border-gray-400'
                      }`}
                      required
                    />
                    {/* Name validation feedback */}
                    <div className="mt-1 min-h-[20px]">
                      {isCheckingName && (
                        <p className="text-yellow-400 text-sm">Checking name availability...</p>
                      )}
                      {nameError && (
                        <p className="text-red-400 text-sm">{nameError}</p>
                      )}
                      {!nameError && !isCheckingName && itemName.trim() && (
                        <p className="text-green-400 text-sm">✓ Name is available</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Price"
                      value={formatNumber(price)}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className="w-full p-4 bg-transparent border border-gray-600 rounded text-white placeholder-gray-400 focus:border-gray-400 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Stock"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full p-4 bg-transparent border border-gray-600 rounded text-white placeholder-gray-400 focus:border-gray-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Second Row */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <input
                      type="text"
                      placeholder="Vehicle Type"
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full p-4 bg-transparent border border-gray-600 rounded text-white placeholder-gray-400 focus:border-gray-400 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Item Type"
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value)}
                      className="w-full p-4 bg-transparent border border-gray-600 rounded text-white placeholder-gray-400 focus:border-gray-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Image Upload */}
                  <div className="border border-gray-600 rounded p-8 flex flex-col items-center justify-center h-64">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      {image ? (
                        <div className="text-center">
                          <img
                            src={URL.createObjectURL(image)}
                            alt="Preview"
                            className="max-h-32 max-w-32 object-cover rounded mb-2"
                          />
                          <p className="text-gray-400 text-sm">{image.name}</p>
                        </div>
                      ) : (
                        <>
                          <div className="text-gray-400 text-center mb-4">
                            <p>Input</p>
                            <p>new</p>
                            <p>image</p>
                          </div>
                          <div className="w-8 h-8 border border-gray-400 rounded-full flex items-center justify-center">
                            <span className="text-gray-400 text-xl">+</span>
                          </div>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Description with Drag & Drop for TXT files */}
                  <div className="relative">
                    <div 
                      className={`border-2 border-dashed rounded p-4 h-64 transition-colors ${
                        isDragOver 
                          ? 'border-blue-400 bg-blue-900/20' 
                          : 'border-gray-600'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <textarea
                        placeholder="New description (or drag & drop a .txt file here)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full h-full bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none"
                        required
                      />
                      
                      {/* Drag overlay */}
                      {isDragOver && (
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-900/30 rounded">
                          <div className="text-blue-400 text-center">
                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="font-medium">Drop .txt file here</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* File upload button for txt */}
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="file"
                        accept=".txt"
                        onChange={handleTxtInputChange}
                        className="hidden"
                        id="txt-upload"
                      />
                      <label
                        htmlFor="txt-upload"
                        className="cursor-pointer text-sm text-gray-400 hover:text-white flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Upload .txt file
                      </label>
                      {description && (
                        <button
                          type="button"
                          onClick={() => setDescription('')}
                          className="text-sm text-red-400 hover:text-red-300"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center mt-8 space-x-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Adding...' : 'Input new detail'}
                  </button>
                  
                  {isLoading && (
                    <button
                      type="button"
                      onClick={() => {
                        console.log('Force reset loading state');
                        setIsLoading(false);
                      }}
                      className="bg-red-500 text-white px-4 py-3 rounded-full font-medium hover:bg-red-600"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Item Page */}
        {activeRoute === 'edit-item' && (
          <div className="flex justify-center">
            <div className="w-full max-w-7xl">
              {isFetchingProducts ? (
                <div className="flex flex-col justify-center items-center h-64">
                  <p className="text-gray-500 text-xl opacity-50 mb-4">LOADING PRODUCTS...</p>
                  {showRefreshWarning && (
                    <p className="text-orange-400 text-sm opacity-75">
                      Page will refresh automatically...
                    </p>
                  )}
                </div>
              ) : products.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500 text-xl opacity-50">NO ITEMS TO EDIT.</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500 text-xl opacity-50">NO ITEMS FOUND FOR "{searchQuery}".</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredProducts.map((product) => (
                    <div key={product.id}>
                      {/* Desktop Layout */}
                      <div className="hidden md:grid md:grid-cols-[400px_1fr_330px] gap-8 items-start">
                        <div className="w-[400px] h-[400px] bg-white rounded flex items-center justify-center overflow-hidden relative border-2 border-gray-200">
                          <div className="absolute inset-0 opacity-5">
                            <div className="w-full h-full" style={{
                              backgroundImage: `
                                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                              `,
                              backgroundSize: '20px 20px'
                            }}></div>
                          </div>
                          
                          <OptimizedImage
                            src={transformImageUrl(product.image_url)}
                            alt={product.name}
                            aspectRatio="aspect-auto"
                            className="max-w-full max-h-full"
                            fallback={
                              <div className="flex flex-col items-center justify-center text-gray-400 h-full">
                                <div className="w-12 h-12 border-2 border-gray-300 rounded-full flex items-center justify-center mb-2">
                                  <span className="text-2xl">+</span>
                                </div>
                                <p className="text-sm">No Image</p>
                              </div>
                            }
                          />
                        </div>

                        {/* Product Info */}
                        <div className="border border-gray-600 rounded p-8 h-[400px] flex flex-col">
                          <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-600">
                            <input
                              type="text"
                              value={editingName[product.id] !== undefined ? editingName[product.id] : product.name}
                              onChange={(e) => setEditingName(prev => ({...prev, [product.id]: e.target.value}))}
                              className={`bg-transparent font-bold text-xl uppercase border-none outline-none focus:bg-gray-800 rounded px-3 py-2 flex-1 mr-4 min-w-0 ${
                                hasChanges(product.id) && originalValues[product.id]?.name !== editingName[product.id]
                                  ? 'text-green-400'
                                  : 'text-white'
                              }`}
                            />
                            <div className="flex items-center">
                              <span className="text-white text-base mr-3">IDR</span>
                              <input
                                type="text"
                                value={editingPrice[product.id] !== undefined ? formatNumber(editingPrice[product.id]) : formatNumber(product.price)}
                                onChange={(e) => handlePriceChange(e.target.value, product.id)}
                                className={`bg-transparent text-base border-none outline-none focus:bg-gray-800 rounded px-3 py-2 w-32 text-right ${
                                  hasChanges(product.id) && originalValues[product.id]?.price !== editingPrice[product.id]
                                    ? 'text-green-400'
                                    : 'text-white'
                                }`}
                              />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-h-0">
                            <textarea
                              value={editingDescription[product.id] !== undefined ? editingDescription[product.id] : (product.description || '')}
                              onChange={(e) => setEditingDescription(prev => ({...prev, [product.id]: e.target.value}))}
                              placeholder="Add description..."
                              className={`w-full h-full bg-transparent text-base leading-relaxed border-none outline-none focus:bg-gray-800 rounded px-3 py-2 resize-none ${
                                hasChanges(product.id) && originalValues[product.id]?.description !== editingDescription[product.id]
                                  ? 'text-green-400'
                                  : 'text-gray-300'
                              }`}
                              style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
                            />
                          </div>
                        </div>

                        {/* Stock Controls */}
                        <div className="flex flex-col items-center justify-center space-y-4 h-[400px]">
                          {hasChanges(product.id) && !updatingProducts[product.id] && (
                            <div className="text-red-400 text-sm font-medium text-center mb-2">
                              ITEMS NOT SAVED.
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-3 bg-white rounded-full px-6 py-3">
                            <button
                              onClick={() => handleStockChange(product.id, -1)}
                              disabled={updatingProducts[product.id]}
                              className="text-black font-bold text-xl w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className={`font-medium min-w-[3rem] text-center text-lg ${
                              hasChanges(product.id) && originalValues[product.id]?.stock !== editStocks[product.id] 
                                ? 'text-green-500' 
                                : 'text-black'
                            }`}>
                              {editStocks[product.id] !== undefined ? editStocks[product.id] : product.stock}
                            </span>
                            <button
                              onClick={() => handleStockChange(product.id, 1)}
                              disabled={updatingProducts[product.id]}
                              className="text-black font-bold text-xl w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                          
                          <div className="flex flex-col items-center space-y-2">
                            <button
                              onClick={() => handleConfirmEdit(product.id)}
                              disabled={!hasChanges(product.id) || updatingProducts[product.id]}
                              className={`px-8 py-3 rounded-full font-medium transition-colors ${
                                updatingProducts[product.id]
                                  ? 'bg-blue-500 text-white cursor-wait'
                                  : hasChanges(product.id)
                                  ? 'bg-white text-black hover:bg-gray-200 cursor-pointer'
                                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                              }`}
                            >
                              {updatingProducts[product.id] ? 'Updating...' : 'Confirm edit'}
                            </button>
                            
                            {updatingProducts[product.id] && (
                              <button
                                onClick={() => {
                                  console.log('Force clearing loading state for:', product.id);
                                  setUpdatingProducts(prev => ({ ...prev, [product.id]: false }));
                                }}
                                className="text-red-400 text-xs underline hover:text-red-300"
                              >
                                Force Reset
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mobile Layout */}
                      <div className="md:hidden space-y-4">
                        {/* Image - Smaller */}
                        <div className="w-full h-48 bg-white rounded flex items-center justify-center overflow-hidden relative border-2 border-gray-200 p-4">
                          {product.image_url ? (
                            <img
                              src={transformImageUrl(product.image_url) || ''}
                              alt={product.name}
                              style={{
                                maxWidth: '90%',
                                maxHeight: '90%',
                                width: 'auto',
                                height: 'auto',
                                objectFit: 'contain'
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling;
                                if (fallback) (fallback as HTMLElement).style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="hidden flex-col items-center justify-center text-gray-400">
                            <div className="w-8 h-8 border-2 border-gray-300 rounded-full flex items-center justify-center mb-1">
                              <span className="text-lg">+</span>
                            </div>
                            <p className="text-xs">No Image</p>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="border border-gray-600 rounded p-4">
                          {/* Name */}
                          <input
                            type="text"
                            value={editingName[product.id] !== undefined ? editingName[product.id] : product.name}
                            onChange={(e) => setEditingName(prev => ({...prev, [product.id]: e.target.value}))}
                            className={`w-full bg-transparent font-bold text-sm uppercase border-none outline-none focus:bg-gray-800 rounded px-2 py-1 mb-2 ${
                              hasChanges(product.id) && originalValues[product.id]?.name !== editingName[product.id]
                                ? 'text-green-400'
                                : 'text-white'
                            }`}
                          />
                          
                          {/* Price */}
                          <div className="flex items-center mb-3 pb-3 border-b border-gray-600">
                            <span className="text-white text-sm mr-2">IDR</span>
                            <input
                              type="text"
                              value={editingPrice[product.id] !== undefined ? formatNumber(editingPrice[product.id]) : formatNumber(product.price)}
                              onChange={(e) => handlePriceChange(e.target.value, product.id)}
                              className={`bg-transparent text-sm border-none outline-none focus:bg-gray-800 rounded px-2 py-1 flex-1 ${
                                hasChanges(product.id) && originalValues[product.id]?.price !== editingPrice[product.id]
                                  ? 'text-green-400'
                                  : 'text-white'
                              }`}
                            />
                          </div>
                          
                          {/* Description */}
                          <textarea
                            value={editingDescription[product.id] !== undefined ? editingDescription[product.id] : (product.description || '')}
                            onChange={(e) => setEditingDescription(prev => ({...prev, [product.id]: e.target.value}))}
                            placeholder="Add description..."
                            rows={4}
                            className={`w-full bg-transparent text-sm leading-relaxed border-none outline-none focus:bg-gray-800 rounded px-2 py-1 resize-none ${
                              hasChanges(product.id) && originalValues[product.id]?.description !== editingDescription[product.id]
                                ? 'text-green-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </div>

                        {/* Stock and Actions */}
                        <div className="space-y-3">
                          {hasChanges(product.id) && !updatingProducts[product.id] && (
                            <div className="text-red-400 text-xs font-medium text-center">
                              ITEMS NOT SAVED.
                            </div>
                          )}
                          
                          {/* Stock Controls and Confirm Button in Same Row */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center space-x-2 bg-white rounded-full px-4 py-2">
                              <button
                                onClick={() => handleStockChange(product.id, -1)}
                                disabled={updatingProducts[product.id]}
                                className="text-black font-bold text-lg w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded-full disabled:opacity-50"
                              >
                                -
                              </button>
                              <span className={`font-medium min-w-[2.5rem] text-center ${
                                hasChanges(product.id) && originalValues[product.id]?.stock !== editStocks[product.id] 
                                  ? 'text-green-500' 
                                  : 'text-black'
                              }`}>
                                {editStocks[product.id] !== undefined ? editStocks[product.id] : product.stock}
                              </span>
                              <button
                                onClick={() => handleStockChange(product.id, 1)}
                                disabled={updatingProducts[product.id]}
                                className="text-black font-bold text-lg w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded-full disabled:opacity-50"
                              >
                                +
                              </button>
                            </div>
                            
                            <button
                              onClick={() => handleConfirmEdit(product.id)}
                              disabled={!hasChanges(product.id) || updatingProducts[product.id]}
                              className={`flex-1 px-4 py-2 rounded-full font-medium transition-colors text-sm ${
                                updatingProducts[product.id]
                                  ? 'bg-blue-500 text-white cursor-wait'
                                  : hasChanges(product.id)
                                  ? 'bg-white text-black hover:bg-gray-200 cursor-pointer'
                                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                              }`}
                            >
                              {updatingProducts[product.id] ? 'Updating...' : 'Confirm'}
                            </button>
                          </div>
                        </div>

                        {/* Divider between items */}
                        <div className="border-t border-gray-600 mt-6"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Item Page */}
        {activeRoute === 'delete-item' && (
          <div className="flex justify-center">
            <div className="w-full max-w-7xl">
              {isFetchingProducts ? (
                <div className="flex flex-col justify-center items-center h-64">
                  <p className="text-gray-500 text-xl opacity-50 mb-4">LOADING PRODUCTS...</p>
                  {showRefreshWarning && (
                    <p className="text-orange-400 text-sm opacity-75">
                      Page will refresh automatically...
                    </p>
                  )}
                </div>
              ) : products.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500 text-xl opacity-50">NO ITEMS TO DELETE.</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500 text-xl opacity-50">NO ITEMS FOUND FOR "{searchQuery}".</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredProducts.map((product) => (
                    <div key={product.id}>
                      {/* Desktop Layout */}
                      <div className="hidden md:grid md:grid-cols-[400px_1fr_220px] gap-12 items-start">
                        {/* Product Image Canvas */}
                        <div className="w-[400px] h-[400px] bg-white rounded flex items-center justify-center overflow-hidden relative border-2 border-gray-200">
                          {/* Canvas background dengan grid pattern */}
                          <div className="absolute inset-0 opacity-5">
                            <div className="w-full h-full" style={{
                              backgroundImage: `
                                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                              `,
                              backgroundSize: '20px 20px'
                            }}></div>
                          </div>
                          
                          {/* Image content */}
                          <OptimizedImage
                            src={transformImageUrl(product.image_url)}
                            alt={product.name}
                            aspectRatio="aspect-auto"
                            className="max-w-full max-h-full"
                            fallback={
                              <div className="flex flex-col items-center justify-center text-gray-400 h-full">
                                <div className="w-12 h-12 border-2 border-gray-300 rounded-full flex items-center justify-center mb-2">
                                  <span className="text-2xl">+</span>
                                </div>
                                <p className="text-sm">No Image</p>
                              </div>
                            }
                          />
                        </div>

                        {/* Product Info */}
                        <div className="border border-gray-600 rounded p-12 h-[400px] flex flex-col">
                          <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-600">
                            <h3 className="text-white font-bold text-xl uppercase pr-4 flex-1 min-w-0">
                              <div title={product.name}>{truncateText(product.name, 20)}</div>
                            </h3>
                            <p className="text-white text-base whitespace-nowrap">IDR {formatNumber(product.price)}</p>
                          </div>
                          
                          {/* Description Area */}
                          <div className="flex-1 min-h-0">
                            {product.description && product.description.trim() ? (
                              <div className="h-full overflow-y-auto pr-2">
                                <p 
                                  className="text-gray-300 text-base leading-relaxed"
                                  style={{ 
                                    wordWrap: 'break-word', 
                                    overflowWrap: 'break-word', 
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    hyphens: 'auto'
                                  }}
                                >
                                  {product.description}
                                </p>
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center">
                                <p className="text-gray-500 text-base italic">Tidak ada deskripsi</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Delete Controls */}
                        <div className="flex flex-col items-center justify-center h-[400px]">
                          {deletingProducts[product.id] ? (
                            <div className="flex flex-col items-center space-y-4">
                              <div className="bg-blue-500 text-white px-8 py-3 rounded-full font-medium">
                                Deleting...
                              </div>
                            </div>
                          ) : deleteConfirm === product.id ? (
                            <div className="flex flex-col items-center space-y-4">
                              <p className="text-white text-base text-center">Lanjut untuk DELETE?</p>
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  disabled={deletingProducts[product.id]}
                                  className="bg-green-500 text-white px-6 py-3 rounded font-medium hover:bg-green-600 disabled:opacity-50"
                                >
                                  Ya
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  disabled={deletingProducts[product.id]}
                                  className="bg-red-500 text-white px-6 py-3 rounded font-medium hover:bg-red-600 disabled:opacity-50"
                                >
                                  Tidak
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(product.id)}
                              disabled={deletingProducts[product.id]}
                              className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-gray-200 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Mobile Layout */}
                      <div className="md:hidden space-y-4">
                        {/* Image - Smaller */}
                        <div className="w-full h-48 bg-white rounded flex items-center justify-center overflow-hidden relative border-2 border-gray-200 p-4">
                          {product.image_url ? (
                            <img
                              src={transformImageUrl(product.image_url) || ''}
                              alt={product.name}
                              style={{
                                maxWidth: '90%',
                                maxHeight: '90%',
                                width: 'auto',
                                height: 'auto',
                                objectFit: 'contain'
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling;
                                if (fallback) (fallback as HTMLElement).style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="hidden flex-col items-center justify-center text-gray-400">
                            <div className="w-8 h-8 border-2 border-gray-300 rounded-full flex items-center justify-center mb-1">
                              <span className="text-lg">+</span>
                            </div>
                            <p className="text-xs">No Image</p>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="border border-gray-600 rounded p-4">
                          <h3 className="text-white font-bold text-sm uppercase mb-2 truncate">
                            {truncateText(product.name, 30)}
                          </h3>
                          <p className="text-white text-sm mb-3 pb-3 border-b border-gray-600">
                            IDR {formatNumber(product.price)}
                          </p>
                          
                          {product.description && product.description.trim() ? (
                            <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                              {product.description}
                            </p>
                          ) : (
                            <p className="text-gray-500 text-sm italic">Tidak ada deskripsi</p>
                          )}
                        </div>

                        {/* Delete Controls */}
                        <div className="flex flex-col items-center">
                          {deletingProducts[product.id] ? (
                            <div className="bg-blue-500 text-white px-6 py-2.5 rounded-full font-medium text-sm">
                              Deleting...
                            </div>
                          ) : deleteConfirm === product.id ? (
                            <div className="w-full space-y-3">
                              <p className="text-white text-sm text-center">Lanjut untuk DELETE?</p>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  disabled={deletingProducts[product.id]}
                                  className="flex-1 bg-green-500 text-white px-4 py-2.5 rounded-full font-medium hover:bg-green-600 disabled:opacity-50 text-sm"
                                >
                                  Ya
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  disabled={deletingProducts[product.id]}
                                  className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-full font-medium hover:bg-red-600 disabled:opacity-50 text-sm"
                                >
                                  Tidak
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(product.id)}
                              disabled={deletingProducts[product.id]}
                              className="w-full bg-white text-black px-6 py-2.5 rounded-full font-medium hover:bg-gray-200 disabled:opacity-50 text-sm"
                            >
                              Delete
                            </button>
                          )}
                        </div>

                        {/* Divider between items */}
                        <div className="border-t border-gray-600 mt-6"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manage Order Page */}
        {activeRoute === 'manage-order' && (
          <div className="flex justify-center">
            <div className="w-full" style={{ maxWidth: '1400px' }}>
              {/* Error Display */}
              {ordersError && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg">
                  <p className="text-red-200 text-center">
                    Error: {ordersError}
                  </p>
                  <button
                    onClick={fetchOrders}
                    className="mt-2 mx-auto block px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
                  >
                    Retry
                  </button>
                </div>
              )}
              
              {isLoadingOrders ? (
                <div className="flex flex-col justify-center items-center h-64 gap-4">
                  <p className="text-gray-500 text-xl opacity-50">LOADING ORDERS...</p>
                  {showOrdersRefreshWarning && (
                    <p className="text-yellow-500 text-sm">
                      Taking longer than usual... Page will refresh automatically.
                    </p>
                  )}
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500 text-xl opacity-50">
                    {ordersSearchQuery || statusFilter !== 'all' || dateFilterType !== 'all' ? 'NO ORDERS FOUND.' : 'NO ORDERS YET.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="md:grid md:grid-cols-[1fr_280px] md:gap-8 md:items-start">
                      {/* Order Info Box */}
                      <div className="border border-gray-600 rounded p-4 md:p-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-gray-400 text-sm mb-1">ID Pesanan</p>
                            <p className="text-white font-mono text-base md:text-lg">{order.order_number}</p>
                          </div>

                          {/* Mobile: Single Column, Desktop: Two Columns */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-gray-400 text-sm mb-1">Nama Akun</p>
                              <p className="text-white">{order.profiles?.username || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm mb-1">Email Pemesan</p>
                              <p className="text-white break-all">{order.profiles?.email || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-gray-400 text-sm mb-1">Waktu Pesan</p>
                              <p className="text-white text-sm md:text-base">{formatDate(order.created_at)}</p>
                            </div>
                            {(order.status === 'pending' || order.status === 'confirmed') && (
                              <div>
                                <p className="text-gray-400 text-sm mb-1">
                                  {order.status === 'pending' ? 'Waktu Berakhir (Pending)' : 'Waktu Berakhir (Confirmed)'}
                                </p>
                                <p className="text-white text-sm md:text-base">{formatDate(order.expires_at)}</p>
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="text-gray-400 text-sm mb-2">List Item</p>
                            <div className="bg-gray-800 rounded p-3 md:p-4 space-y-2">
                              {order.order_items.slice(0, 2).map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center gap-2 text-sm md:text-base">
                                  <span className="text-white flex-1">{truncateText(item.products?.name, 20) || 'Unknown Product'}</span>
                                  <span className="text-gray-400 flex-shrink-0">x{item.quantity}</span>
                                  <span className="text-white flex-shrink-0">IDR {formatCurrency(item.price_at_time * item.quantity)}</span>
                                </div>
                              ))}
                              {order.order_items.length > 2 && (
                                <div className="text-gray-400 text-sm pt-2 border-t border-gray-700">
                                  +{order.order_items.length - 2} more items
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="border-t border-gray-600 pt-4">
                            <div className="flex justify-between items-center">
                              <p className="text-gray-400 text-base md:text-lg">Total Harga</p>
                              <p className="text-white text-lg md:text-xl font-bold">IDR {formatCurrency(order.total_amount)}</p>
                            </div>
                          </div>

                          {/* Mobile: Buttons inside the box, below total */}
                          <div className="md:hidden border-t border-gray-600 pt-4 space-y-3">
                            {hasOrderChanges(order.id) && !updatingOrders[order.id] && (
                              <div className="text-red-400 text-sm font-medium text-center">
                                CHANGES NOT SAVED.
                              </div>
                            )}

                            {isOrderExpired(order) && (
                              <div className="px-4 py-2 bg-gray-600 text-white text-center rounded-lg text-sm font-medium">
                                ⏰ EXPIRED - Will be cancelled
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                              {/* Left: Status Dropdown */}
                              <select
                                value={editingStatus[order.id] || order.status}
                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                disabled={updatingOrders[order.id] || isOrderExpired(order)}
                                className={`px-3 py-2 rounded-lg text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                                  getDisplayStatusColor(order)
                                }`}
                              >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>

                              {/* Right: Confirm Button */}
                              <button
                                onClick={() => handleSaveStatus(order.id)}
                                disabled={!hasOrderChanges(order.id) || updatingOrders[order.id] || isOrderExpired(order)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  updatingOrders[order.id]
                                    ? 'bg-blue-500 text-white cursor-wait'
                                    : hasOrderChanges(order.id) && !isOrderExpired(order)
                                    ? 'bg-white text-black hover:bg-gray-200 cursor-pointer'
                                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                }`}
                              >
                                {updatingOrders[order.id] ? 'Saving...' : 'Confirm'}
                              </button>
                            </div>

                            {hasOrderChanges(order.id) && !updatingOrders[order.id] && !isOrderExpired(order) && (
                              <button
                                onClick={() => handleCancelOrderChanges(order.id)}
                                className="w-full text-gray-400 text-xs underline hover:text-white"
                              >
                                CANCEL CHANGES.
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Desktop: Status Controls on the Right */}
                      <div className="hidden md:flex flex-col items-center justify-center space-y-4">
                        {hasOrderChanges(order.id) && !updatingOrders[order.id] && (
                          <div className="text-red-400 text-sm font-medium text-center">
                            CHANGES NOT SAVED.
                          </div>
                        )}

                        {isOrderExpired(order) && (
                          <div className="w-full px-4 py-2 bg-gray-600 text-white text-center rounded-lg text-sm font-medium">
                            ⏰ EXPIRED - Will be cancelled
                          </div>
                        )}

                        <div className="w-full">
                          <select
                            value={editingStatus[order.id] || order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            disabled={updatingOrders[order.id] || isOrderExpired(order)}
                            className={`w-full px-4 py-3 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                              getDisplayStatusColor(order)
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>

                        <button
                          onClick={() => handleSaveStatus(order.id)}
                          disabled={!hasOrderChanges(order.id) || updatingOrders[order.id] || isOrderExpired(order)}
                          className={`w-full px-8 py-3 rounded-full font-medium transition-colors ${
                            updatingOrders[order.id]
                              ? 'bg-blue-500 text-white cursor-wait'
                              : hasOrderChanges(order.id) && !isOrderExpired(order)
                              ? 'bg-white text-black hover:bg-gray-200 cursor-pointer'
                              : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          {updatingOrders[order.id] ? 'Saving...' : 'Save'}
                        </button>

                        {hasOrderChanges(order.id) && !updatingOrders[order.id] && !isOrderExpired(order) && (
                          <button
                            onClick={() => handleCancelOrderChanges(order.id)}
                            className="text-gray-400 text-xs underline hover:text-white"
                          >
                            CANCEL CHANGES.
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}