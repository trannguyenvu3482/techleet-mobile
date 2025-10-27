import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button, Input } from '@/components/ui';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/store/auth-store';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const login = useAuthStore((state) => state.login);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      login(response);
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in. Please check your credentials.');
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
          <View className="items-center mb-2">
            <View className="h-16 w-16 rounded-full bg-blue-600 items-center justify-center mb-4">
              <Text className="text-white text-2xl font-bold">TL</Text>
            </View>
          </View>
          <Text className="text-3xl font-bold text-center text-gray-900 mb-2">Welcome Back</Text>
          <Text className="text-center text-gray-600">Sign in to your TechLeet Admin account</Text>
        </View>

        <View>
          <Input
            label="Email"
            placeholder="your.email@company.com"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            icon="mail-outline"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            isPassword
            icon="lock-closed-outline"
          />

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
            <Text className="text-blue-600 text-right mb-6">Forgot Password?</Text>
          </TouchableOpacity>

          <Button title="Sign In" onPress={handleSignIn} loading={isLoading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

