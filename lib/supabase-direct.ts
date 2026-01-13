const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function insertProductDirect(productData: {
  name: string;
  price: number;
  description: string;
  image_url: string;
  stock: number;
  vehicle_type: string;
  item_type: string;
}) {
  try {
    console.log('Using direct REST API call to Supabase...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(productData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 409 || errorText.includes('duplicate key') || errorText.includes('unique constraint')) {
        throw new Error('Product name already exists. Please choose a different name.');
      }
      
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Direct API response:', data);
    return { data, error: null };
    
  } catch (error) {
    console.error('Direct API error:', error);
    return { data: null, error };
  }
}