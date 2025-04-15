
import { useState, FormEvent } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Link, Search, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Product } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';

interface AddProductFormProps {
  onAddProduct: (product: Omit<Product, 'id'>) => void;
}

const stores = [
  { id: 'mercadolivre', name: 'Mercado Livre' },
  { id: 'amazon', name: 'Amazon' },
  { id: 'magalu', name: 'Magazine Luiza' },
  { id: 'shopee', name: 'Shopee' },
  { id: 'aliexpress', name: 'AliExpress' },
  { id: 'ebay', name: 'eBay' },
  { id: 'other', name: 'Outra Loja' }
];

const AddProductForm = ({ onAddProduct }: AddProductFormProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('url');
  const [url, setUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState<string | undefined>(undefined);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');

  const resetForm = () => {
    setUrl('');
    setSearchTerm('');
    setSelectedStore(undefined);
    setValidationError('');
    setActiveTab('url');
  };

  const handleClose = () => {
    resetForm();
    setOpen(false);
  };

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleAddByUrl = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      setValidationError('Por favor, insira um URL válido.');
      return;
    }

    if (!validateUrl(url)) {
      setValidationError('URL inválido. Por favor, insira um URL completo começando com http:// ou https://.');
      return;
    }

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser();
      
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para adicionar produtos.",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    setValidationError('');

    // Simulação de busca de produto (em um caso real, seria uma chamada de API)
    try {
      // Simular tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock de dados do produto
      const mockProduct = {
        name: 'Produto de exemplo via URL',
        url: url,
        store: detectStoreFromUrl(url),
        currentPrice: 799.99,
        previousPrice: 899.99,
        priceChange: -11.1, 
        imageUrl: 'https://via.placeholder.com/300',
        isOnSale: true,
        lastUpdated: new Date().toISOString(),
        priceTarget: null,
        priceHistory: [
          { date: new Date(Date.now() - 864000000).toISOString(), price: 899.99 },
          { date: new Date().toISOString(), price: 799.99 }
        ]
      };
      
      onAddProduct(mockProduct);
      toast({
        title: "Produto adicionado com sucesso",
        description: "Monitoramento iniciado para " + mockProduct.name,
      });
      handleClose();
    } catch (error) {
      setValidationError('Não foi possível encontrar informações do produto. Verifique se o URL está correto.');
    } finally {
      setIsValidating(false);
    }
  };

  const detectStoreFromUrl = (url: string): string => {
    const lowerUrl = url.toLowerCase();
    
    for (const store of stores) {
      if (lowerUrl.includes(store.id)) {
        return store.name;
      }
    }
    
    return 'Loja Desconhecida';
  };

  const handleAddBySearch = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm) {
      setValidationError('Por favor, insira um termo de busca.');
      return;
    }

    if (!selectedStore) {
      setValidationError('Por favor, selecione uma loja.');
      return;
    }

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser();
      
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para adicionar produtos.",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    setValidationError('');

    // Simulação de busca de produto
    try {
      // Simular tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock de dados do produto
      const selectedStoreName = stores.find(s => s.id === selectedStore)?.name || 'Loja Desconhecida';
      
      const mockProduct = {
        name: `${searchTerm} (via busca)`,
        url: `https://exemplo.com/produto-${Date.now()}`,
        store: selectedStoreName,
        currentPrice: 599.99,
        previousPrice: 649.99,
        priceChange: -7.7,
        imageUrl: 'https://via.placeholder.com/300',
        isOnSale: false,
        lastUpdated: new Date().toISOString(),
        priceTarget: null,
        priceHistory: [
          { date: new Date(Date.now() - 864000000).toISOString(), price: 649.99 },
          { date: new Date().toISOString(), price: 599.99 }
        ]
      };
      
      onAddProduct(mockProduct);
      toast({
        title: "Produto adicionado com sucesso",
        description: "Monitoramento iniciado para " + mockProduct.name,
      });
      handleClose();
    } catch (error) {
      setValidationError('Não foi possível encontrar produtos com este termo. Tente uma busca diferente.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-brand-primary hover:bg-brand-dark">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Produto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Adicionar Novo Produto</DialogTitle>
          <DialogDescription>
            Adicione um produto para começar a monitorar seu preço
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="flex items-center">
              <Link className="w-4 h-4 mr-2" />
              Por URL
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center">
              <Search className="w-4 h-4 mr-2" />
              Por Busca
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="url" className="mt-4">
            <form onSubmit={handleAddByUrl} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL do Produto</Label>
                <Input
                  id="url"
                  placeholder="https://loja.com/produto"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <div className="text-xs text-muted-foreground">
                  Cole o link completo do produto que deseja monitorar
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Lojas Suportadas:</div>
                <div className="flex flex-wrap gap-2">
                  {stores.filter(s => s.id !== 'other').map(store => (
                    <Badge variant="outline" key={store.id}>
                      {store.name}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {validationError && (
                <div className="flex items-center text-destructive text-sm mt-2">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {validationError}
                </div>
              )}
              
              <DialogFooter className="mt-4">
                <Button variant="outline" type="button" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isValidating} 
                  className="bg-brand-primary hover:bg-brand-dark"
                >
                  {isValidating ? 'Validando...' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="search" className="mt-4">
            <form onSubmit={handleAddBySearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store">Loja</Label>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="searchTerm">Termo de Busca</Label>
                <Input
                  id="searchTerm"
                  placeholder="Ex: iPhone 13, TV Samsung 55"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="text-xs text-muted-foreground">
                  Digite o nome do produto que você deseja encontrar
                </div>
              </div>
              
              {validationError && (
                <div className="flex items-center text-destructive text-sm mt-2">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {validationError}
                </div>
              )}
              
              <DialogFooter className="mt-4">
                <Button variant="outline" type="button" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isValidating} 
                  className="bg-brand-primary hover:bg-brand-dark"
                >
                  {isValidating ? 'Buscando...' : 'Buscar e Adicionar'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductForm;
