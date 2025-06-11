import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const EXAM_DURATION_SECONDS = 120;

export default function UjianScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const { userName = 'Yobby Nowialdi', examName = 'Ujian', kelas: userKelas = 'Umum', examId: passedExamId } = route.params || {};

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION_SECONDS);
  const [questions, setQuestions] = useState([]); 
  const timerRef = useRef(null);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');

        if (!token) {
          Alert.alert("Akses Ditolak", "Anda harus login untuk memulai ujian ini.");
          navigation.goBack();
          return;
        }

        console.log(`Mengambil soal untuk Mapel: "${examName}" dan Kelas: "${userKelas}"`);

        const res = await fetch(`http://192.168.1.6:3000/api/soal/byMapelAndKelas/${examName}/${userKelas}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error('Respons server error:', errorText);
          let errorMessage = 'Gagal mengambil soal ujian';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.msg || errorMessage;
          } catch (jsonErr) {
            errorMessage = `Gagal mengambil soal ujian: Respons server tidak valid. ${errorText.substring(0, Math.min(errorText.length, 100))}...`;
          }
          if (errorMessage.includes("Tidak ada token") || errorMessage.includes("Token tidak valid")) {
              Alert.alert("Sesi Habis", "Sesi Anda telah berakhir. Mohon login kembali.");
              navigation.goBack();
              return;
          }
          throw new Error(errorMessage);
        }
        const data = await res.json();
        console.log("Data soal yang diterima dari backend:", data);
        console.log("Jumlah soal yang diterima:", data.length);
        setQuestions(data);
      } catch (err) {
        console.error('Error mengambil soal:', err.message);
        Alert.alert("Error", `${err.message}. Pastikan server berjalan, Anda sudah login, dan data soal tersedia.`);
        navigation.goBack();
      }
    };

    fetchQuestions();

    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          handleSubmitExam();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
    };
  }, [examName, userKelas, navigation]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (option) => {
    setSelectedOptions({
      ...selectedOptions,
      [currentQuestion._id]: option,
    });
  };

  const handleQuestionNavigation = (index) => {
    setCurrentQuestionIndex(index);
  };

  const saveExamResult = async (resultData) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert("Gagal Menyimpan Hasil", "Anda tidak terautentikasi. Hasil tidak disimpan.");
        return;
      }

      const res = await fetch('http://192.168.1.6:3000/api/hasilujian', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(resultData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server response error saving result:', errorText);
        Alert.alert("Gagal Menyimpan Hasil", `Terjadi kesalahan saat menyimpan hasil: ${res.status} - ${errorText}`);
      } else {
        console.log('Hasil ujian berhasil disimpan:', await res.json());
      }
    } catch (err) {
      console.error('Error saving exam result:', err.message);
      Alert.alert("Error", `Gagal menyimpan hasil ujian: ${err.message}`);
    }
  };

  const handleSubmitExam = async () => {
    clearInterval(timerRef.current);

    const submittedAnswers = Object.keys(selectedOptions).map(questionId => ({
      questionId: questionId,
      chosenOption: selectedOptions[questionId],
    }));

    let correctAnswersCount = 0;
    questions.forEach(q => {
      const submittedOptionForQ = selectedOptions[q._id]; 
      if (submittedOptionForQ && submittedOptionForQ === q.jawabanBenar) {
        correctAnswersCount++;
      }
    });

    const totalQuestionsInExam = questions.length; 

    console.log("correctAnswersCount (benar):", correctAnswersCount);
    console.log("totalQuestionsInExam (total soal):", totalQuestionsInExam);
    console.log("selectedOptions (jawaban user):", selectedOptions);
    console.log("questions (soal dari backend):", questions);

    const scorePercentage = totalQuestionsInExam > 0 ? (correctAnswersCount / totalQuestionsInExam) * 100 : 0;

    const resultDataToSend = {
      examId: passedExamId,
      mapel: examName,
      kelas: userKelas,
      submittedAnswers: submittedAnswers,
      totalDuration: EXAM_DURATION_SECONDS - timeLeft,
    };

    await saveExamResult(resultDataToSend);

    Alert.alert(
      'Ujian Selesai!',
      `Anda menjawab benar ${correctAnswersCount} dari ${totalQuestionsInExam} soal.\nNilai Anda: ${scorePercentage.toFixed(2)}`,
      [
        {
          text: 'OK',
          onPress: () => {
            router.replace({
              pathname: '(tabs)/home',
              params: {
                refreshResults: 'true',
              },
            });
          },
        },
      ]
    );
  };

  const questionNumbers = Array.from({ length: questions.length }, (_, i) => i + 1);

  if (questions.length === 0 && timeLeft > 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Memuat soal ujian...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.examTitle}>{examName}</Text>
        <Text style={styles.subject}>{userKelas}</Text>
      </View>

      <View style={styles.userInfo}>
        <View style={styles.avatarPlaceholder} />
        <View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userClass}>{userKelas}</Text>
        </View>
      </View>

      <View style={styles.questionNavigationContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.questionNumbersScroll}>
          {questionNumbers.map((num, index) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.questionNumberButton,
                currentQuestionIndex === index && styles.currentQuestionButton,
                selectedOptions[questions[index]?._id] && styles.answeredQuestionButton,
              ]}
              onPress={() => handleQuestionNavigation(index)}
            >
              <Text
                style={[
                  styles.questionNumberText,
                  currentQuestionIndex === index && styles.currentQuestionText,
                  selectedOptions[questions[index]?._id] && styles.answeredQuestionText,
                ]}
              >
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>TIME: {formatTime(timeLeft)}</Text>
        <TouchableOpacity style={styles.finishButton} onPress={handleSubmitExam}>
          <Text style={styles.finishButtonText}>FINISH</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.questionCard}>
        {currentQuestion ? (
          <>
            <Text style={styles.questionNumberLabel}>SOAL {currentQuestionIndex + 1}</Text>
            <Text style={styles.questionText}>{currentQuestion.pertanyaan}</Text>
            <View style={styles.optionsContainer}>
              {currentQuestion.pilihan.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.optionButton}
                  onPress={() => handleOptionSelect(option)}
                >
                  <View
                    style={[
                      styles.optionRadio,
                      selectedOptions[currentQuestion._id] === option && styles.optionRadioSelected,
                    ]}
                  >
                    <Text style={styles.optionRadioLetter}>{String.fromCharCode(65 + index)}</Text>
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      selectedOptions[currentQuestion._id] === option && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.questionText}>Tidak ada soal yang tersedia untuk ujian ini.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#324a5f',
    paddingTop: 0,
  },
  header: {
    backgroundColor: '#5290b2',
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  examTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subject: {
    color: '#fff',
    fontSize: 18,
    marginTop: 5,
  },
  userInfo: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 15,
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    marginRight: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userClass: {
    fontSize: 14,
    color: '#666',
  },
  questionNavigationContainer: {
    height: 60,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  questionNumbersScroll: {
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  questionNumberButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#b0e0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#a0d0e0',
  },
  currentQuestionButton: {
    backgroundColor: '#8d6e63',
    borderColor: '#7a5d52',
  },
  answeredQuestionButton: {
    backgroundColor: '#9ccc65',
    borderColor: '#7cb342',
  },
  questionNumberText: {
    color: '#333',
    fontWeight: 'bold',
  },
  currentQuestionText: {
    color: '#fff',
  },
  answeredQuestionText: {
    color: '#fff',
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 10,
  },
  timerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  finishButton: {
    backgroundColor: '#ff5252',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  finishButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  questionCard: {
    backgroundColor: '#fff',
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  questionNumberLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  questionText: {
    fontSize: 18,
    marginBottom: 20,
    color: '#333',
  },
  optionsContainer: {},
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  optionRadioSelected: {
    backgroundColor: '#8d6e63',
    borderColor: '#8d6e63',
  },
  optionRadioLetter: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: 'bold',
    color: '#8d6e63',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#324a5f',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
});