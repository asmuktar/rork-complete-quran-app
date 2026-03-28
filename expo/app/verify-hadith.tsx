import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, CheckCircle, XCircle, BookOpen } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';

export default function VerifyHadithScreen() {
  const [hadithText, setHadithText] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyMutation = trpc.hadith.verifyHadith.useMutation({
    onSuccess: (data: any) => {
      setIsVerifying(false);
      Alert.alert(
        'Hadith Verification Result',
        `Grade: ${data.grade}\nSource: ${data.source}\nReference: ${data.reference}\n\n${data.explanation}`,
        [{ text: 'OK' }]
      );
    },
    onError: (error: any) => {
      setIsVerifying(false);
      Alert.alert('Error', error.message);
    },
  });

  const handleVerify = () => {
    if (!hadithText.trim()) {
      Alert.alert('Error', 'Please enter hadith text to verify');
      return;
    }
    setIsVerifying(true);
    verifyMutation.mutate({ text: hadithText.trim() });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <BookOpen size={32} color={Colors.primary} />
          <Text style={styles.title}>Verify Hadith Authenticity</Text>
          <Text style={styles.subtitle}>
            Enter the hadith text below to check its authenticity and chain of narration
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Hadith Text</Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={6}
            placeholder="Enter the hadith text you want to verify..."
            placeholderTextColor={Colors.textLight}
            value={hadithText}
            onChangeText={setHadithText}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, isVerifying && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={isVerifying}
        >
          {isVerifying ? (
            <ActivityIndicator color={Colors.surface} size="small" />
          ) : (
            <Search size={20} color={Colors.surface} />
          )}
          <Text style={styles.verifyButtonText}>
            {isVerifying ? 'Verifying...' : 'Verify Hadith'}
          </Text>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Hadith Verification</Text>
          <View style={styles.infoItem}>
            <CheckCircle size={16} color={Colors.success} />
            <Text style={styles.infoText}>
              Authentic hadiths are verified through multiple chains of narration
            </Text>
          </View>
          <View style={styles.infoItem}>
            <CheckCircle size={16} color={Colors.success} />
            <Text style={styles.infoText}>
              Grading system: Sahih (Authentic), Hasan (Good), Da&apos;if (Weak)
            </Text>
          </View>
          <View style={styles.infoItem}>
            <XCircle size={16} color={Colors.error} />
            <Text style={styles.infoText}>
              Always cross-reference with multiple authentic sources
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    minHeight: 120,
  },
  verifyButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    gap: 8,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
});