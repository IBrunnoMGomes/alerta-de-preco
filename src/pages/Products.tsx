import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import ProductCard from '@/components/product/ProductCard';
import AddProductForm from '@/components/product/AddProductForm';
import { Product } from '@/types/product';
import { calculatePriceChange } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PriceHistoryChart from '@/components/product/PriceHistoryChart';
import { Search, Filter } from 'lucide-react';

const fetchProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, 
      name, 
      url, 
      store, 
      current_price, 
      previous_price, 
      image_url, 
      is_on_sale, 
      price_target, 
      last_checked,
      price_history(id, price, checked_at)
    `);
  
  if (error) throw error;
  
  return data.map((item: any) => {
    const product: Product = {
      id: item.id,
      name: item.name,
      url: item.url,
      store: item.store,
      currentPrice: item.current_price,
      previousPrice: item.previous_price,
      imageUrl: item.image_url || 'https://via.placeholder.com/300',
      isOnSale: item.is_on_sale || false,
      lastUpdated: item.last_checked,
      priceTarget: item.price_target,
      priceChange: calculatePriceChange(item.current_price, item.previous_price),
      priceHistory: item.price_history.map((history: any) => ({
        date: history.checked_at,
        price: history.price
      }))
    };
    
    return product;
  });
};

const Products = () => {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState('Todos');
  const [sortBy, setSortBy] = useState('date');
  const [showOnSaleOnly, setShowOnSaleOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const { toast } = useToast();

  const { data: products = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });

  const stores = ['Todos', ...Array.from(new Set(products.map(p => p.store)))];
  
  const sortOptions = [
    { value: 'name-asc', label: 'Nome (A-Z)' },
    { value: 'name-desc', label: 'Nome (Z-A)' },
    { value: 'price-asc', label: 'Preço (menor-maior)' },
    { value: 'price-desc', label: 'Preço (maior-menor)' },
    { value: 'discount', label: 'Maior desconto' },
    { value: 'date', label: 'Recém adicionados' },
  ];

  useEffect(() => {
    let result = [...products];
    
    if (searchTerm) {
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.store.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedStore !== 'Todos') {
      result = result.filter(product => product.store === selectedStore);
    }
    
    if (showOnSaleOnly) {
      result = result.filter(product => product.isOnSale);
    }
    
    switch (sortBy) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        result.sort((a, b) => a.currentPrice - b.currentPrice);
        break;
      case 'price-desc':
        result.sort((a, b) => b.currentPrice - a.currentPrice);
        break;
      case 'discount':
        result.sort((a, b) => a.priceChange - b.priceChange);
        break;
      case 'date':
        result.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        break;
      default:
        break;
    }
    
    setFilteredProducts(result);
  }, [products, searchTerm, selectedStore, sortBy, showOnSaleOnly]);

  const handleAddProduct = async (newProduct: Omit<Product, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para adicionar produtos.",
          variant: "destructive",
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: newProduct.name,
          url: newProduct.url,
          store: newProduct.store,
          current_price: newProduct.currentPrice,
          previous_price: newProduct.previousPrice,
          image_url: newProduct.imageUrl,
          is_on_sale: newProduct.isOnSale,
          price_target: newProduct.priceTarget,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      await supabase
        .from('price_history')
        .insert({
          product_id: data.id,
          price: newProduct.currentPrice
        });
      
      refetch();
      
      toast({
        title: "Produto adicionado",
        description: "O produto foi adicionado à sua lista de monitoramento.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar produto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      refetch();
      
      toast({
        title: "Produto removido",
        description: "O produto foi removido da sua lista de monitoramento.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover produto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setSelectedProduct(product);
      setShowHistoryDialog(true);
    }
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const dbUpdates: any = {};
      
      if (updates.currentPrice !== undefined) dbUpdates.current_price = updates.currentPrice;
      if (updates.previousPrice !== undefined) dbUpdates.previous_price = updates.previousPrice;
      if (updates.priceTarget !== undefined) dbUpdates.price_target = updates.priceTarget;
      if (updates.isOnSale !== undefined) dbUpdates.is_on_sale = updates.isOnSale;
      
      const { error } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) throw error;
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStore('Todos');
    setSortBy('date');
    setShowOnSaleOnly(false);
  };

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Produtos Monitorados</h1>
          <p className="text-gray-500">
            Gerencie sua lista de produtos para monitoramento
          </p>
        </div>
        <AddProductForm onAddProduct={handleAddProduct} />
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="col-span-1 md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma loja" />
              </SelectTrigger>
              <SelectContent>
                {stores.map(store => (
                  <SelectItem key={store} value={store}>
                    {store}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="sale-only"
              checked={showOnSaleOnly}
              onChange={() => setShowOnSaleOnly(!showOnSaleOnly)}
              className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
            />
            <label htmlFor="sale-only" className="ml-2 text-sm text-gray-700">
              Mostrar apenas produtos em promoção
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetFilters}
              className="text-xs"
            >
              Limpar Filtros
            </Button>
            <span className="text-sm text-gray-500">
              {filteredProducts.length} produtos encontrados
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div 
              key={index} 
              className="h-96 rounded-lg bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          {filteredProducts.length === 0 ? (
            <div className="text-center p-12 bg-gray-50 rounded-lg border border-gray-200">
              <Filter className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-500 mb-4">
                Tente ajustar seus filtros ou adicione novos produtos
              </p>
              <Button 
                variant="outline" 
                onClick={resetFilters}
              >
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDelete={handleDeleteProduct}
                  onViewDetails={handleViewDetails}
                  onUpdateProduct={handleUpdateProduct}
                />
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Histórico de Preços</DialogTitle>
            <DialogDescription>
              Visualize as mudanças de preço ao longo do tempo
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="mt-4">
              <PriceHistoryChart
                priceHistory={selectedProduct.priceHistory}
                productName={selectedProduct.name}
              />
              
              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={() => setShowHistoryDialog(false)} 
                  variant="outline"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Products;
