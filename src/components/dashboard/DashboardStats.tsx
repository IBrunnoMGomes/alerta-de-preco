
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Flame, TrendingDown, AlertTriangle } from "lucide-react";
import { Product } from "@/types/product";

interface DashboardStatsProps {
  products: Product[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ products }) => {
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
  );
};

export default DashboardStats;
