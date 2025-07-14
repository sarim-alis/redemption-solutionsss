export interface ShopifyOrder {
  id: number;
  email: string;
  order_number: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
  };
  financial_status: string;
  total_price: string;
  line_items: Array<{
    id: number;
    title: string;
    quantity: number;
    price: string;
  }>;
}
