
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

// Define cors headers for the function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Process an incoming request
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the API key from environment
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')
    if (!firecrawlApiKey) {
      throw new Error('Firecrawl API key is not set')
    }

    // Initialize Supabase client with service role to bypass RLS policies
    const supabaseUrl = 'https://kggflbsusrbfqkvlgpxk.supabase.co'
    const supabaseKey = req.headers.get('apikey') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Starting price update job')

    // Fetch products to update
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .order('last_checked', { ascending: true }) // Update oldest checked first
      .limit(10) // Process in batches

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`)
    }

    console.log(`Found ${products.length} products to update`)

    // Process each product
    const results = await Promise.all(
      products.map(async (product) => {
        try {
          console.log(`Updating product: ${product.name} (ID: ${product.id})`)
          
          // Call Firecrawl to get updated price
          const updatedData = await scrapeProductData(product.url, firecrawlApiKey)
          
          // Check if price changed
          const oldPrice = product.current_price
          const newPrice = updatedData.currentPrice
          const priceChanged = oldPrice !== newPrice
          
          console.log(`Price update for ${product.name}: ${oldPrice} -> ${newPrice} (changed: ${priceChanged})`)

          // Prepare update data
          const updateData = {
            current_price: newPrice,
            previous_price: priceChanged ? oldPrice : product.previous_price,
            is_on_sale: newPrice < (product.previous_price || Infinity),
            last_checked: new Date().toISOString()
          }
          
          // Update product in database
          const { error: updateError } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', product.id)
            
          if (updateError) {
            throw new Error(`Failed to update product: ${updateError.message}`)
          }
          
          // Add to price history if price changed
          if (priceChanged) {
            await supabase
              .from('price_history')
              .insert({
                product_id: product.id,
                price: newPrice
              })
          }
          
          return {
            id: product.id,
            name: product.name,
            success: true,
            priceChanged
          }
        } catch (error) {
          console.error(`Error updating product ${product.id}:`, error)
          return {
            id: product.id,
            name: product.name,
            success: false,
            error: error.message
          }
        }
      })
    )

    // Return summary of results
    return new Response(
      JSON.stringify({
        success: true,
        updated: results.length,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in update-prices function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to update prices',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// Scrape product data using Firecrawl API
async function scrapeProductData(url: string, apiKey: string) {
  console.log('Fetching updated product data for:', url)
  const firecrawlUrl = 'https://api.firecrawl.co/product-data'
  
  const response = await fetch(firecrawlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ url })
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('Firecrawl API error:', errorText)
    throw new Error(`Firecrawl API Error: ${response.status} ${errorText}`)
  }
  
  const data = await response.json()
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to extract product data')
  }
  
  // Map Firecrawl response to our product structure
  const productData = {
    name: data.data?.title || 'Unknown Product',
    currentPrice: parseFloat(data.data?.price?.current || '0'),
    previousPrice: data.data?.price?.previous ? parseFloat(data.data?.price?.previous) : null,
    imageUrl: data.data?.images?.[0] || 'https://via.placeholder.com/300'
  }
  
  return productData
}
