import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { searchMovies, getMovieDetails } from './src/api/omdb';
import SearchBar from './src/components/SearchBar';
import MovieCard from './src/components/MovieCard';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import { getCurrentUser, logout } from './src/services/auth';

const { width, height } = Dimensions.get('window');
const Stack = createStackNavigator();

function HomeScreen({ user, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    handleSearch('Marvel');
  }, []);

  const handleSearch = async (query) => {
    const term = query || searchQuery;
    if (!term) return;

    setLoading(true);
    setError(null);
    try {
      const data = await searchMovies(term);
      if (data.Response === 'True') {
        setMovies(data.Search);
      } else {
        setMovies([]);
        setError(data.Error || 'No movies found');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showMovieDetails = async (id) => {
    setDetailsLoading(true);
    setModalVisible(true);
    try {
      const data = await getMovieDetails(id);
      setSelectedMovie(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleWatchNow = async (imdbID) => {
    const url = `https://www.imdb.com/title/${imdbID}`;
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      Alert.alert(
        'Opening Movie',
        'Redirecting you to the movie source...',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'OK', onPress: () => Linking.openURL(url) },
        ]
      );
    } else {
      Alert.alert('Error', "Don't know how to open this URL: " + url);
    }
  };

  const renderItem = ({ item }) => (
    <MovieCard movie={item} onPress={() => showMovieDetails(item.imdbID)} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Flix<Text style={styles.accent}>Hub</Text></Text>
          <Text style={styles.headerSubtitle}>Hi, {user?.email?.split('@')[0] || 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF5252" />
        </TouchableOpacity>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSearch={() => handleSearch()}
      />

      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#00E5FF" />
            <Text style={styles.loadingText}>Searching the galaxy...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={60} color="#FF5252" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={movies}
            renderItem={renderItem}
            keyExtractor={(item) => item.imdbID}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={() => (
              <Text style={styles.sectionTitle}>Popular Results</Text>
            )}
          />
        )}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {detailsLoading ? (
              <ActivityIndicator size="large" color="#00E5FF" style={{ marginTop: 50 }} />
            ) : selectedMovie ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>

                <Image
                  source={{ uri: getPosterUrl(selectedMovie.Poster) }}
                  style={styles.modalPoster}
                  resizeMode="cover"
                />

                <View style={styles.detailsPayload}>
                  <Text style={styles.modalTitle}>{selectedMovie.Title}</Text>

                  <View style={styles.metaRow}>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.ratingText}>{selectedMovie.imdbRating}</Text>
                    </View>
                    <Text style={styles.metaText}>{selectedMovie.Year} • {selectedMovie.Runtime} • {selectedMovie.Rated}</Text>
                  </View>

                  <Text style={styles.sectionHeadline}>Genre</Text>
                  <Text style={styles.genreText}>{selectedMovie.Genre}</Text>

                  <Text style={styles.sectionHeadline}>Plot</Text>
                  <Text style={styles.plotText}>{selectedMovie.Plot}</Text>

                  <Text style={styles.sectionHeadline}>Director</Text>
                  <Text style={styles.castText}>{selectedMovie.Director}</Text>

                  <Text style={styles.sectionHeadline}>Cast</Text>
                  <Text style={styles.castText}>{selectedMovie.Actors}</Text>
                </View>

                <TouchableOpacity
                  style={styles.watchBtn}
                  onPress={() => handleWatchNow(selectedMovie.imdbID)}
                >
                  <Text style={styles.watchBtnText}>Watch Now</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  if (checkingAuth) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#00E5FF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <>
              <Stack.Screen name="Login">
                {(props) => <LoginScreen {...props} onLoginSuccess={checkUser} />}
              </Stack.Screen>
              <Stack.Screen name="Signup">
                {(props) => <SignupScreen {...props} onSignupSuccess={checkUser} />}
              </Stack.Screen>
            </>
          ) : (
            <Stack.Screen name="Home">
              {(props) => <HomeScreen {...props} user={user} onLogout={handleLogout} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const getPosterUrl = (url) => {
  if (!url || url === 'N/A') return 'https://via.placeholder.com/300x450?text=No+Poster';
  return url.replace('http://', 'https://');
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1116',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  accent: {
    color: '#00E5FF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,52,82,0.1)',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginHorizontal: 10,
    marginBottom: 15,
    marginTop: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    color: '#00E5FF',
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: height * 0.9,
    backgroundColor: '#161920',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    paddingBottom: 30,
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 5,
  },
  modalPoster: {
    width: '100%',
    height: height * 0.45,
  },
  detailsPayload: {
    padding: 25,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 15,
  },
  ratingText: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  metaText: {
    color: '#888',
    fontSize: 14,
  },
  sectionHeadline: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
  },
  genreText: {
    color: '#ddd',
    fontSize: 16,
  },
  plotText: {
    color: '#bbb',
    fontSize: 16,
    lineHeight: 24,
  },
  castText: {
    color: '#ddd',
    fontSize: 16,
  },
  watchBtn: {
    backgroundColor: '#00E5FF',
    marginHorizontal: 25,
    marginTop: 20,
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  watchBtnText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },
});
