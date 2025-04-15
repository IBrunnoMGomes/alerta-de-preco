
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { Product } from "@/types/product";
import AddProductForm from "@/components/product/AddProductForm";

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
  onViewDetails: (id: string) => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  onAddProduct: (product: Omit<Product, 'id'>) => Promise<void>;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  isLoading,
  onDelete,
  onViewDetails,
  onUpdateProduct,
  onAddProduct,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div 
            key={index} 
            className="h-96 rounded-lg bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="text-center p-6">
        <CardContent className="pt-6 flex flex-col items-center">
          <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <ShoppingBag className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">Nenhum produto monitorado</h3>
          <p className="text-gray-500 mb-4">
            Adicione produtos para começar a monitorar os preços
          </p>
          <AddProductForm onAddProduct={onAddProduct} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onDelete={onDelete}
          onViewDetails={onViewDetails}
          onUpdateProduct={onUpdateProduct}
        />
      ))}
    </div>
  );
};

export default ProductList;
