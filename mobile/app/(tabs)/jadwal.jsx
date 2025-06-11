import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useFonts, Roboto_600SemiBold, Roboto_400Regular } from '@expo-google-fonts/roboto';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const normalizeClassNameForExam = (className) => {
  if (!className) return '';
  const regex = /\s\d+$/; 
  return className.replace(regex, '');
};

const normalizeClassForComparison = (className) => {
  if (!className) return '';
  return className.toLowerCase().replace(/\s\d+$/, '').trim();
};

export default function Jadwal() {
  const navigation = useNavigation();
  const [fontsLoaded] = useFonts({
    Roboto_600SemiBold,
    Roboto_400Regular,
  });
  const [allJadwalList, setAllJadwalList] = useState([]); // Store all fetched schedules
  const [filteredJadwalList, setFilteredJadwalList] = useState([]); // Store filtered schedules
  const [userProfile, setUserProfile] = useState({
    username: 'N/A',
    kelas: 'N/A',
    _id: null,
  });

  useEffect(() => {
    const fetchJadwal = async () => {
      try {
        const res = await fetch('http://192.168.1.6:3000/api/jadwal');
        const data = await res.json();
        setAllJadwalList(
          data.map((j) => ({
            mapel: j.namaUjian || 'N/A',
            kelas: j.kelas || 'N/A',
            jam: j.waktu || 'N/A',
            tanggal: j.tanggal || 'N/A',
            status: 'mulai',
            id: j._id || null,
          }))
        );
      } catch (err) {
        console.error('Gagal mengambil data jadwal', err);
        Alert.alert('Error', 'Gagal mengambil data jadwal. Pastikan server berjalan dan IP address sudah benar.');
      }
    };

    const fetchUserProfile = async () => {
      try {
        const storedProfileData = await AsyncStorage.getItem('userProfileData');
        if (storedProfileData) {
          const parsedData = JSON.parse(storedProfileData);
          setUserProfile({
            username: parsedData.username || 'N/A',
            kelas: parsedData.kelas || 'N/A',
            _id: parsedData._id || parsedData.id || parsedData.userId || null,
          });
        }
      } catch (err) {
        console.error('Gagal mengambil data profil pengguna:', err.message);
      }
    };

    fetchJadwal();
    fetchUserProfile();
  }, []); 

  useEffect(() => {
    if (userProfile.kelas && allJadwalList.length > 0) {
      const normalizedUserKelas = normalizeClassForComparison(userProfile.kelas);
      const filtered = allJadwalList.filter(item => {
        const normalizedItemKelas = normalizeClassForComparison(item.kelas);
        return normalizedItemKelas === normalizedUserKelas;
      });
      setFilteredJadwalList(filtered);
    } else {
      setFilteredJadwalList([]); 
    }
  }, [allJadwalList, userProfile.kelas]); 

  const handleMulaiUjian = useCallback(
    (item) => {
      const normalizedKelas = normalizeClassNameForExam(item.kelas);
      navigation.navigate('ujian', {
        examName: item.mapel || 'N/A',
        kelas: normalizedKelas || 'N/A',
        userName: userProfile.username || 'N/A',
        userClass: userProfile.kelas || 'N/A',
        examId: item.id || null,
      });
    },
    [navigation, userProfile.username, userProfile.kelas]
  );

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Text style={styles.sectionTitle}>JADWAL</Text>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        {filteredJadwalList.length > 0 ? (
          filteredJadwalList.map((item, idx) => (
            <View key={item.id || idx} style={styles.jadwalCard}>
              <View>
                <Text style={styles.mapel}>{item.mapel}</Text>
                <Text style={styles.kelas}>{item.kelas}</Text>
                <Text style={styles.tanggal}>{item.tanggal}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.jam}>{item.jam}</Text>
                <TouchableOpacity
                  style={[styles.mulaiButton, { backgroundColor: item.status === 'mulai' ? '#4B6CD9' : '#EF4444' }]}
                  onPress={() => handleMulaiUjian(item)}
                >
                  <Text style={styles.mulaiText}>Mulai</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noJadwalText}>Tidak ada jadwal ujian untuk kelas Anda.</Text>
        )}
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
  jadwalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#A3BAFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  mapel: {
    fontFamily: 'Roboto_600SemiBold',
    fontSize: 16,
  },
  kelas: {
    color: '#555',
    fontFamily: 'Roboto_400Regular',
  },
  tanggal: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Roboto_400Regular',
  },
  jam: {
    fontSize: 16,
    fontFamily: 'Roboto_600SemiBold',
  },
  mulaiButton: {
    marginTop: 5,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  mulaiText: {
    color: '#fff',
    fontFamily: 'Roboto_600SemiBold',
  },
  linkText: {
    color: '#4B6CD9',
    textAlign: 'right',
    marginTop: 8,
    fontFamily: 'Roboto_400Regular',
  },
  noJadwalText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Roboto_400Regular',
  },
});