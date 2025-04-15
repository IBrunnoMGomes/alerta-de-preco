
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, InfoIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PriceAlertFormProps {
  product: Product;
  onClose: () => void;
  onAlertSet: (targetPrice: number) => void;
}

const PriceAlertForm = ({ product, onClose, onAlertSet }: PriceAlertFormProps) => {
  const [targetPrice, setTargetPrice] = useState<string>(
    product.priceTarget ? product.priceTarget.toString() : ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetPrice || isNaN(Number(targetPrice)) || Number(targetPrice) <= 0) {
      toast({
        title: "Preço inválido",
        description: "Por favor, insira um preço válido maior que zero.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const numTargetPrice = Number(targetPrice);
      
      // Obter o ID do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para configurar alertas.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Atualizar o preço alvo no produto
      const { error: productError } = await supabase
        .from('products')
        .update({ price_target: numTargetPrice })
        .eq('id', product.id);
        
      if (productError) throw productError;
      
      // Verificar se já existe um alerta para este produto
      const { data: existingAlerts, error: queryError } = await supabase
        .from('alerts')
        .select('*')
        .eq('product_id', product.id)
        .single();
        
      if (queryError && queryError.code !== 'PGRST116') {
        // PGRST116 significa que não encontrou resultado (que é esperado se não houver alerta)
        throw queryError;
      }
      
      if (existingAlerts) {
        // Atualizar alerta existente
        const { error: updateError } = await supabase
          .from('alerts')
          .update({ 
            target_price: numTargetPrice,
            is_active: true,
            last_triggered: null 
          })
          .eq('id', existingAlerts.id);
          
        if (updateError) throw updateError;
      } else {
        // Criar novo alerta
        const { error: insertError } = await supabase
          .from('alerts')
          .insert({
            user_id: user.id,
            product_id: product.id,
            target_price: numTargetPrice,
            is_active: true
          });
          
        if (insertError) throw insertError;
      }
      
      toast({
        title: "Alerta configurado",
        description: `Você será notificado quando o preço cair abaixo de ${formatCurrency(numTargetPrice)}.`,
      });
      
      onAlertSet(numTargetPrice);
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao configurar alerta",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="targetPrice">Preço alvo (R$)</Label>
        <Input
          id="targetPrice"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
          required
        />
        <p className="text-sm text-muted-foreground flex items-center">
          <InfoIcon className="h-4 w-4 mr-1" />
          Você será notificado quando o preço cair abaixo deste valor.
        </p>
      </div>
      
      <div className="border rounded-md p-3 bg-muted/50">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-brand-primary" />
          <div>
            <h4 className="text-sm font-medium">Preço atual: {formatCurrency(product.currentPrice)}</h4>
            <p className="text-xs text-muted-foreground">
              {product.previousPrice ? `Preço anterior: ${formatCurrency(product.previousPrice)}` : 'Sem preço anterior registrado'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" type="button" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-brand-primary" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar alerta"}
        </Button>
      </div>
    </form>
  );
};

export default PriceAlertForm;
