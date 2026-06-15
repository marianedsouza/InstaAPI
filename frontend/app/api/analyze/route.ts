import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN || '',
});

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Call Apify Instagram Profile Scraper
    const input = {
      usernames: [username.replace('@', '')],
    };

    // Use a lightweight fast scraper or the official one
    const run = await apifyClient.actor('apify/instagram-profile-scraper').call(input);
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profileData: any = items[0];
    
    console.log("PROFILE DATA RECEIVED:", JSON.stringify(profileData, null, 2));

    // Extract posts to return to frontend
    const latestPosts = (profileData.latestPosts || []).slice(0, 6).map((post: any) => ({
      id: post.id,
      type: post.type,
      caption: post.caption,
      displayUrl: post.displayUrl,
      likes: post.likesCount,
      comments: post.commentsCount,
      videoUrl: post.videoUrl,
    }));

    // Simulated Gemini AI Analysis based on Profile Bio and Latest Posts Captions
    const bioText = profileData.biography?.toLowerCase() || '';
    const captionsText = latestPosts.map((p: any) => p.caption).join(' ').toLowerCase();
    const combinedText = bioText + " " + captionsText;
    
    let niche = 'Lifestyle e Entretenimento';
    if (combinedText.includes('dev') || combinedText.includes('code') || combinedText.includes('software') || combinedText.includes('tecnologia')) niche = 'Tecnologia e Programação';
    if (combinedText.includes('fitness') || combinedText.includes('gym') || combinedText.includes('treino')) niche = 'Saúde e Fitness';
    if (combinedText.includes('marketing') || combinedText.includes('business') || combinedText.includes('vendas')) niche = 'Marketing e Negócios';
    if (combinedText.includes('moda') || combinedText.includes('fashion')) niche = 'Moda e Estilo';
    if (combinedText.includes('política') || combinedText.includes('candidata') || combinedText.includes('vereadora') || combinedText.includes('prefeita')) niche = 'Política e Sociedade';
    
    let tone = 'Inspiracional e Dinâmico';
    if (niche === 'Tecnologia e Programação') tone = 'Técnico, Profissional e Educativo';
    if (niche === 'Marketing e Negócios') tone = 'Persuasivo, Autoritário e Empreendedor';
    if (niche === 'Saúde e Fitness') tone = 'Motivacional, Energético e Prático';
    if (niche === 'Política e Sociedade') tone = 'Formal, Engajado e Comunitário';
    
    let audience = 'Público Geral';
    if (niche === 'Tecnologia e Programação') audience = 'Estudantes e Profissionais de TI';
    if (niche === 'Marketing e Negócios') audience = 'Empreendedores e Profissionais de Marketing';
    if (niche === 'Política e Sociedade') audience = 'Cidadãos Locais e Eleitores';

    return NextResponse.json({
      username: profileData.username,
      fullName: profileData.fullName,
      biography: profileData.biography,
      profilePicUrl: profileData.profilePicUrl,
      followers: profileData.followersCount,
      following: profileData.followsCount,
      posts: profileData.postsCount || profileData.latestPosts?.length || 0,
      niche: niche,
      tone: tone,
      audience: audience,
      latestPosts: latestPosts
    });

  } catch (error: any) {
    console.error('Error analyzing profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
