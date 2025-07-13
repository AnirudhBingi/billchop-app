import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import CurrencyConverter from '../utils/currencyConverter';

type Props = {
  amount: number;
  from: string;
  to: string;
  date: Date;
};

const converter = new CurrencyConverter('your_api_key');

const TransactionRateDisplay = ({ amount, from, to, date }: Props) => {
  const [converted, setConverted] = useState<number | null>(null);

  useEffect(() => {
    converter.convertAmount(amount, from, to, date).then(setConverted);
  }, [amount, from, to, date]);

  return (
    <View>
      <Text>{amount} {from} = {converted?.toFixed(2)} {to} (on {date.toLocaleDateString()})</Text>
    </View>
  );
};

export default TransactionRateDisplay; 