
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
import { PlusCircle, Link, Search, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
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
      toast.error("Erro de autenticação", {
        description: "Você precisa estar logado para adicionar produtos."
      });
      return;
    }

    setIsValidating(true);
    setValidationError('');

    try {
      // Obter token de autenticação para a chamada da função
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }
      
      console.log('Enviando requisição para scrape-product com URL:', url);
      
      // Chamar a edge function para extrair os dados do produto
      const { data, error } = await supabase.functions.invoke('scrape-product', {
        body: { url },
      });
      
      if (error) {
        console.error('Erro ao chamar a função de scraping:', error);
        throw new Error(`Falha na extração dos dados: ${error.message}`);
      }
      
      console.log('Resposta da função de scraping:', data);
      
      if (!data || !data.success) {
        throw new Error((data && data.error) || 'Não foi possível extrair os dados do produto.');
      }
      
      // Adicionar o produto à lista
      onAddProduct(data.product);
      
      toast.success("Produto adicionado com sucesso", {
        description: "Monitoramento iniciado para " + data.product.name
      });
      
      handleClose();
    } catch (error) {
      console.error('Erro ao processar produto:', error);
      setValidationError(error instanceof Error ? error.message : 'Não foi possível processar o produto. Verifique se o URL está correto.');
      
      // Exibir toast com erro para melhor visibilidade
      toast.error("Erro ao adicionar produto", {
        description: error instanceof Error ? error.message : 'Falha ao processar o produto.'
      });
    } finally {
      setIsValidating(false);
    }
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
      toast.error("Erro de autenticação", {
        description: "Você precisa estar logado para adicionar produtos."
      });
      return;
    }

    setIsValidating(true);
    setValidationError('');

    // Simulação de busca de produto
    try {
      toast.info("Funcionalidade em implementação", {
        description: "A busca direta ainda não está implementada. Por favor, use a opção de URL por enquanto."
      });
      
      setIsValidating(false);
    } catch (error) {
      setValidationError('Não foi possível encontrar produtos com este termo. Tente uma busca diferente.');
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
                  {isValidating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extraindo dados...
                    </>
                  ) : 'Adicionar'}
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
                  {isValidating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Buscando...
                    </>
                  ) : 'Buscar e Adicionar'}
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
