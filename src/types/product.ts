
export interface PricePoint {
  date: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  url: string;
  store: string;
  currentPrice: number;
  previousPrice: number | null;
  priceChange: number; // percentual de mudança
  imageUrl: string;
  isOnSale: boolean;
  lastUpdated: string; // ISO string
  priceTarget: number | null; // preço desejado para notificação
  priceHistory: PricePoint[];
}
