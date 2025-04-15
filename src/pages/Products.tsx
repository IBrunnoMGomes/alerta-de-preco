
import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ProductCard from '@/components/product/ProductCard';
import AddProductForm from '@/components/product/AddProductForm';
import { Product } from '@/types/product';
import { generateId } from '@/lib/utils';
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
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PriceHistoryChart from '@/components/product/PriceHistoryChart';
import { Search, Filter } from 'lucide-react';

// Importando os dados de exemplo do Dashboard
// Em uma implementação real, esses dados viriam de uma API ou banco de dados
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
  },
  {
    id: '5',
    name: 'Headphone Sony WH-1000XM5',
    url: 'https://exemplo.com/produto-5',
    store: 'Amazon',
    currentPrice: 2399.00,
    previousPrice: 2699.00,
    priceChange: -11.1,
    imageUrl: 'https://via.placeholder.com/300',
    isOnSale: true,
    lastUpdated: new Date(Date.now() - 3 * 864000000).toISOString(),
    priceTarget: 2200,
    priceHistory: [
      { date: new Date(Date.now() - 25 * 864000000).toISOString(), price: 2799.00 },
      { date: new Date(Date.now() - 15 * 864000000).toISOString(), price: 2699.00 },
      { date: new Date(Date.now() - 3 * 864000000).toISOString(), price: 2399.00 }
    ]
  },
  {
    id: '6',
    name: 'Apple iPad Air 5ª Geração 64GB Wi-Fi',
    url: 'https://exemplo.com/produto-6',
    store: 'Mercado Livre',
    currentPrice: 4999.00,
    previousPrice: 5299.00,
    priceChange: -5.7,
    imageUrl: 'https://via.placeholder.com/300',
    isOnSale: true,
    lastUpdated: new Date(Date.now() - 1 * 864000000).toISOString(),
    priceTarget: 4500,
    priceHistory: [
      { date: new Date(Date.now() - 30 * 864000000).toISOString(), price: 5499.00 },
      { date: new Date(Date.now() - 20 * 864000000).toISOString(), price: 5299.00 },
      { date: new Date(Date.now() - 1 * 864000000).toISOString(), price: 4999.00 }
    ]
  }
];

const stores = ['Todos', 'Mercado Livre', 'Amazon', 'Magazine Luiza', 'Shopee', 'AliExpress', 'eBay'];
const sortOptions = [
  { value: 'name-asc', label: 'Nome (A-Z)' },
  { value: 'name-desc', label: 'Nome (Z-A)' },
  { value: 'price-asc', label: 'Preço (menor-maior)' },
  { value: 'price-desc', label: 'Preço (maior-menor)' },
  { value: 'discount', label: 'Maior desconto' },
  { value: 'date', label: 'Recém adicionados' },
];

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState('Todos');
  const [sortBy, setSortBy] = useState('date');
  const [showOnSaleOnly, setShowOnSaleOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Simulação de carregamento de dados
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProducts(MOCK_PRODUCTS);
      setFilteredProducts(MOCK_PRODUCTS);
      setIsLoading(false);
    };

    loadData();
  }, []);

  useEffect(() => {
    // Filtrar e ordenar produtos
    let result = [...products];
    
    // Filtrar por termo de busca
    if (searchTerm) {
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.store.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrar por loja
    if (selectedStore !== 'Todos') {
      result = result.filter(product => product.store === selectedStore);
    }
    
    // Filtrar por produtos em promoção
    if (showOnSaleOnly) {
      result = result.filter(product => product.isOnSale);
    }
    
    // Ordenar produtos
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

  const handleAddProduct = (newProduct: Omit<Product, 'id'>) => {
    const productWithId = {
      ...newProduct,
      id: generateId()
    };
    
    setProducts([productWithId, ...products]);
    toast({
      title: "Produto adicionado",
      description: "O produto foi adicionado à sua lista de monitoramento.",
    });
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

      {/* Filtros e Busca */}
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

      {/* Lista de produtos */}
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

export default Products;
