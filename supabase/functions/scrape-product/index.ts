
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

    // Parse the request body
    const { url } = await req.json()
    if (!url) {
      throw new Error('URL is required')
    }

    console.log(`Scraping product from URL: ${url}`)

    // Initialize Supabase client
    const supabaseUrl = 'https://kggflbsusrbfqkvlgpxk.supabase.co'
    const supabaseKey = req.headers.get('authorization')?.split('Bearer ')[1] || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Determine the store based on URL
    const store = getStoreFromUrl(url)

    // Call the product scraping function
    const productData = await scrapeProductData(url, firecrawlApiKey)

    // Get user ID from JWT
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Authentication required')
    }

    // Calculate price change if there's a previous price
    let priceChange = 0
    if (productData.previousPrice && productData.currentPrice !== productData.previousPrice) {
      priceChange = ((productData.currentPrice - productData.previousPrice) / productData.previousPrice) * 100
    }

    // Prepare product data for storage
    const product = {
      name: productData.name,
      url: url,
      store: store || productData.store || 'Unknown',
      current_price: productData.currentPrice,
      previous_price: productData.previousPrice || null,
      image_url: productData.imageUrl,
      is_on_sale: productData.currentPrice < (productData.previousPrice || Infinity),
      price_target: null,
      user_id: user.id
    }

    // Insert product into database
    const { data: insertedProduct, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()

    if (error) {
      console.error('Error inserting product:', error)
      throw new Error(`Failed to save product: ${error.message}`)
    }

    // Insert initial price history record
    await supabase
      .from('price_history')
      .insert({
        product_id: insertedProduct.id,
        price: productData.currentPrice
      })

    // Return the product data with success response
    return new Response(
      JSON.stringify({
        success: true,
        product: {
          id: insertedProduct.id,
          name: productData.name,
          url: url,
          store: store || productData.store || 'Unknown',
          currentPrice: productData.currentPrice,
          previousPrice: productData.previousPrice || null,
          priceChange: priceChange,
          imageUrl: productData.imageUrl,
          isOnSale: productData.currentPrice < (productData.previousPrice || Infinity),
          lastUpdated: new Date().toISOString(),
          priceTarget: null,
          priceHistory: [
            {
              date: new Date().toISOString(),
              price: productData.currentPrice
            }
          ]
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in scrape-product function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to scrape product',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// Identify the store from the URL
function getStoreFromUrl(url: string): string | null {
  const lowerUrl = url.toLowerCase()
  
  if (lowerUrl.includes('mercadolivre') || lowerUrl.includes('mercadolibre')) {
    return 'Mercado Livre'
  } else if (lowerUrl.includes('amazon')) {
    return 'Amazon'
  } else if (lowerUrl.includes('magalu') || lowerUrl.includes('magazineluiza')) {
    return 'Magazine Luiza'
  } else if (lowerUrl.includes('shopee')) {
    return 'Shopee'
  } else if (lowerUrl.includes('aliexpress')) {
    return 'AliExpress'
  } else if (lowerUrl.includes('ebay')) {
    return 'eBay'
  } else if (lowerUrl.includes('americanas')) {
    return 'Americanas'
  } else if (lowerUrl.includes('submarino')) {
    return 'Submarino'
  } else if (lowerUrl.includes('casasbahia')) {
    return 'Casas Bahia'
  } else if (lowerUrl.includes('pontofrio')) {
    return 'Pontofrio'
  } else if (lowerUrl.includes('extra')) {
    return 'Extra'
  }
  
  return null
}

// Scrape product data using Firecrawl API
async function scrapeProductData(url: string, apiKey: string) {
  console.log('Starting product scraping with Firecrawl API')
  const firecrawlUrl = 'https://api.firecrawl.co/product-data'
  
  try {
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
      console.error('Firecrawl API error:', errorText, 'Status:', response.status)
      throw new Error(`Firecrawl API Error: ${response.status} ${errorText}`)
    }
    
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('Unexpected response format:', text)
      throw new Error('Firecrawl API returned non-JSON response')
    }
    
    const data = await response.json()
    console.log('Firecrawl API response:', JSON.stringify(data, null, 2))
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to extract product data')
    }
    
    // Map Firecrawl response to our product structure
    const productData = {
      name: data.data?.title || 'Unknown Product',
      currentPrice: parseFloat(data.data?.price?.current || '0'),
      previousPrice: data.data?.price?.previous ? parseFloat(data.data?.price?.previous) : null,
      imageUrl: data.data?.images?.[0] || 'https://via.placeholder.com/300',
      store: data.data?.seller || null
    }
    
    console.log('Extracted product data:', productData)
    return productData
  } catch (error) {
    console.error('Error in scrapeProductData:', error.message)
    throw error
  }
}
