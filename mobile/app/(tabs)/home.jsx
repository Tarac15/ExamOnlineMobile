import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Roboto_600SemiBold, Roboto_400Regular } from '@expo-google-fonts/roboto';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';

const normalizeClassNameForExam = (className) => {
  if (!className) return '';
  const regex = /\s\d+$/;
  return className.replace(regex, '');
};

const normalizeClassForComparison = (className) => {
  if (!className) return '';
  return className.toLowerCase().replace(/\s\d+$/, '').trim();
};

export default function App() {
  const navigation = useNavigation();
  const route = useRoute();

  const [fontsLoaded] = useFonts({
    Roboto_600SemiBold,
    Roboto_400Regular
  });

  const [allJadwalList, setAllJadwalList] = useState([]); 
  const [filteredJadwalList, setFilteredJadwalList] = useState([]); 
  const [hasilUjian, setHasilUjian] = useState([]); 
  const [userProfile, setUserProfile] = useState({
    username: 'Loading...',
    nisn: 'Loading...',
    kelas: 'Loading...',
    images: 'https://via.placeholder.com/60',
    _id: null,
  });

  const fetchHasilUjian = useCallback(async (currentUserId) => {
    if (!currentUserId) {
      console.warn("fetchHasilUjian dipanggil tanpa User ID yang valid. Tidak mengambil hasil ujian.");
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
          'Authorization': `Bearer ${token}`
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Respons server error saat mengambil hasil:', errorText);
        setHasilUjian([]);
        return;
      }
      const data = await res.json();

      const latestResultsMap = new Map();
      data.forEach(item => {
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
      console.error('Error saat mengambil hasil ujian:', err.message);
      setHasilUjian([]);
    }
  }, []);

  useEffect(() => {
    const fetchJadwal = async () => {
      try {
        const res = await fetch("http://192.168.1.6:3000/api/jadwal");
        const data = await res.json();
        setAllJadwalList(data.map(j => ({
          mapel: j.namaUjian || 'N/A',
          kelas: j.kelas || 'N/A',
          jam: j.waktu || 'N/A',
          tanggal: j.tanggal || 'N/A',
          status: 'mulai',
          id: j._id || null
        })));
      } catch (err) {
        console.error('Gagal mengambil data jadwal', err);
        Alert.alert("Error", "Gagal mengambil data jadwal. Pastikan server berjalan dan alamat IP benar.");
      }
    };

    const fetchUserProfile = async () => {
      let tempUserId = null;
      let storedProfileData = null;
      try {
        storedProfileData = await AsyncStorage.getItem('userProfileData');
        if (storedProfileData) {
          const parsedData = JSON.parse(storedProfileData);
          tempUserId = parsedData._id || parsedData.id || parsedData.userId || null;
          setUserProfile({
            username: parsedData.username || 'N/A',
            nisn: parsedData.nisn || 'N/A',
            kelas: parsedData.kelas || 'N/A',
            images: parsedData.images || 'https://via.placeholder.com/60',
            _id: tempUserId,
          });
        }

        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          if (!storedProfileData) {
            setUserProfile({
              username: 'Guest',
              nisn: 'N/A',
              kelas: 'N/A',
              images: 'https://via.placeholder.com/60',
              _id: null,
            });
          }
          tempUserId = null;
          fetchHasilUjian(tempUserId); 
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
              username: 'Silakan Login', 
              nisn: 'N/A',
              kelas: 'N/A',
              images: 'https://via.placeholder.com/60',
              _id: null,
            });
            setHasilUjian([]); 
          }
          tempUserId = null;
          fetchHasilUjian(tempUserId); 
          throw new Error(`Gagal mengambil data profil: ${res.statusText}`);
        }

        const data = await res.json();
        const fetchedId = data._id || data.id || data.userId || null;

        setUserProfile({
          username: data.username || 'N/A',
          nisn: data.nisn || 'N/A',
          kelas: data.kelas || 'N/A',
          images: data.images || 'https://via.placeholder.com/60',
          _id: fetchedId,
        });

        await AsyncStorage.setItem('userProfileData', JSON.stringify({
          ...data,
          _id: fetchedId,
        }));

        tempUserId = fetchedId;
      } catch (err) {
        console.error('Gagal mengambil data profil pengguna:', err.message);
        tempUserId = null;
        if (!storedProfileData) {
          setUserProfile({
            username: 'Error memuat pengguna',
            nisn: 'N/A',
            kelas: 'N/A',
            images: 'https://via.placeholder.com/60',
            _id: null,
          });
        }
      } finally {
        fetchHasilUjian(tempUserId);
      }
    };

    fetchJadwal();
    fetchUserProfile();
  }, [fetchHasilUjian]); 

  useEffect(() => {
    if (userProfile.kelas && userProfile.kelas !== 'N/A' && allJadwalList.length > 0) {
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

  useFocusEffect(
    useCallback(() => {
      const refreshDataOnFocus = async () => {
        let tempUserId = null;
        try {
          const storedProfileData = await AsyncStorage.getItem('userProfileData');
          if (storedProfileData) {
            const parsedData = JSON.parse(storedProfileData);
            tempUserId = parsedData._id || parsedData.id || parsedData.userId || null;
            setUserProfile({
              username: parsedData.username || 'N/A',
              nisn: parsedData.nisn || 'N/A',
              kelas: parsedData.kelas || 'N/A',
              images: parsedData.images || 'https://via.placeholder.com/60',
              _id: tempUserId,
            });
          }
        } catch (err) {
          console.error('Error saat mengambil data profil pengguna saat fokus:', err.message);
        } finally {
          if (tempUserId) {
            fetchHasilUjian(tempUserId); 
          } else {
            console.log("Tidak ada ID pengguna yang valid saat fokus, tidak mengambil hasil.");
            setHasilUjian([]); 
          }
        }
      };

      refreshDataOnFocus();

      if (route.params?.refreshResults === 'true') {
        navigation.setParams({ refreshResults: undefined });
      }

    }, [fetchHasilUjian, navigation, route.params?.refreshResults]) 
  );

  const handleMulaiUjian = (item) => {
    const normalizedKelas = normalizeClassNameForExam(item.kelas);
    navigation.navigate('ujian', {
      examName: item.mapel || 'N/A',
      kelas: normalizedKelas || 'N/A',
      userName: userProfile.username || 'N/A',
      userClass: userProfile.kelas || 'N/A',
      examId: item.id || null,
    });
  };

  if (!fontsLoaded) return null;

  const limitedJadwalList = filteredJadwalList.slice(0, 3);
  const limitedHasilUjianList = hasilUjian.slice(0, 4);

  return (
    <ScrollView style={{ backgroundColor: '#ffff' }}>
      <View style={styles.profileBox}>
        <Image
          source={{ uri: userProfile.images }}
          style={styles.avatar}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileText1}>{userProfile.username}</Text>
          <Text style={styles.profileText2}>{userProfile.nisn}</Text>
          <Text style={styles.profileText3}>{userProfile.kelas}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>JADWAL</Text>
        {limitedJadwalList.length > 0 ? (
          limitedJadwalList.map((item, idx) => (
            <View key={item.id || idx} style={styles.jadwalCard}>
              <View>
                <Text style={styles.mapel}>{item.mapel}</Text>
                <Text style={styles.kelas}>{item.kelas}</Text>
                <Text style={styles.tanggal}>{item.tanggal}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.jam}>{item.jam}</Text>
                <TouchableOpacity
                  style={[
                    styles.mulaiButton,
                    { backgroundColor: item.status === 'mulai' ? '#4B6CD9' : '#EF4444' }
                  ]}
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
        {filteredJadwalList.length > 3 && (
          <TouchableOpacity onPress={() => navigation.navigate('jadwal')}> 
            <Text style={styles.linkText}>Lihat lebih banyak...</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>HASIL UJIAN</Text>
        <View style={styles.grid}>
          {limitedHasilUjianList.length > 0 ? ( 
            limitedHasilUjianList.map((item, idx) => (
              <View key={idx} style={styles.hasilCard}>
                <View style={styles.hasilLogo}><Text>🧪</Text></View>
                <Text style={styles.mapel}>{item.mapel}</Text>
                <Text style={styles.hasilText}>Skor: {item.skor}</Text>
                <Text style={styles.hasilText}>Nilai: {item.nilai}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noResultsText}>Tidak ada hasil ujian tersedia.</Text>
          )}
        </View>
        {hasilUjian.length > 4 && (
          <TouchableOpacity onPress={() => navigation.navigate('hasil')}>
              <Text style={styles.linkText}>Lihat lebih banyak...</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  noResultsText: {
    textAlign: 'center',
    width: '100%',
    marginTop: 20,
    color: '#666',
    fontStyle: 'italic',
    fontFamily: 'Roboto_400Regular',
  },
  noJadwalText: {
    textAlign: 'center',
    width: '100%',
    marginTop: 20,
    color: '#666',
    fontStyle: 'italic',
    fontFamily: 'Roboto_400Regular',
  },
  profileBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0063F7',
    paddingHorizontal: 40,
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7F1D1D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileText1: {
    fontSize: 18,
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Roboto_600SemiBold',
  },
  profileText2: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Roboto_400Regular',
  },
  profileText3: {
    fontSize: 14,
    marginBottom: 4,
    color: '#262624',
    fontFamily: 'Roboto_400Regular',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111827',
    fontFamily: 'Roboto_600SemiBold',
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
  hasilText: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 14,
    color: '#111827',
  },
});