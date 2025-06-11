import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';

import {
  useFonts,
  Roboto_800ExtraBold
} from '@expo-google-fonts/roboto';

export default function Home() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
      Roboto_800ExtraBold
    });
  
    if (!fontsLoaded) {
      return null; 
    }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#73DFE7', '#0063F7']}
        style={styles.background}>
        <Text style={styles.title}>SELAMAT DATANG</Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <Text style={styles.closing}>UJIAN BERBASIS ONLINE</Text>
      </LinearGradient>
    </View>
  );
}
  
const styles = StyleSheet.create({
  container: { 
    flex: 1,     
    paddingHorizontal: 0,
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0
  },
  title: { 
    fontSize: 40,
    color: '#17233D',
    textAlign: "center",
    marginBottom: 200,
    fontFamily: 'Roboto_800ExtraBold'
  },
  button: {
    backgroundColor: "#0029A3",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center", 
    alignSelf: "center",
  },
  buttonText: { 
    color: "#ffff", 
    fontSize: 20 
  },
  closing: {
    fontSize: 40,
    color: '#17233D',
    textAlign: "center",
    marginTop: 200,
    fontFamily: 'Roboto_800ExtraBold'
  }
});