import axios from 'axios';

const API_KEY = '497b9768';
const BASE_URL = 'https://www.omdbapi.com/';

export const searchMovies = async (query) => {
    try {
        const response = await axios.get(`${BASE_URL}?s=${query}&apikey=${API_KEY}`);
        return response.data;
    } catch (error) {
        console.error('Error searching movies:', error);
        throw error;
    }
};

export const getMovieDetails = async (id) => {
    try {
        const response = await axios.get(`${BASE_URL}?i=${id}&apikey=${API_KEY}`);
        return response.data;
    } catch (error) {
        console.error('Error getting movie details:', error);
        throw error;
    }
};
