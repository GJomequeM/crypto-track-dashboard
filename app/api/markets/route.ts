// app/api/markets/route.ts
export async function GET() {
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1',
        {
          next: { revalidate: 30 },  // ← Se actualiza cada 30 segundos
        }
      );
  
      if (!res.ok) {
        throw new Error('Error CoinGecko');
      }
  
      const data = await res.json();
      return Response.json(data);
    } catch (error) {
      return Response.json({ error: 'No se pudieron cargar los datos' }, { status: 500 });
    }
  }