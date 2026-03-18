export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> }
  ) {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const days = searchParams.get('days') || '7';
  
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`,
      { cache: 'no-store' }
    );
  
    const text = await res.text();
    if (!text || text.trim() === '') {
      return Response.json({ error: 'Rate limit' }, { status: 429 });
    }
  
    const data = JSON.parse(text);
  
    // ✅ Formato YYYY-MM-DD obligatorio para Lightweight Charts
    const prices = data.prices.map(([timestamp, price]: [number, number]) => {
      const d = new Date(timestamp);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return {
        date: `${yyyy}-${mm}-${dd}`,   // ← formato correcto
        price: parseFloat(price.toFixed(2)),
      };
    });
  
    // ✅ Eliminar fechas duplicadas (Lightweight Charts no las acepta)
    const unique = Array.from(
      new Map(prices.map((p: any) => [p.date, p])).values()
    );
  
    return Response.json(unique);
  }