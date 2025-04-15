
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PricePoint } from '@/types/product';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface PriceHistoryChartProps {
  priceHistory: PricePoint[];
  productName: string;
}

const PriceHistoryChart = ({ priceHistory, productName }: PriceHistoryChartProps) => {
  // Ordenar os dados por data
  const sortedData = [...priceHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Processar os dados para o formato aceito pelo gráfico
  const chartData = sortedData.map(point => ({
    date: new Date(point.date).toLocaleDateString('pt-BR'),
    price: point.price,
  }));

  // Encontrar o maior e menor preço para destacar
  const minPrice = Math.min(...priceHistory.map(p => p.price));
  const maxPrice = Math.max(...priceHistory.map(p => p.price));

  // Definir os limites do eixo Y com um pouco de margem
  const yMin = Math.floor(minPrice * 0.95);
  const yMax = Math.ceil(maxPrice * 1.05);

  // Formatar a tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="font-bold text-brand-primary">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Histórico de Preços: {productName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 25,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis
                domain={[yMin, yMax]}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ r: 4, fill: "#0ea5e9", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#0c4a6e" }}
                animationDuration={500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="border rounded-md p-3 bg-gray-50">
            <div className="text-xs text-gray-500">Menor Preço</div>
            <div className="text-lg font-bold text-price-decrease">
              {formatCurrency(minPrice)}
            </div>
          </div>
          
          <div className="border rounded-md p-3 bg-gray-50">
            <div className="text-xs text-gray-500">Maior Preço</div>
            <div className="text-lg font-bold text-price-increase">
              {formatCurrency(maxPrice)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceHistoryChart;
