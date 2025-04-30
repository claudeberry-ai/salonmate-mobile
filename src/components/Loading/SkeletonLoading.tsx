// SkeletonLoading.js
 from 'react';
import { View, StyleSheet, Animated, Dimensions, SafeAreaView } from 'react-native';

const { width } = Dimensions.get('window');

const SkeletonLoading = () => {
  const shimmerAnimation = new Animated.Value(0);

  React.useEffect(() => {
    const animateShimmer = () => {
      shimmerAnimation.setValue(0);
      Animated.timing(shimmerAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => animateShimmer());
    };

    animateShimmer();
  }, []);

  const shimmerOpacity = shimmerAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1, 0.5],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Avatar and Text */}
      <View style={styles.header}>
        <View style={styles.avatar} />
        <View style={styles.headerTextContainer}>
          <View style={[styles.textLine, { width: width * 0.6 }]} />
          <View style={[styles.textLine, { width: width * 0.4, marginTop: 8 }]} />
        </View>
      </View>

      {/* Card Layout */}
      <View style={styles.card}>
        <View style={styles.cardImage} />
        <View style={styles.cardContent}>
          <View style={[styles.textLine, { width: width * 0.7 }]} />
          <View style={[styles.textLine, { width: width * 0.5, marginTop: 8 }]} />
          <View style={[styles.textLine, { width: width * 0.3, marginTop: 8 }]} />
        </View>
      </View>

      {/* List Items */}
      <View style={styles.listItem}>
        <View style={styles.listImage} />
        <View style={styles.listContent}>
          <View style={[styles.textLine, { width: width * 0.6 }]} />
          <View style={[styles.textLine, { width: width * 0.4, marginTop: 8 }]} />
        </View>
      </View>

      <View style={styles.listItem}>
        <View style={styles.listImage} />
        <View style={styles.listContent}>
          <View style={[styles.textLine, { width: width * 0.6 }]} />
          <View style={[styles.textLine, { width: width * 0.4, marginTop: 8 }]} />
        </View>
      </View>

      {/* Shimmer Overlay */}
      <Animated.View style={[styles.shimmer, { opacity: shimmerOpacity }]} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e1e1e1',
  },
  headerTextContainer: {
    marginLeft: 16,
  },
  textLine: {
    height: 12,
    backgroundColor: '#e1e1e1',
    borderRadius: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#e1e1e1',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  cardContent: {
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  listImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e1e1e1',
  },
  listContent: {
    flex: 1,
    marginLeft: 16,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});

export default SkeletonLoading;
