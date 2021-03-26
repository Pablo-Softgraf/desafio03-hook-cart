//import { stringify } from 'node:querystring';
import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
//import { textSpanContainsTextSpan } from 'typescript';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    //Buscar dados do localStorage
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      //const productIndex = cart.findIndex(product => product.id === productId);
      //const prod = cart.map(product => product.id === productId?
      //const productAmount = cart[productIndex].amount + 1;
      const itemcart = cart.find(product => product.id === productId);
      //if (itemcart) {
      const stockProduct = await api.get<Stock>(`/stock/${productId}`).then(response => response.data);

      if (Number(itemcart?.amount) >= stockProduct?.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      //} else {
      //adiciona item no carrinho
      const product = await api.get<Product>(`/products/${productId}`)
        .then(response => response.data);
      //Verica se o item foi adicionado ao carrinho
      //const itemcart = cart.find(productitem => productitem.id === productId);

      setCart(olditem => {
        if (itemcart) {
          return olditem.map(item =>
            item.id === productId
              ? {
                ...item,
                amount: item.amount + 1,
              }
              : item
          );
        }
        //Adicionado pela primeira vez
        return [...olditem, { ...product, amount: 1 }];
      })
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
      //}
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productIndex = updatedCart.findIndex(product => product.id === productId);

      if (productIndex >= 0) {
        updatedCart.splice(productIndex, 1);
        setCart(updatedCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  }


  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      const { data: stockData } = await api.get(`stock/${productId}`);


      if (stockData.amount >= amount && amount > 0) {
        const updateProduct = cart.map(product => {
          if (product.id === productId) {
            return {
              ...product,
              amount
            }
          }
          return { ...product }
        })
        setCart(updateProduct)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateProduct))
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
