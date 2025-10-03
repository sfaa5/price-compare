"use client"
import { useState } from 'react';

export default function Home() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  type ScrapedItem = { site: string; title?: string; price?: string; error?: string };
  type DataState = { scraped?: ScrapedItem[]; error?: string } | null;
  const [data, setData] = useState<DataState>(null);

  interface CompareRequest {
    query: string;
  }

  interface CompareResponse {
    scraped?: ScrapedItem[];
    error?: string;
  }

  async function handleSearch(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setData(null);
    try {
      const r = await fetch('/api/compare', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ query: q } as CompareRequest)
      });
      const json: CompareResponse = await r.json();
      setData(json);
    } catch (err) {
      setData({ error: typeof err === 'object' && err !== null && 'message' in err ? String((err as { message?: unknown }).message) : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{padding:20, fontFamily:'Arial, sans-serif', maxWidth:800, margin:'0 auto'}}>
      <h1>Price Compare (POC)</h1>
      <form onSubmit={handleSearch} style={{display:'flex', gap:8}}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Enter product name" style={{flex:1, padding:8}} />
        <button type="submit" disabled={loading} style={{padding:'8px 12px'}}>Search</button>
      </form>

      {loading && <p>Searching...</p>}

      {data && data.scraped && (
        <table style={{width:'100%', marginTop:12, borderCollapse:'collapse'}}>
          <thead>
            <tr>
              <th style={{textAlign:'left', borderBottom:'1px solid #ddd'}}>Site</th>
              <th style={{textAlign:'left', borderBottom:'1px solid #ddd'}}>Title</th>
              <th style={{textAlign:'left', borderBottom:'1px solid #ddd'}}>Price</th>
            </tr>
          </thead>
          <tbody>
            {data.scraped.map(s => (
              <tr key={s.site}>
                <td style={{padding:'8px 4px'}}>{s.site}</td>
                <td style={{padding:'8px 4px'}}>{s.title || '—'}</td>
                <td style={{padding:'8px 4px'}}>{s.price || s.error || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data && data.error && <p style={{color:'red'}}>{data.error}</p>}
    </main>
  );
}
