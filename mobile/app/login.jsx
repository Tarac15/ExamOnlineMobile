import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  useFonts,
  Roboto_600SemiBold,
  Roboto_400Regular
} from '@expo-google-fonts/roboto';

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Roboto_600SemiBold,
    Roboto_400Regular
  });

  if (!fontsLoaded) {
    return null; 
  }

  const handleLogin = async () => {
    try {
      const res = await fetch("http://192.168.1.6:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.token) {
          await AsyncStorage.setItem('userToken', data.token); 
          if (data.user) {
            await AsyncStorage.setItem('userProfileData', JSON.stringify(data.user));
          }
          Alert.alert("Sukses", "Login berhasil!"); 
          router.push("/(tabs)/home"); 
        } else {
          Alert.alert("Error", "Login berhasil tapi token tidak ditemukan!");
        }
      } else {
        Alert.alert("Login Gagal", data.message || "Terjadi kesalahan saat login.");
      }
    } catch (error) {
      console.error("Error during login:", error); 
      Alert.alert("Terjadi Kesalahan", "Tidak dapat terhubung ke server. Periksa koneksi Anda."); 
    }
  };

  return (
    <LinearGradient
      colors={["#73DFE7", "#0063F7"]}
      style={styles.gradientBackground}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.wrapper}
      >
        <View style={styles.formBox}>
          <Text style={styles.title}>Login</Text>

          <TextInput
            placeholder="Username"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            placeholder="Password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Masuk</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  formBox: {
    backgroundColor: '#ffffffee',
    borderRadius: 12,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Roboto_600SemiBold',
    marginBottom: 24,
    textAlign: 'center',
    color: "#333",
  },
  input: {
    backgroundColor: '#ffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#cccc',
    fontFamily: 'Roboto_400Regular'
  },
  button: {
    backgroundColor: '#4B6CD9',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: '#ffff',
    fontSize: 18,
    fontFamily: 'Roboto_600SemiBold',
    textAlign: 'center',
  },
});