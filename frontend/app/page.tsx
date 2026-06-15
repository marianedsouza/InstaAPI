'use client';
import React, { useState } from 'react';

export default function Home() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('pt-BR');
  };

  const handleAnalyze = async () => {
    if (!username) return;
    setLoading(true);
    setData(null);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        alert(result.error || 'Erro ao buscar perfil');
      } else {
        setData(result);
      }
    } catch (error) {
      alert('Erro na conexão com a API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">InstaAPI Dashboard</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h2 className="text-xl font-semibold mb-4">Analyze Profile</h2>
          <div className="flex gap-4">
            <input 
              type="text" 
              placeholder="@username" 
              className="flex-1 p-3 border rounded-md"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <button 
              className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-50"
              onClick={handleAnalyze}
              disabled={loading || !username}
            >
              {loading ? 'Analisando...' : 'Analyze'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12 text-gray-500">
            Processando análise com Inteligência Artificial...
          </div>
        )}

        {data && !loading && (
          <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 border rounded-lg p-6 bg-white shadow-sm flex flex-col items-center text-center">
              {data.profilePicUrl ? (
                <img src={`/api/image?url=${encodeURIComponent(data.profilePicUrl)}`} alt={data.username} referrerPolicy="no-referrer" className="w-24 h-24 rounded-full mb-4 object-cover" />
              ) : (
                <div className="w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
              )}
              <h3 className="font-bold text-lg">@{data.username}</h3>
              <p className="text-gray-500 text-sm">{data.fullName}</p>
              
              <div className="flex gap-4 mt-4 w-full justify-center text-center">
                <div>
                  <p className="font-bold">{formatNumber(data.followers)}</p>
                  <p className="text-xs text-gray-500">Followers</p>
                </div>
                <div>
                  <p className="font-bold">{formatNumber(data.following)}</p>
                  <p className="text-xs text-gray-500">Following</p>
                </div>
                <div>
                  <p className="font-bold">{formatNumber(data.posts)}</p>
                  <p className="text-xs text-gray-500">Posts</p>
                </div>
              </div>
            </div>
            
            <div className="col-span-2 border rounded-lg p-6 bg-white shadow-sm">
              <h3 className="font-bold text-lg mb-4">AI Analysis (Baseado na Bio e Posts)</h3>
              <div className="space-y-4">
                <div>
                  <span className="font-medium">Niche:</span> {data.niche}
                </div>
                <div>
                  <span className="font-medium">Tone of Voice:</span> {data.tone}
                </div>
                <div>
                  <span className="font-medium">Target Audience:</span> {data.audience}
                </div>
              </div>
            </div>
          </div>
          
          {data.latestPosts && data.latestPosts.length > 0 && (
            <div className="border rounded-lg p-6 bg-white shadow-sm">
              <h3 className="font-bold text-lg mb-4">Últimos Posts e Reels</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {data.latestPosts.map((post: any) => (
                  <div key={post.id} className="relative group overflow-hidden rounded-lg border">
                    <img src={`/api/image?url=${encodeURIComponent(post.displayUrl)}`} alt="Post" className="w-full h-48 object-cover group-hover:opacity-75 transition-opacity" referrerPolicy="no-referrer" />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 text-xs rounded font-bold">
                      {post.type === 'Video' ? 'Reel' : 'Post'}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 text-xs truncate">
                      ❤️ {formatNumber(post.likes)} | 💬 {formatNumber(post.comments)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}