import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

export default function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.bar}>
      <Text style={styles.text}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.headerBg,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'stretch',
  },
  text: {
    color: colors.headerText,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 2,
    textAlign: 'center',
  },
});
