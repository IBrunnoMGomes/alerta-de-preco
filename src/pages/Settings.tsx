
import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Lock, 
  Clock, 
  Trash2, 
  Share2, 
  Database,
  FileJson,
  Save,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Settings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [userSettings, setUserSettings] = useState({
    name: 'Usuário Exemplo',
    email: 'usuario@exemplo.com',
    language: 'pt-BR',
    currency: 'BRL',
    darkMode: false
  });
  
  const [monitoringSettings, setMonitoringSettings] = useState({
    monitorInterval: '12h',
    autoRemoveOldProducts: false,
    oldProductDays: 30,
    defaultAlertThreshold: 10,
    extendedHistory: false
  });
  
  const [apiSettings, setApiSettings] = useState({
    enableApiAccess: false,
    apiKey: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    allowExternalScrapers: false,
    exportFormat: 'json'
  });

  const handleUserSettingChange = (setting: string, value: string | boolean) => {
    setUserSettings({
      ...userSettings,
      [setting]: value
    });
  };

  const handleMonitoringSettingChange = (setting: string, value: string | number | boolean) => {
    setMonitoringSettings({
      ...monitoringSettings,
      [setting]: value
    });
  };

  const handleApiSettingChange = (setting: string, value: string | boolean) => {
    setApiSettings({
      ...apiSettings,
      [setting]: value
    });
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Configurações salvas",
      description: "Suas configurações foram atualizadas com sucesso.",
    });
    
    setIsLoading(false);
  };

  const handleExportData = () => {
    // Em uma aplicação real, isso geraria um arquivo JSON para download
    toast({
      title: "Dados exportados",
      description: "Seus dados foram exportados com sucesso.",
    });
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.")) {
      setIsLoading(true);
      // Simular tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Conta excluída",
        description: "Sua conta foi excluída com sucesso.",
        variant: "destructive"
      });
      
      setIsLoading(false);
    }
  };

  const regenerateApiKey = () => {
    const newApiKey = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, () => {
      return Math.floor(Math.random() * 16).toString(16);
    });
    
    handleApiSettingChange('apiKey', newApiKey);
    toast({
      title: "Chave API regenerada",
      description: "Uma nova chave API foi gerada. Lembre-se de atualizar suas integrações.",
    });
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Configurações</h1>
        <p className="text-gray-500">
          Personalize sua experiência e configure opções do sistema
        </p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="account">Conta e Perfil</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          <TabsTrigger value="api">API e Exportação</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Atualize seus dados pessoais e preferências de conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={userSettings.name}
                    onChange={(e) => handleUserSettingChange('name', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userSettings.email}
                    onChange={(e) => handleUserSettingChange('email', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select 
                    value={userSettings.language} 
                    onValueChange={(value) => handleUserSettingChange('language', value)}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Selecione um idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Moeda</Label>
                  <Select 
                    value={userSettings.currency} 
                    onValueChange={(value) => handleUserSettingChange('currency', value)}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Selecione uma moeda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="space-x-2">
                    <Label htmlFor="dark-mode">Modo Escuro</Label>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={userSettings.darkMode}
                    onCheckedChange={(value) => handleUserSettingChange('darkMode', value)}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Segurança da Conta</CardTitle>
                <CardDescription>
                  Gerencie sua senha e opções de segurança
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Senha Atual</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value="********"
                    readOnly
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                  />
                </div>
                
                <div className="pt-2">
                  <Button variant="outline" className="w-full">
                    <Lock className="mr-2 h-4 w-4" />
                    Alterar Senha
                  </Button>
                </div>
                
                <div className="pt-4">
                  <Button 
                    variant="destructive" 
                    className="w-full" 
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Excluir Conta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Monitoramento</CardTitle>
              <CardDescription>
                Personalize como os produtos são monitorados e atualizados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="monitor-interval">Intervalo de Monitoramento</Label>
                  <Select 
                    value={monitoringSettings.monitorInterval} 
                    onValueChange={(value) => handleMonitoringSettingChange('monitorInterval', value)}
                  >
                    <SelectTrigger id="monitor-interval">
                      <SelectValue placeholder="Selecione um intervalo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">A cada hora</SelectItem>
                      <SelectItem value="6h">A cada 6 horas</SelectItem>
                      <SelectItem value="12h">A cada 12 horas</SelectItem>
                      <SelectItem value="24h">Uma vez por dia</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Frequência com que os preços são verificados
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default-threshold">Limiar Padrão de Alerta (%)</Label>
                  <Input
                    id="default-threshold"
                    type="number"
                    min="1"
                    max="50"
                    value={monitoringSettings.defaultAlertThreshold}
                    onChange={(e) => handleMonitoringSettingChange('defaultAlertThreshold', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Percentual mínimo de queda para alertar
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-1">
                  <Label htmlFor="auto-remove">Remover Produtos Antigos</Label>
                  <p className="text-xs text-gray-500">
                    Remove automaticamente produtos que não tiveram alteração de preço
                  </p>
                </div>
                <Switch
                  id="auto-remove"
                  checked={monitoringSettings.autoRemoveOldProducts}
                  onCheckedChange={(value) => handleMonitoringSettingChange('autoRemoveOldProducts', value)}
                />
              </div>
              
              {monitoringSettings.autoRemoveOldProducts && (
                <div className="ml-0 md:ml-6 space-y-2">
                  <Label htmlFor="old-days">Dias para considerar um produto como antigo</Label>
                  <Input
                    id="old-days"
                    type="number"
                    min="7"
                    max="365"
                    value={monitoringSettings.oldProductDays}
                    onChange={(e) => handleMonitoringSettingChange('oldProductDays', parseInt(e.target.value))}
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-1">
                  <Label htmlFor="extended-history">Histórico Estendido</Label>
                  <p className="text-xs text-gray-500">
                    Armazena histórico de preços por mais tempo (até 1 ano)
                  </p>
                </div>
                <Switch
                  id="extended-history"
                  checked={monitoringSettings.extendedHistory}
                  onCheckedChange={(value) => handleMonitoringSettingChange('extendedHistory', value)}
                />
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Dica de Monitoramento</h4>
                  <p className="text-xs text-yellow-700 mt-1">
                    Monitoramentos muito frequentes podem resultar em bloqueio temporário por alguns sites. 
                    Recomendamos intervalo de 6-12 horas para melhor performance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API e Integrações</CardTitle>
              <CardDescription>
                Configure o acesso à API e opções de exportação de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="api-access">Habilitar Acesso à API</Label>
                  <p className="text-xs text-gray-500">
                    Permite integrar com outros sistemas e aplicativos
                  </p>
                </div>
                <Switch
                  id="api-access"
                  checked={apiSettings.enableApiAccess}
                  onCheckedChange={(value) => handleApiSettingChange('enableApiAccess', value)}
                />
              </div>
              
              {apiSettings.enableApiAccess && (
                <div className="space-y-2">
                  <Label htmlFor="api-key">Sua Chave API</Label>
                  <div className="flex">
                    <Input
                      id="api-key"
                      value={apiSettings.apiKey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button 
                      variant="outline" 
                      className="ml-2 whitespace-nowrap"
                      onClick={regenerateApiKey}
                    >
                      Regenerar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Mantenha esta chave em segredo. Ela permite acesso completo à sua conta.
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-1">
                  <Label htmlFor="external-scrapers">Permitir Scrapers Externos</Label>
                  <p className="text-xs text-gray-500">
                    Permite que o sistema use serviços externos para coletar dados de preço
                  </p>
                </div>
                <Switch
                  id="external-scrapers"
                  checked={apiSettings.allowExternalScrapers}
                  onCheckedChange={(value) => handleApiSettingChange('allowExternalScrapers', value)}
                />
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-base font-medium mb-3">Exportação de Dados</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="export-format">Formato de Exportação</Label>
                  <Select 
                    value={apiSettings.exportFormat} 
                    onValueChange={(value) => handleApiSettingChange('exportFormat', value)}
                  >
                    <SelectTrigger id="export-format">
                      <SelectValue placeholder="Selecione um formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex space-x-3 mt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleExportData}
                  >
                    <FileJson className="mr-2 h-4 w-4" />
                    Exportar Meus Dados
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex-1"
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Backup Completo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end mt-6">
        <Button 
          className="bg-brand-primary hover:bg-brand-dark"
          onClick={handleSaveSettings}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Todas as Configurações
            </>
          )}
        </Button>
      </div>
    </MainLayout>
  );
};

export default Settings;
