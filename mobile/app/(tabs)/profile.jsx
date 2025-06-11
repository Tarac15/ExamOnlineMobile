import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Roboto_600SemiBold, Roboto_400Regular } from '@expo-google-fonts/roboto';

const Profile = () => {
  const [fontsLoaded] = useFonts({
    Roboto_600SemiBold,
    Roboto_400Regular
  });

  const [userProfile, setUserProfile] = useState({
    username: 'Loading...',
    nisn: 'Loading...',
    kelas: 'Loading...',
    images: 'https://via.placeholder.com/60'
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const storedProfileData = await AsyncStorage.getItem('userProfileData');

        if (storedProfileData) {
          const parsedData = JSON.parse(storedProfileData);
          setUserProfile({
            username: parsedData.username || 'N/A',
            nisn: parsedData.nisn || 'N/A',
            kelas: parsedData.kelas || 'N/A',
            images: parsedData.images || 'https://via.placeholder.com/60'
          });
        }

        const token = await AsyncStorage.getItem('userToken');

        if (!token) {
          if (!storedProfileData) {
            setUserProfile({
              username: 'Guest',
              nisn: 'N/A',
              kelas: 'N/A',
              images: 'https://via.placeholder.com/60'
            });
          }
          return;
        }

        const res = await fetch("http://192.168.1.6:3000/api/auth/me", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          if (res.status === 401) {
            console.warn('Token tidak valid atau kadaluarsa. Pengguna mungkin perlu login ulang.');
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userProfileData');
            setUserProfile({
              username: 'Please Login',
              nisn: 'N/A',
              kelas: 'N/A',
              images: 'https://via.placeholder.com/60'
            });
          }
          throw new Error(`Gagal mengambil data profil: ${res.statusText}`);
        }

        const data = await res.json();
        setUserProfile({
          username: data.username,
          nisn: data.nisn,
          kelas: data.kelas,
          images: data.images || 'https://via.placeholder.com/60'
        });
        await AsyncStorage.setItem('userProfileData', JSON.stringify(data));
      } catch (err) {
        console.error('Gagal mengambil data profil pengguna', err);
        const storedProfileData = await AsyncStorage.getItem('userProfileData');
        if (!storedProfileData) {
            setUserProfile({
                username: 'Error loading user',
                nisn: 'N/A',
                kelas: 'N/A',
                // Fallback to placeholder URL on error
                images: 'https://via.placeholder.com/60'
            });
        }
      }
    };

    fetchUserProfile();
  }, []);

  if (!fontsLoaded) {
    return null; 
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerSection}>
        <Image
          source={{ uri: userProfile.images }}
          style={styles.avatar}
        />
        <Text style={styles.usernameText}>{userProfile.username.toUpperCase()}</Text>
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailLabel}>Nama</Text>
        <View style={styles.detailBox}>
          <Text style={styles.detailText}>{userProfile.username}</Text>
        </View>

        <Text style={styles.detailLabel}>Kelas</Text>
        <View style={styles.detailBox}>
          <Text style={styles.detailText}>{userProfile.kelas}</Text>
        </View>

        <Text style={styles.detailLabel}>NISN</Text>
        <View style={styles.detailBox}>
          <Text style={styles.detailText}>{userProfile.nisn}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffff',
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#ffff',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D1D5DB', 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  usernameText: {
    fontSize: 24,
    color: '#111827',
    fontFamily: 'Roboto_600SemiBold',
    textAlign: 'center',
  },
  detailSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  detailLabel: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Roboto_600SemiBold',
    marginBottom: 8,
    marginTop: 15,
  },
  detailBox: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  detailText: {
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'Roboto_400Regular',
  },
});

export default Profile;