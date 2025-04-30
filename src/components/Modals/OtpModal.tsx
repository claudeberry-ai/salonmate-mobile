import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface OTPModalProps {
  visible: boolean;
  email: string;
  onClose: () => void;
  onVerify: (otp: string) => void;
}

const OTPModal: React.FC<OTPModalProps> = ({ visible, email, onClose, onVerify }) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputs = useRef<TextInput[]>([]);

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Allow only one character per box

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to the next input if a digit is entered
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }

    // Move to the previous input if a digit is deleted
    if (!value && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }

    // Automatically verify if all digits are entered
    // if (newOtp.every((digit) => digit !== '')) {
    //   onVerify(newOtp.join(''));
    // }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Verify OTP</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Email */}
          <Text style={styles.emailText}>OTP sent to: {email}</Text>

          {/* OTP Inputs */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (otpInputs.current[index] = ref!)}
                style={styles.otpInput}
                value={digit}
                onChangeText={(value) => handleOtpChange(index, value)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() => onVerify(otp.join(''))}>
            <Text style={styles.verifyButtonText}>Verify</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  emailText: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpInput: {
    width: 40,
    height: 50,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 5,
    fontSize: 18,
    color: '#1F2937',
  },
  verifyButton: {
    backgroundColor: '#F59E0B',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default OTPModal;