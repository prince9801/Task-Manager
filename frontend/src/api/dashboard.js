import API from './axios';

export const getStats = () => API.get('/dashboard/stats');
