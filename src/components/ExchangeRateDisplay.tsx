import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import CurrencyConverter from '../utils/currencyConverter';

type Props = {
  from: string;
  to: string;
  compact?: boolean;
};

const converter = new CurrencyConverter('your_api_key'); // Replace with actual key

const ExchangeRateDisplay = ({ from, to, compact = false }: Props) => {
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    converter.getExchangeRate(from, to).then(setRate);
  }, [from, to]);

  const refresh = () => {
    converter.getExchangeRate(from, to).then(setRate);
  };

  if (compact) {
    return <Text>1 {from} = {rate?.toFixed(4)} {to}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text>Exchange Rate: 1 {from} = {rate?.toFixed(4)} {to}</Text>
      <Button title="Refresh" onPress={refresh} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 8, backgroundColor: '#f0f0f0', borderRadius: 4 },
});

export default ExchangeRateDisplay; 