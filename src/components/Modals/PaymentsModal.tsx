import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput } from 'react-native';

interface PaymentModalProps {
  visible: boolean;
  totalAmount: number;
  totalAdditionalCharges: number;
  serviceCount: number;
  onClose: () => void;
  onConfirm: (paymentData: any) => void;
  isChangePaymentOnly?: boolean; // New prop
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  totalAmount,
  totalAdditionalCharges,
  serviceCount,
  onClose,
  onConfirm,
  isChangePaymentOnly = false
}) => {
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [netAmount, setNetAmount] = useState(totalAmount + totalAdditionalCharges);

  // Recalculate net amount when discount changes
  useEffect(() => {
    setNetAmount(totalAmount + totalAdditionalCharges - discount);
    
  }, [discount, totalAmount, totalAdditionalCharges]);

  const handleConfirm = () => {
    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    const paymentData = {
      serviceCount,
      totalAmount,
      totalAdditionalCharges,
      discount,
      netAmount,
      paymentMethod,
    };

    onConfirm(paymentData);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 items-center justify-center bg-black/50">
        <View className="w-4/5 rounded-lg bg-white p-6">
          <Text className="mb-4 text-center text-lg font-bold">Payment Details</Text>

          <Text className="text-md font-semibold">Select Payment Method:</Text>
          <View className="my-2 flex-row justify-around">
            {['Cash', 'UPI', 'Card'].map((method) => (
              <TouchableOpacity
                key={method}
                className={`rounded-lg px-4 py-2 ${
                  paymentMethod === method ? 'bg-violet-600' : 'bg-gray-300'
                }`}
                onPress={() => setPaymentMethod(method)}>
                <Text className="font-semibold text-white">{method}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {!isChangePaymentOnly && (
            <>
              <Text className="text-md mt-2 font-semibold">Total Amount: ₹{totalAmount}</Text>
              <Text className="text-md mt-1 font-semibold">
                Additional Charges: ₹{totalAdditionalCharges}
              </Text>
              <Text className="text-md mt-2 font-semibold">Discount:</Text>
              <TextInput
                className="mt-1 rounded-lg border border-gray-300 p-2"
                keyboardType="numeric"
                placeholder="Enter Discount"
                value={discount.toString()}
                onChangeText={(value) => setDiscount(parseFloat(value) || 0)}
              />
              <Text className="mt-3 text-lg font-bold">Net Amount: ₹{netAmount}</Text>
            </>
          )}

          <View className="mt-4 flex-row justify-between">
            <TouchableOpacity className="rounded-lg bg-gray-500 px-4 py-2" onPress={onClose}>
              <Text className="text-white">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-lg bg-violet-600 px-4 py-2"
              onPress={handleConfirm}>
              <Text className="text-white">Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PaymentModal;
