import { supabase } from './supabase';

export const cancelExpiredOrders = async () => {
    try {
        const { data, error } = await supabase.rpc('cancel_expired_orders');
        
        if (error) {
            console.error('Error cancelling expired orders:', error);
            return { success: false, error: error.message };
        }
        
        console.log('Expired orders cleanup result:', data);
        return data;
    } catch (error) {
        console.error('Error calling cancel_expired_orders:', error);
        return { success: false, error: 'Failed to cancel expired orders' };
    }
};

export const restoreStockForOrder = async (orderId: string) => {
    try {
        const { data, error } = await supabase.rpc('restore_stock_on_cancel', {
            order_id_param: orderId
        });
        
        if (error) {
            console.error('Error restoring stock:', error);
            return { success: false, error: error.message };
        }
        
        console.log('Stock restoration result:', data);
        
        if (data && data.already_restored) {
            console.log('Stock was already restored for this order');
            return { success: true, message: 'Stock was already restored', already_restored: true };
        }
        
        return data;
    } catch (error) {
        console.error('Error calling restore_stock_on_cancel:', error);
        return { success: false, error: 'Failed to restore stock' };
    }
};

export const cancelOrderSafely = async (orderId: string) => {
    try {
        const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('id', orderId);

        if (updateError) {
            console.error('Error updating order status:', updateError);
            return { success: false, error: updateError.message };
        }

        console.log('Order cancelled successfully, stock restoration handled by database trigger');
        
        return { success: true, message: 'Order cancelled successfully' };
    } catch (error: any) {
        console.error('Error cancelling order:', error);
        return { success: false, error: error.message || 'Failed to cancel order' };
    }
};

export const isOrderExpired = (expiresAt: string): boolean => {
    return new Date(expiresAt) < new Date();
};

export const getTimeUntilExpiry = (expiresAt: string): number => {
    return new Date(expiresAt).getTime() - new Date().getTime();
};