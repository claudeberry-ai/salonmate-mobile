import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';

type EditServiceModalProps = {
  visible: boolean;
  onClose: () => void;
  onDelete: (id: number) => void;
  service: { id: number; name: string; price: string } | null;
  onSave: (id: number, name: string, price: string) => void;
};

export default function EditServiceModal({
  visible,
  onClose,
  onDelete,
  service,
  onSave,
}: EditServiceModalProps) {
  const [name, setName] = useState(service?.name || '');
  const [price, setPrice] = useState(service?.price || '');

  useEffect(() => {
    if (service) {
      setName(service.name);
      setPrice(service.price);
    }
  }, [service]);

  const handleSave = () => {
    if (service) {
      onSave(service.id, name, price);
    }
  };
  const handleDelete = () => {
    if (service) {
      onDelete(service.id);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#333" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Edit Service</Text>

          <Text style={styles.label}>Service Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter service name"
          />

          <Text style={styles.label}>Price (₹)</Text>
          <TextInput
            style={styles.input}
            value={price.toString()}
            onChangeText={setPrice}
            placeholder="Enter price"
            keyboardType="numeric"
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleDelete} style={[styles.button, styles.cancelButton]}>
              <Text className="text-md font-semibold text-red-600">Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[styles.button, styles.saveButton]}>
              <Text className="text-md font-semibold text-white">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

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
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1e40af',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#1e40af',
  },
  cancelButton: {
    backgroundColor: '#d1d5db',
  },
});
