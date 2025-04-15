
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import AddProductForm from '@/components/product/AddProductForm';
import ProductCard from '@/components/product/ProductCard';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  AlertTriangle, 
  Flame, 
  LineChart, 
  ShoppingBag, 
  TrendingDown,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import PriceHistoryChart from '@/components/product/PriceHistoryChart';
import { Product } from '@/types/product';
import { useToast } from '@/components/ui/use-toast';
import { calculatePriceChange } from '@/lib/utils';

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
    // Converter para o formato esperado pelo componente Product
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

const Dashboard = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const { toast } = useToast();

  const { data: products = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta com sucesso.",
    });
  };

  const handleAddProduct = async (newProduct: Omit<Product, 'id'>) => {
    try {
      // Inserir o produto no banco de dados
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
          price_target: newProduct.priceTarget
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Adicionar o histórico de preço inicial
      await supabase
        .from('price_history')
        .insert({
          product_id: data.id,
          price: newProduct.currentPrice
        });
      
      // Recarregar a lista de produtos
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
      
      // Recarregar a lista de produtos
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
      // Converter do formato do componente para o formato do banco
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
      
      // Recarregar a lista de produtos
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getDealsCount = () => {
    return products.filter(p => p.isOnSale).length;
  };

  const getBiggestDiscount = () => {
    if (products.length === 0) return 0;
    
    const product = products.reduce((prev, current) => {
      return (prev.priceChange < current.priceChange) ? prev : current;
    });
    
    return Math.abs(product.priceChange);
  };

  const getTargetCount = () => {
    return products.filter(p => p.priceTarget !== null && p.currentPrice <= (p.priceTarget || 0)).length;
  };

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard de Monitoramento</h1>
          <p className="text-gray-500">
            Acompanhe os preços dos seus produtos favoritos
          </p>
        </div>
        <div className="flex gap-2">
          <AddProductForm onAddProduct={handleAddProduct} />
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total de Produtos</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-brand-light flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-brand-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Ofertas Ativas</p>
              <p className="text-2xl font-bold">{getDealsCount()}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <Flame className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Maior Desconto</p>
              <p className="text-2xl font-bold">{getBiggestDiscount()}%</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Metas Alcançadas</p>
              <p className="text-2xl font-bold">{getTargetCount()}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de produtos */}
      <h2 className="text-xl font-semibold mb-4">Produtos Monitorados</h2>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div 
              key={index} 
              className="h-96 rounded-lg bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          {products.length === 0 ? (
            <Card className="text-center p-6">
              <CardContent className="pt-6 flex flex-col items-center">
                <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <ShoppingBag className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">Nenhum produto monitorado</h3>
                <p className="text-gray-500 mb-4">
                  Adicione produtos para começar a monitorar os preços
                </p>
                <AddProductForm onAddProduct={handleAddProduct} />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map(product => (
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

      {/* Diálogo para exibir histórico de preços */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Histórico de Preços</DialogTitle>
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

export default Dashboard;
