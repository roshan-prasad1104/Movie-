import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.44;

const getPosterUrl = (url) => {
    if (!url || url === 'N/A') return 'https://via.placeholder.com/300x450?text=No+Poster';
    return url.replace('http://', 'https://');
};

const MovieCard = ({ movie, onPress }) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
            <Image
                source={{ uri: getPosterUrl(movie.Poster) }}
                style={styles.poster}
                resizeMode="cover"
            />
            <View style={styles.overlay}>
                <View style={styles.infoContainer}>
                    <Text style={styles.title} numberOfLines={2}>
                        {movie.Title}
                    </Text>
                    <Text style={styles.year}>{movie.Year}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 1.5,
        margin: width * 0.02,
        borderRadius: 20,
        backgroundColor: '#1a1a1a',
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    poster: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '40%',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    infoContainer: {
        padding: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    title: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    year: {
        color: '#00E5FF',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default MovieCard;
