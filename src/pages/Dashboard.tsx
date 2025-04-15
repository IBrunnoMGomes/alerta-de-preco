
import { useState, useEffect } from 'react';
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
  TrendingDown 
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
import { generateId } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

// Dados de exemplo para simular o backend
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Samsung Galaxy S23 Ultra 256GB',
    url: 'https://exemplo.com/produto-1',
    store: 'Mercado Livre',
    currentPrice: 5999.99,
    previousPrice: 6499.99,
    priceChange: -7.7,
    imageUrl: 'https://via.placeholder.com/300',
    isOnSale: true,
    lastUpdated: new Date().toISOString(),
    priceTarget: 5500,
    priceHistory: [
      { date: new Date(Date.now() - 30 * 864000000).toISOString(), price: 6799.99 },
      { date: new Date(Date.now() - 25 * 864000000).toISOString(), price: 6799.99 },
      { date: new Date(Date.now() - 20 * 864000000).toISOString(), price: 6699.99 },
      { date: new Date(Date.now() - 15 * 864000000).toISOString(), price: 6499.99 },
      { date: new Date(Date.now() - 10 * 864000000).toISOString(), price: 6499.99 },
      { date: new Date(Date.now() - 5 * 864000000).toISOString(), price: 6299.99 },
      { date: new Date().toISOString(), price: 5999.99 }
    ]
  },
  {
    id: '2',
    name: 'PlayStation 5 Slim Digital Edition',
    url: 'https://exemplo.com/produto-2',
    store: 'Amazon',
    currentPrice: 3799.90,
    previousPrice: 3999.90,
    priceChange: -5.0,
    imageUrl: 'https://via.placeholder.com/300',
    isOnSale: true,
    lastUpdated: new Date(Date.now() - 2 * 864000000).toISOString(),
    priceTarget: 3500,
    priceHistory: [
      { date: new Date(Date.now() - 30 * 864000000).toISOString(), price: 4299.90 },
      { date: new Date(Date.now() - 20 * 864000000).toISOString(), price: 4199.90 },
      { date: new Date(Date.now() - 10 * 864000000).toISOString(), price: 3999.90 },
      { date: new Date(Date.now() - 2 * 864000000).toISOString(), price: 3799.90 }
    ]
  },
  {
    id: '3',
    name: 'Apple MacBook Air M2 (2023) 8GB RAM 256GB SSD',
    url: 'https://exemplo.com/produto-3',
    store: 'Magazine Luiza',
    currentPrice: 7999.00,
    previousPrice: 7999.00,
    priceChange: 0,
    imageUrl: 'https://via.placeholder.com/300',
    isOnSale: false,
    lastUpdated: new Date(Date.now() - 1 * 864000000).toISOString(),
    priceTarget: 7000,
    priceHistory: [
      { date: new Date(Date.now() - 20 * 864000000).toISOString(), price: 8499.00 },
      { date: new Date(Date.now() - 15 * 864000000).toISOString(), price: 8499.00 },
      { date: new Date(Date.now() - 10 * 864000000).toISOString(), price: 8299.00 },
      { date: new Date(Date.now() - 5 * 864000000).toISOString(), price: 7999.00 },
      { date: new Date(Date.now() - 1 * 864000000).toISOString(), price: 7999.00 }
    ]
  },
  {
    id: '4',
    name: 'Smart TV LG OLED 55" 4K UHD',
    url: 'https://exemplo.com/produto-4',
    store: 'Shopee',
    currentPrice: 4559.10,
    previousPrice: 5199.00,
    priceChange: -12.3,
    imageUrl: 'https://via.placeholder.com/300',
    isOnSale: true,
    lastUpdated: new Date().toISOString(),
    priceTarget: 4500,
    priceHistory: [
      { date: new Date(Date.now() - 30 * 864000000).toISOString(), price: 5899.00 },
      { date: new Date(Date.now() - 20 * 864000000).toISOString(), price: 5599.00 },
      { date: new Date(Date.now() - 10 * 864000000).toISOString(), price: 5199.00 },
      { date: new Date().toISOString(), price: 4559.10 }
    ]
  }
];

const Dashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Simulação de carregamento de dados
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProducts(MOCK_PRODUCTS);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleAddProduct = (newProduct: Omit<Product, 'id'>) => {
    const productWithId = {
      ...newProduct,
      id: generateId()
    };
    
    setProducts([productWithId, ...products]);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(product => product.id !== id));
    toast({
      title: "Produto removido",
      description: "O produto foi removido da sua lista de monitoramento.",
    });
  };

  const handleViewDetails = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setSelectedProduct(product);
      setShowHistoryDialog(true);
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

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard de Monitoramento</h1>
          <p className="text-gray-500">
            Acompanhe os preços dos seus produtos favoritos
          </p>
        </div>
        <AddProductForm onAddProduct={handleAddProduct} />
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
              <p className="text-sm text-gray-500">Próximas a Meta</p>
              <p className="text-2xl font-bold">2</p>
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
