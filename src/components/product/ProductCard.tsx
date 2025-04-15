import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, ExternalLink, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from '@/lib/utils';
import PriceAlertForm from '@/components/product/PriceAlertForm';
import { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
  onViewDetails: (id: string) => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onDelete, onViewDetails, onUpdateProduct }) => {
  const [openAlertModal, setOpenAlertModal] = useState(false);
  const [priceTarget, setPriceTarget] = useState<number | null>(product.priceTarget);

  const handlePriceAlertSet = (targetPrice: number) => {
    setPriceTarget(targetPrice);
    onUpdateProduct(product.id, { priceTarget: targetPrice });
  };

  const isOnSale = product.isOnSale;
  const priceChange = product.priceChange;

  return (
    <Card className="bg-white shadow-md rounded-lg overflow-hidden">
      <CardHeader className="flex items-start justify-between">
        <CardTitle className="text-lg font-semibold truncate">{product.name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onViewDetails(product.id)}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(product.id)} className="text-destructive focus:bg-destructive/50">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="p-4">
        <div className="aspect-w-3 aspect-h-2 mb-3">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="object-cover rounded-md w-full h-48"
          />
        </div>
        <CardDescription className="text-sm text-gray-500">
          Loja: {product.store}
        </CardDescription>
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{formatCurrency(product.currentPrice)}</p>
              {product.previousPrice !== null && product.previousPrice !== undefined && (
                <p className="text-sm text-gray-500 line-through">{formatCurrency(product.previousPrice)}</p>
              )}
            </div>
            {isOnSale && (
              <Badge className="bg-green-500 text-white">
                Em Oferta
              </Badge>
            )}
          </div>
          {priceChange !== null && priceChange !== undefined && (
            <p className={`text-sm ${priceChange < 0 ? 'text-green-500' : 'text-red-500'}`}>
              {priceChange > 0 ? '+' : ''}{priceChange}%
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center p-4">
        <Button variant="outline" asChild>
          <a href={product.url} target="_blank" rel="noopener noreferrer" className="w-full">
            Ver na Loja
          </a>
        </Button>
        <Button onClick={() => setOpenAlertModal(true)} className="bg-brand-primary hover:bg-brand-dark">
          {priceTarget ? 'Editar Alerta' : 'Criar Alerta'}
        </Button>
      </CardFooter>

      <Dialog open={openAlertModal} onOpenChange={setOpenAlertModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {priceTarget ? 'Editar Alerta de Preço' : 'Criar Alerta de Preço'}
            </DialogTitle>
            <DialogDescription>
              Defina o preço desejado para receber notificações quando o produto atingir esse valor.
            </DialogDescription>
          </DialogHeader>
          <PriceAlertForm
            product={product}
            onClose={() => setOpenAlertModal(false)}
            onAlertSet={handlePriceAlertSet}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProductCard;
