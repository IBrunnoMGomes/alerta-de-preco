
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Check, 
  X, 
  TrendingDown, 
  Clock,
  ExternalLink,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Product } from '@/types/product';

interface Notification {
  id: string;
  productId: string;
  productName: string;
  productUrl: string;
  store: string;
  type: 'price_drop' | 'price_goal' | 'available' | 'system';
  message: string;
  currentPrice: number;
  previousPrice: number;
  priceChange: number;
  date: string;
  isRead: boolean;
}

// Função para gerar notificações baseadas em produtos reais
const generateNotificationsFromProducts = (products: Product[]): Notification[] => {
  if (!products || products.length === 0) {
    return [];
  }
  
  const notifications: Notification[] = [];
  
  // Adicionar notificação de sistema se for o primeiro produto
  if (products.length === 1) {
    notifications.push({
      id: 'system-1',
      productId: '0',
      productName: '',
      productUrl: '',
      store: '',
      type: 'system',
      message: 'Bem-vindo ao PriceWatch! Seu primeiro produto foi adicionado com sucesso.',
      currentPrice: 0,
      previousPrice: 0,
      priceChange: 0,
      date: new Date().toISOString(),
      isRead: false
    });
  }
  
  // Converter produtos em notificações
  products.forEach((product, index) => {
    // Apenas produtos com mudança de preço
    if (product.previousPrice && product.currentPrice !== product.previousPrice) {
      // Notificação de queda de preço
      if (product.currentPrice < product.previousPrice) {
        notifications.push({
          id: `price-drop-${product.id}`,
          productId: product.id,
          productName: product.name,
          productUrl: product.url,
          store: product.store,
          type: 'price_drop',
          message: 'O preço caiu para o menor valor desde que você começou a monitorar!',
          currentPrice: product.currentPrice,
          previousPrice: product.previousPrice,
          priceChange: product.priceChange,
          date: product.lastUpdated,
          isRead: false
        });
      }
      
      // Notificação de meta atingida se tiver priceTarget
      if (product.priceTarget && product.currentPrice <= product.priceTarget) {
        notifications.push({
          id: `price-goal-${product.id}`,
          productId: product.id,
          productName: product.name,
          productUrl: product.url,
          store: product.store,
          type: 'price_goal',
          message: `O preço atingiu seu valor alvo de ${formatCurrency(product.priceTarget)}!`,
          currentPrice: product.currentPrice,
          previousPrice: product.previousPrice,
          priceChange: product.priceChange,
          date: product.lastUpdated,
          isRead: false
        });
      }
    }
  });
  
  return notifications;
};

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState({
    enableEmail: true,
    enablePush: false,
    enablePriceDrop: true,
    enablePriceGoal: true,
    enableAvailability: true,
    minPriceDropPercent: 5,
    email: 'usuario@exemplo.com'
  });

  // Buscar produtos reais
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
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
      
      return data
        .filter(item => 
          item && 
          item.name && 
          item.url && 
          item.current_price !== undefined && 
          item.current_price !== null &&
          typeof item.current_price === 'number' &&
          item.current_price > 0
        )
        .map((item: any) => {
          const currentPrice = item.current_price;
          const previousPrice = item.previous_price;
          let priceChange = 0;
          
          if (previousPrice && currentPrice !== previousPrice) {
            priceChange = parseFloat((((currentPrice - previousPrice) / previousPrice) * 100).toFixed(2));
          }
          
          return {
            id: item.id,
            name: item.name,
            url: item.url,
            store: item.store,
            currentPrice: item.current_price,
            previousPrice: item.previous_price,
            priceChange: priceChange,
            imageUrl: item.image_url || 'https://via.placeholder.com/300',
            isOnSale: item.is_on_sale || false,
            lastUpdated: item.last_checked,
            priceTarget: item.price_target,
            priceHistory: (item.price_history || []).map((history: any) => ({
              date: history.checked_at,
              price: history.price
            }))
          };
        });
    }
  });

  useEffect(() => {
    // Gerar notificações baseadas em produtos reais
    if (!isLoadingProducts) {
      const generatedNotifications = generateNotificationsFromProducts(products);
      setNotifications(generatedNotifications);
      setIsLoading(false);
    }
  }, [products, isLoadingProducts]);

  const getUnreadCount = () => {
    return notifications.filter(n => !n.isRead).length;
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'price_drop':
        return <TrendingDown className="h-5 w-5 text-green-500" />;
      case 'price_goal':
        return <Check className="h-5 w-5 text-blue-500" />;
      case 'available':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'system':
        return <Bell className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'price_drop':
        return 'bg-green-50 border-green-200';
      case 'price_goal':
        return 'bg-blue-50 border-blue-200';
      case 'available':
        return 'bg-yellow-50 border-yellow-200';
      case 'system':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `Hoje às ${hours}:${minutes}`;
    } else if (diffDays === 1) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const handleSettingChange = (setting: string, value: boolean | number | string) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: value
    });
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Notificações e Alertas</h1>
        <p className="text-gray-500">
          Gerencie suas notificações e configure alertas de preço
        </p>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="notifications" className="relative">
            Notificações
            {getUnreadCount() > 0 && (
              <Badge className="ml-2 bg-brand-primary absolute -top-1 -right-1">
                {getUnreadCount()}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications">
          {isLoading || isLoadingProducts ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-32 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div>
                  {getUnreadCount() > 0 && (
                    <span className="text-sm text-gray-600">
                      {getUnreadCount()} {getUnreadCount() === 1 ? 'notificação não lida' : 'notificações não lidas'}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {getUnreadCount() > 0 && (
                    <Button variant="outline" size="sm" onClick={markAllAsRead}>
                      Marcar todas como lidas
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button variant="outline" size="sm" onClick={clearAllNotifications}>
                      Limpar todas
                    </Button>
                  )}
                </div>
              </div>

              {notifications.length === 0 && products.length === 0 ? (
                <Card className="text-center p-6">
                  <CardContent className="pt-6 flex flex-col items-center">
                    <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Bell className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Nenhuma notificação</h3>
                    <p className="text-gray-500">
                      Adicione produtos para monitorar e receber notificações de mudanças de preço.
                    </p>
                  </CardContent>
                </Card>
              ) : notifications.length === 0 && products.length > 0 ? (
                <Card className="text-center p-6">
                  <CardContent className="pt-6 flex flex-col items-center">
                    <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Bell className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Nenhuma notificação ainda</h3>
                    <p className="text-gray-500">
                      Você já está monitorando produtos! Quando houver mudanças de preço, você receberá notificações aqui.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {notifications.map(notification => (
                    <Card 
                      key={notification.id} 
                      className={`${getNotificationColor(notification.type)} border ${notification.isRead ? 'opacity-80' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex">
                          <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mr-4 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            {notification.type !== 'system' && (
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-gray-900">
                                    {notification.productName}
                                  </h3>
                                  <div className="text-sm text-gray-600 mb-1">
                                    {notification.store}
                                  </div>
                                </div>
                                <Badge variant="outline" className="ml-2">
                                  {notification.type === 'price_drop' ? 'Queda de Preço' : 
                                   notification.type === 'price_goal' ? 'Meta Atingida' : 
                                   notification.type === 'available' ? 'Disponível' : 'Sistema'}
                                </Badge>
                              </div>
                            )}
                            
                            <p className="text-gray-700 mb-2">
                              {notification.message}
                            </p>
                            
                            {notification.type !== 'system' && notification.currentPrice > 0 && (
                              <div className="flex justify-between items-center">
                                <div className="space-x-2">
                                  <span className="text-lg font-bold text-brand-primary">
                                    {formatCurrency(notification.currentPrice)}
                                  </span>
                                  {notification.previousPrice > 0 && (
                                    <span className="text-sm text-gray-500 line-through">
                                      {formatCurrency(notification.previousPrice)}
                                    </span>
                                  )}
                                </div>
                                
                                {notification.priceChange !== 0 && (
                                  <div className="text-sm font-medium text-price-decrease">
                                    -{Math.abs(notification.priceChange)}%
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <div className="flex justify-between items-center mt-3">
                              <div className="text-xs text-gray-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDate(notification.date)}
                              </div>
                              
                              <div className="flex space-x-2">
                                {notification.type !== 'system' && notification.productUrl && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 text-xs"
                                    onClick={() => window.open(notification.productUrl, '_blank')}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Ver Produto
                                  </Button>
                                )}
                                
                                {!notification.isRead && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 text-xs"
                                    onClick={() => markAsRead(notification.id)}
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Marcar como lida
                                  </Button>
                                )}
                                
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 text-xs"
                                  onClick={() => deleteNotification(notification.id)}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Remover
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Canais de Notificação</CardTitle>
                <CardDescription>
                  Escolha como deseja receber suas notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <Label htmlFor="email-notifications">Notificações por Email</Label>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={notificationSettings.enableEmail}
                    onCheckedChange={(value) => handleSettingChange('enableEmail', value)}
                  />
                </div>
                
                {notificationSettings.enableEmail && (
                  <div className="ml-7 space-y-2">
                    <Label htmlFor="email">Seu Email</Label>
                    <Input
                      id="email"
                      value={notificationSettings.email}
                      onChange={(e) => handleSettingChange('email', e.target.value)}
                      placeholder="seu-email@exemplo.com"
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-5 w-5 text-gray-500" />
                    <Label htmlFor="push-notifications">Notificações Push</Label>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={notificationSettings.enablePush}
                    onCheckedChange={(value) => handleSettingChange('enablePush', value)}
                  />
                </div>
                
                {notificationSettings.enablePush && (
                  <div className="ml-7 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
                    Para receber notificações push, permita notificações quando solicitado pelo navegador.
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tipos de Alerta</CardTitle>
                <CardDescription>
                  Configure quais tipos de alerta deseja receber
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-5 w-5 text-green-500" />
                    <Label htmlFor="price-drop">Queda de Preço</Label>
                  </div>
                  <Switch
                    id="price-drop"
                    checked={notificationSettings.enablePriceDrop}
                    onCheckedChange={(value) => handleSettingChange('enablePriceDrop', value)}
                  />
                </div>
                
                {notificationSettings.enablePriceDrop && (
                  <div className="ml-7 space-y-2">
                    <Label htmlFor="min-drop">Porcentagem mínima de queda para notificar</Label>
                    <div className="flex items-center">
                      <Input
                        id="min-drop"
                        type="number"
                        min="1"
                        max="50"
                        value={notificationSettings.minPriceDropPercent}
                        onChange={(e) => handleSettingChange('minPriceDropPercent', parseInt(e.target.value))}
                        className="w-20 mr-2"
                      />
                      <span>%</span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5 text-blue-500" />
                    <Label htmlFor="price-goal">Meta de Preço Atingida</Label>
                  </div>
                  <Switch
                    id="price-goal"
                    checked={notificationSettings.enablePriceGoal}
                    onCheckedChange={(value) => handleSettingChange('enablePriceGoal', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <Label htmlFor="availability">Disponibilidade de Produto</Label>
                  </div>
                  <Switch
                    id="availability"
                    checked={notificationSettings.enableAvailability}
                    onCheckedChange={(value) => handleSettingChange('enableAvailability', value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button className="bg-brand-primary hover:bg-brand-dark">
                  Salvar Configurações
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Notifications;
