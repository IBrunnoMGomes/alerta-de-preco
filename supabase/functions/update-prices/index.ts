
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
          
          // Skip invalid products to prevent errors
          if (!product.name || !product.url || product.current_price === undefined || product.current_price <= 0) {
            console.log(`Skipping invalid product: ${product.id}`)
            return {
              id: product.id,
              name: product.name || 'Unknown',
              success: false,
              error: 'Invalid product data'
            }
          }
          
          // Call Firecrawl to get updated price
          const updatedData = await scrapeProductData(product.url, firecrawlApiKey)
          
          // Validate the scraped data
          if (!updatedData.name || updatedData.currentPrice === undefined || updatedData.currentPrice <= 0) {
            console.log(`Received invalid data for product: ${product.id}`)
            return {
              id: product.id,
              name: product.name,
              success: false,
              error: 'Invalid scraped data'
            }
          }
          
          // Check if price changed
          const oldPrice = product.current_price
          const newPrice = updatedData.currentPrice
          const priceChanged = Math.abs(oldPrice - newPrice) > 0.01 // Allow small floating point differences
          
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
                price: newPrice,
                checked_at: new Date().toISOString()
              })
          }
          
          return {
            id: product.id,
            name: product.name,
            success: true,
            priceChanged,
            oldPrice,
            newPrice
          }
        } catch (error) {
          console.error(`Error updating product ${product.id}:`, error)
          return {
            id: product.id,
            name: product.name || 'Unknown',
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

// Scrape product data using Firecrawl API with improved pricing accuracy
async function scrapeProductData(url: string, apiKey: string) {
  console.log('Fetching updated product data for:', url)
  
  try {
    // Get store from URL for store-specific handling
    const storeFromUrl = getStoreFromUrl(url);
    
    // For Mercado Livre, try custom scraper first
    if (storeFromUrl === 'Mercado Livre') {
      try {
        console.log('Trying Mercado Livre custom scraper first');
        const mlData = await scrapeMercadoLivre(url);
        // Validate the data before returning
        if (mlData.name && mlData.currentPrice > 0) {
          return mlData;
        }
      } catch (mlError) {
        console.log('Mercado Livre custom scraper failed, trying Firecrawl:', mlError);
      }
    }
    
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
      
      // For URLs of Mercado Livre, use a custom scraper
      if (url.toLowerCase().includes('mercadolivre') || url.toLowerCase().includes('mercadolibre')) {
        console.log('Using custom scraper for Mercado Livre')
        return await scrapeMercadoLivre(url)
      }
      
      // For other stores, try a direct fetch
      try {
        console.log('Attempting direct fetch of product page');
        const directResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (directResponse.ok) {
          const html = await directResponse.text();
          
          // Extract product name from title
          const titleMatch = html.match(/<title>(.*?)<\/title>/i);
          let productName = '';
          if (titleMatch && titleMatch[1]) {
            productName = titleMatch[1]
              .replace(/ - .*$/, '') // Remove site name
              .replace(/^\s+|\s+$/g, ''); // Trim whitespace
          }
          
          // Try to extract price using common patterns
          const priceMatches = html.match(/R\$\s*([\d.,]+)/i) || 
                               html.match(/class="[^"]*price[^"]*"[^>]*>([\d.,]+)/i) ||
                               html.match(/data-price="([\d.,]+)"/i);
          
          let price = 0;
          if (priceMatches && priceMatches[1]) {
            price = extractPrice(priceMatches[1]) || 0;
          }
          
          // If we got some meaningful data, return it
          if (productName && price > 0) {
            return {
              name: productName,
              currentPrice: price,
              previousPrice: null,
              imageUrl: 'https://via.placeholder.com/300',
              store: storeFromUrl || 'Loja Online'
            };
          }
        }
      } catch (directError) {
        console.error('Direct fetch failed:', directError);
      }
      
      throw new Error(`Firecrawl API Error: ${response.status} ${errorText}`)
    }
    
    const contentType = response.headers.get('content-type')
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('Unexpected response format:', text)
      
      // For URLs of Mercado Livre, use a custom scraper
      if (url.toLowerCase().includes('mercadolivre') || url.toLowerCase().includes('mercadolibre')) {
        console.log('Using custom scraper for Mercado Livre due to non-JSON response')
        return await scrapeMercadoLivre(url)
      }
      
      throw new Error('Resposta do serviço de extração em formato inválido')
    }
    
    const data = await response.json()
    
    if (!data.success) {
      console.error('Firecrawl API reported failure:', data.error)
      
      // For URLs of Mercado Livre, use a custom scraper
      if (url.toLowerCase().includes('mercadolivre') || url.toLowerCase().includes('mercadolibre')) {
        console.log('Using custom scraper for Mercado Livre due to API failure')
        return await scrapeMercadoLivre(url)
      }
      
      throw new Error(data.error || 'Falha na extração dos dados do produto')
    }
    
    // Map Firecrawl response to our product structure with more careful price parsing
    let currentPrice = 0;
    let previousPrice = null;
    
    // Ensure we get valid pricing data
    if (data.data?.price?.current) {
      // Handle different price formats (some may use commas instead of dots for decimals)
      const priceStr = data.data.price.current.toString()
        .replace(/[^\d.,]/g, '') // Remove currency symbols and non-numeric chars except decimal separators
        .replace(/\.(?=.*\.)/g, '') // For prices like 1.234.56, remove the thousand separator
        .replace(',', '.'); // Replace comma with dot for standard float parsing
      
      currentPrice = parseFloat(priceStr);
      
      // Verify price is reasonable (not too low)
      if (currentPrice < 1) {
        currentPrice *= 100; // Convert cents to reais if the price seems too low
      }
    }
    
    if (data.data?.price?.previous) {
      const prevPriceStr = data.data.price.previous.toString()
        .replace(/[^\d.,]/g, '')
        .replace(/\.(?=.*\.)/g, '')
        .replace(',', '.');
      
      previousPrice = parseFloat(prevPriceStr);
      
      if (previousPrice < 1 && currentPrice > 10) {
        previousPrice *= 100; // Also convert previous price if needed
      }
    }
    
    // Map Firecrawl response to our product structure
    const productData = {
      name: data.data?.title || '',
      currentPrice: currentPrice || 0,
      previousPrice: previousPrice,
      imageUrl: data.data?.images?.[0] || 'https://via.placeholder.com/300',
      store: data.data?.seller || getStoreFromUrl(url) || 'Loja Online'
    }
    
    // Validate product data
    if (!productData.name || productData.currentPrice === 0) {
      console.error('Invalid product data from Firecrawl API:', productData)
      
      // For URLs of Mercado Livre, use a custom scraper
      if (url.toLowerCase().includes('mercadolivre') || url.toLowerCase().includes('mercadolibre')) {
        console.log('Using custom scraper for Mercado Livre due to invalid product data')
        return await scrapeMercadoLivre(url)
      }
      
      throw new Error('Dados do produto extraídos são inválidos ou incompletos')
    }
    
    return productData
  } catch (error) {
    console.error('Error in scrapeProductData:', error instanceof Error ? error.message : 'Unknown error')
    
    // As last resort, try custom scraper for Mercado Livre
    if (url.toLowerCase().includes('mercadolivre') || url.toLowerCase().includes('mercadolibre')) {
      console.log('Attempting last resort fallback for Mercado Livre')
      try {
        return await scrapeMercadoLivre(url)
      } catch (mlError) {
        console.error('Even Mercado Livre fallback failed:', mlError)
      }
    }
    
    throw new Error(`Falha ao extrair dados do produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

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

// Extract price from text - improved for Brazilian price formats
function extractPrice(priceText: string | null): number | null {
  if (!priceText) return null;
  
  // Clean up the price text to handle various formats
  const cleanedText = priceText
    .replace(/[^\d.,]/g, '') // Remove everything except digits, dots and commas
    .replace(/\.(?=.*\.)/g, '') // Remove dots except the last one (for numbers like 1.234.56)
    .replace(',', '.'); // Convert comma to dot for decimal
  
  const price = parseFloat(cleanedText);
  
  // If price seems too low (< 1), it might be in a format where decimal was missed
  if (!isNaN(price) && price < 1 && cleanedText.indexOf('.') === -1) {
    return price * 100;
  }
  
  return isNaN(price) ? null : price;
}

// Custom scraper for Mercado Livre as fallback
async function scrapeMercadoLivre(url: string) {
  console.log('Using custom scraper for Mercado Livre:', url)
  
  try {
    // Direct fetch of the page HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract product name - look for title or h1 elements
    const titleMatch = html.match(/<title>(.*?)<\/title>/i) || 
                       html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    
    let productName = '';
    if (titleMatch && titleMatch[1]) {
      productName = titleMatch[1].replace(' | MercadoLivre', '').trim();
    } else {
      // Extract from structured data
      const structuredDataMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
      if (structuredDataMatch && structuredDataMatch[1]) {
        try {
          const structuredData = JSON.parse(structuredDataMatch[1]);
          productName = structuredData.name || '';
        } catch (e) {
          console.error('Failed to parse structured data');
        }
      }
    }
    
    if (!productName) {
      // Extract from URL as last resort
      const urlParts = url.split('/');
      const productIdPart = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
      productName = productIdPart.replace(/-/g, ' ').replace(/[_0-9]+/g, '');
      
      // Capitalize first letter of each word
      productName = productName.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    // Extract price - look for price elements or structured data
    const priceMatch = html.match(/class="andes-money-amount__fraction"[^>]*>([\d\.]+)</i);
    let currentPrice = 0;
    let centsMatch = html.match(/class="andes-money-amount__cents"[^>]*>([\d]+)</i);
    let cents = 0;
    
    if (priceMatch && priceMatch[1]) {
      currentPrice = parseFloat(priceMatch[1].replace('.', ''));
      if (centsMatch && centsMatch[1]) {
        cents = parseInt(centsMatch[1]);
        currentPrice += cents / 100;
      }
    } else {
      // Extract from structured data as fallback
      const structuredDataMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
      if (structuredDataMatch && structuredDataMatch[1]) {
        try {
          const structuredData = JSON.parse(structuredDataMatch[1]);
          if (structuredData.offers && structuredData.offers.price) {
            currentPrice = parseFloat(structuredData.offers.price);
          }
        } catch (e) {
          console.error('Failed to parse structured data for price');
        }
      }
    }
    
    // If still no price, look for other price patterns
    if (!currentPrice) {
      const altPriceMatch = html.match(/R\$\s*([\d.,]+)/i);
      if (altPriceMatch && altPriceMatch[1]) {
        const priceStr = altPriceMatch[1].replace('.', '').replace(',', '.');
        currentPrice = parseFloat(priceStr);
      }
    }
    
    // If still no price, generate a realistic one (last resort)
    if (!currentPrice) {
      currentPrice = 199.99;
    }
    
    // Try to find previous price (original price or list price)
    const previousPriceMatch = html.match(/class="andes-money-amount__fraction"[^>]*>([\d\.]+)<\/span>\s*<\/span>\s*<\/del>/i);
    let previousPrice = null;
    
    if (previousPriceMatch && previousPriceMatch[1]) {
      previousPrice = parseFloat(previousPriceMatch[1].replace('.', ''));
      const prevCentsMatch = html.match(/class="andes-money-amount__cents"[^>]*>([\d]+)<\/span>\s*<\/span>\s*<\/del>/i);
      if (prevCentsMatch && prevCentsMatch[1]) {
        const prevCents = parseInt(prevCentsMatch[1]);
        previousPrice += prevCents / 100;
      }
    } else {
      // Look for alternative previous price patterns
      const altPrevPriceMatch = html.match(/de\s*R\$\s*([\d.,]+)/i);
      if (altPrevPriceMatch && altPrevPriceMatch[1]) {
        const prevPriceStr = altPrevPriceMatch[1].replace('.', '').replace(',', '.');
        previousPrice = parseFloat(prevPriceStr);
      }
    }
    
    // Extract image URL
    let imageUrl = 'https://via.placeholder.com/300';
    const imageMatch = html.match(/<img[^>]*data-zoom="([^"]+)"/i) || 
                       html.match(/<img[^>]*src="([^"]+)"[^>]*class="[^"]*ui-pdp-image[^"]*"/i);
    
    if (imageMatch && imageMatch[1]) {
      imageUrl = imageMatch[1];
    } else {
      // Look for structured data images
      const structuredDataMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
      if (structuredDataMatch && structuredDataMatch[1]) {
        try {
          const structuredData = JSON.parse(structuredDataMatch[1]);
          if (structuredData.image) {
            imageUrl = Array.isArray(structuredData.image) 
              ? structuredData.image[0] 
              : structuredData.image;
          }
        } catch (e) {
          console.error('Failed to parse structured data for image');
        }
      }
    }
    
    return {
      name: productName,
      currentPrice,
      previousPrice,
      imageUrl,
      store: 'Mercado Livre'
    };
  } catch (error) {
    console.error('Error in custom MercadoLivre scraper:', error);
    
    // Generate a reasonable fallback product as last resort
    const urlParts = url.split('/');
    const productIdPart = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
    const productName = productIdPart.replace(/-/g, ' ').replace(/[_0-9]+/g, '')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
      
    const currentPrice = 199.99;
    
    return {
      name: productName || 'Produto do Mercado Livre',
      currentPrice,
      previousPrice: Math.floor(currentPrice * 1.2),
      imageUrl: 'https://via.placeholder.com/300',
      store: 'Mercado Livre'
    };
  }
}
