import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button, Input } from '@/components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return false;
    }
    setError('');
    return true;
  };

  const handleResetPassword = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      // TODO: Implement password reset API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert(
        'Success',
        'Password reset instructions have been sent to your email.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset instructions.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <StatusBar style="auto" />
      <ScrollView
        contentContainerClassName="flex-1 justify-center px-6 bg-white"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-10">
          <Text className="text-3xl font-bold text-center text-gray-900 mb-2">Forgot Password?</Text>
          <Text className="text-center text-gray-600">
            Enter your email address and we'll send you instructions to reset your password.
          </Text>
        </View>

        <View>
          <Input
            label="Email"
            placeholder="your.email@company.com"
            value={email}
            onChangeText={setEmail}
            error={error}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            icon="mail-outline"
          />

          <Button title="Send Reset Instructions" onPress={handleResetPassword} loading={isLoading} />

          <Button title="Back to Sign In" onPress={() => router.back()} variant="outline" className="mt-4" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

