import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Roboto_600SemiBold, Roboto_400Regular } from '@expo-google-fonts/roboto';
import { useFocusEffect } from '@react-navigation/native';

export default function HasilUjian() {
  const [fontsLoaded] = useFonts({
    Roboto_600SemiBold,
    Roboto_400Regular,
  });
  const [hasilUjian, setHasilUjian] = useState([]);
  const [userId, setUserId] = useState(null);

  const fetchHasilUjian = useCallback(async (currentUserId) => {
    if (!currentUserId) {
      console.warn('fetchHasilUjian dipanggil tanpa User ID yang valid. Tidak mengambil hasil.');
      setHasilUjian([]);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setHasilUjian([]);
        return;
      }

      console.log(`Mengambil hasil ujian untuk userId: ${currentUserId}`);
      const res = await fetch(`http://192.168.1.6:3000/api/hasilujian/user/${currentUserId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server response error fetching results:', errorText);
        setHasilUjian([]);
        return;
      }
      const data = await res.json();

      const latestResultsMap = new Map();
      data.forEach((item) => {
        if (!latestResultsMap.has(item.mapel)) {
          latestResultsMap.set(item.mapel, {
            mapel: item.mapel || 'N/A',
            skor: item.jawabanBenar && item.jumlahSoal ? `${item.jawabanBenar}/${item.jumlahSoal}` : 'N/A',
            nilai: item.persentase ? item.persentase.toFixed(2) : 'N/A',
          });
        }
      });

      const formattedResults = Array.from(latestResultsMap.values());
      setHasilUjian(formattedResults);
    } catch (err) {
      console.error('Error fetching hasil ujian:', err.message);
      setHasilUjian([]);
    }
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const storedProfileData = await AsyncStorage.getItem('userProfileData');
        if (storedProfileData) {
          const parsedData = JSON.parse(storedProfileData);
          const fetchedId = parsedData._id || parsedData.id || parsedData.userId || null;
          setUserId(fetchedId);
        }
      } catch (err) {
        console.error('Gagal mengambil data profil pengguna:', err.message);
        setUserId(null);
      }
    };

    fetchUserProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        console.log('Memicu refresh hasil ujian karena layar fokus...');
        fetchHasilUjian(userId);
      } else {
        console.log('User ID belum tersedia, tidak memicu fetchHasilUjian.');
        if (hasilUjian.length > 0) {
          setHasilUjian([]);
        }
      }
    }, [userId, fetchHasilUjian, hasilUjian.length])
  );

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Text style={styles.sectionTitle}>HASIL UJIAN</Text>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <View style={styles.grid}>
          {hasilUjian.length > 0 ? (
            hasilUjian.map((item, idx) => (
              <View key={idx} style={styles.hasilCard}>
                <View style={styles.hasilLogo}>
                  <Text>🧪</Text>
                </View>
                <Text style={styles.mapel}>{item.mapel}</Text>
                <Text style={styles.hasilText}>{item.skor}</Text>
                <Text style={styles.hasilText}>{item.nilai}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noResultsText}>Tidak ada hasil ujian tersedia.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 50,
    marginBottom: 10,
    color: '#111827',
    fontFamily: 'Roboto_600SemiBold',
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  hasilCard: {
    width: '47%',
    backgroundColor: '#A3BAFF',
    borderRadius: 12,
    alignItems: 'center',
    padding: 12,
    marginBottom: 15,
  },
  hasilLogo: {
    marginBottom: 5,
  },
  mapel: {
    fontFamily: 'Roboto_600SemiBold',
    fontSize: 16,
  },
  hasilText: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 14,
    color: '#111827',
  },
  noResultsText: {
    textAlign: 'center',
    width: '100%',
    marginTop: 20,
    color: '#666',
    fontStyle: 'italic',
    fontFamily: 'Roboto_400Regular',
  },
});