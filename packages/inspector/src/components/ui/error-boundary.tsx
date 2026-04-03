import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import i18n from '@core/i18n';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={styles.container}>
          <Text variant="titleMedium" style={styles.title}>{i18n.t('common.error')}</Text>
          <Text variant="bodySmall" style={styles.detail}>
            {this.state.error?.message ?? i18n.t('common.error')}
          </Text>
          <Button mode="contained" onPress={this.handleRetry} style={styles.button}>
            {i18n.t('common.retry')}
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { marginBottom: 8, color: '#C62828' },
  detail: { marginBottom: 24, color: '#616161', textAlign: 'center' },
  button: { borderRadius: 8 },
});
