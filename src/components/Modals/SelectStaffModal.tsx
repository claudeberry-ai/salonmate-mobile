import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Image } from 'react-native';

interface Staff {
  userId: number;
  userName: string;
  profilePicSigned?: string;
}

interface StaffModalProps {
  visible: boolean;
  staffList: Staff[];
  onSelect: (staff: Staff) => void;
  onClose: () => void;
}

const SelectStaffModal: React.FC<StaffModalProps> = ({ visible, staffList, onSelect, onClose }) => {
  // Sort staffList by userName in ascending order
  const sortedStaffList = [...staffList].sort((a, b) => a.userName.localeCompare(b.userName));

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Staff</Text>

          {/* Staff List */}
          <FlatList
            data={sortedStaffList}
            keyExtractor={(item) => item.userId.toString()}
            renderItem={({ item }) => {
              const hasImage = item.profilePicSigned && item.profilePicSigned.trim() !== '';
              return (
                <TouchableOpacity style={styles.staffItem} onPress={() => onSelect(item)}>
                  <View style={styles.placeholderProfile}>
                    {hasImage ? (
                      <Image source={{ uri: item.profilePicSigned }} style={styles.profilePic} />
                    ) : (
                      <Text style={styles.placeholderText}>{item.userName.charAt(0)}</Text>
                    )}
                  </View>
                  <Text style={styles.staffText}>{item.userName}</Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
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
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  staffItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },

  staffText: {
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#ff4444',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // marginRight: 10,
  },

  placeholderProfile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
});

export default SelectStaffModal;
