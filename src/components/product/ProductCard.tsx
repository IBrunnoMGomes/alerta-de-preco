
import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  ExternalLink, 
  Trash2, 
  TrendingDown, 
  TrendingUp, 
  LineChart, 
  AlertTriangle 
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Product } from '@/types/product';
import { formatCurrency, getDaysAgo } from '@/lib/utils';
import PriceAlertForm from './PriceAlertForm';

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
  onViewDetails: (id: string) => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => void;
}

const ProductCard = ({ product, onDelete, onViewDetails, onUpdateProduct }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);

  const getPriceChangeColor = () => {
    if (product.priceChange < 0) return 'text-price-decrease';
    if (product.priceChange > 0) return 'text-price-increase';
    return 'text-price-neutral';
  };

  const getPriceChangeIcon = () => {
    if (product.priceChange < 0) return <TrendingDown className="h-4 w-4 text-price-decrease" />;
    if (product.priceChange > 0) return <TrendingUp className="h-4 w-4 text-price-increase" />;
    return null;
  };

  const handleAlertSet = (targetPrice: number) => {
    onUpdateProduct(product.id, { priceTarget: targetPrice });
  };

  const hasTargetPrice = product.priceTarget !== null;
  const isTargetMet = hasTargetPrice && product.currentPrice <= (product.priceTarget || 0);

  return (
    <Card 
      className="overflow-hidden transition-all duration-200 hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="h-48 w-full object-cover transition-opacity duration-200"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
          <div className="p-3 w-full">
            <div className="flex justify-between items-center">
              <Badge variant="secondary" className="bg-white/90 text-gray-800">
                {product.store}
              </Badge>
              {product.isOnSale && (
                <Badge variant="destructive" className="animate-pulse-subtle">
                  Promoção!
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {hasTargetPrice && (
          <div className="absolute top-2 right-2">
            <Badge 
              variant={isTargetMet ? "success" : "secondary"}
              className={`${isTargetMet ? 'bg-green-500' : 'bg-gray-600'} text-white`}
            >
              Meta: {formatCurrency(product.priceTarget || 0)}
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base line-clamp-2 mr-2">
            {product.name}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <div className="text-2xl font-bold text-brand-primary">
              {formatCurrency(product.currentPrice)}
            </div>
            {product.previousPrice && (
              <div className="text-sm text-gray-500 line-through">
                {formatCurrency(product.previousPrice)}
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <div className={`flex items-center ${getPriceChangeColor()}`}>
              {getPriceChangeIcon()}
              <span className="ml-1 font-medium">
                {Math.abs(product.priceChange)}%
              </span>
            </div>
            <div className="text-gray-500">
              Atualizado {getDaysAgo(product.lastUpdated)}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          onClick={() => onViewDetails(product.id)}
        >
          <LineChart className="h-3.5 w-3.5 mr-1" />
          Histórico
        </Button>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => setShowAlertDialog(true)}
          >
            <Bell className="h-3.5 w-3.5 mr-1" />
            Alerta
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => window.open(product.url, '_blank')}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            Visitar
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm" 
            className="text-xs"
            onClick={() => onDelete(product.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>

      <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configurar alerta de preço</DialogTitle>
          </DialogHeader>
          <PriceAlertForm 
            product={product}
            onClose={() => setShowAlertDialog(false)}
            onAlertSet={handleAlertSet}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProductCard;
