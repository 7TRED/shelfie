export default async function handler(req, res) {
  // Get the endpoint and other parameters from the query string
  const { endpoint, ...params } = req.query;
  
  const apiKey = process.env.TMDB_API_KEY;
  const baseUrl = 'https://api.themoviedb.org/3';

  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint is required' });
  }

  // Construct the query string for TMDB
  const queryString = new URLSearchParams({
    api_key: apiKey,
    ...params,
  }).toString();

  const url = `${baseUrl}/${endpoint}?${queryString}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
        return res.status(response.status).json({ error: 'TMDB API Error' });
    }

    const data = await response.json();
    
    // Set cache control for better performance (cache for 1 hour)
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}