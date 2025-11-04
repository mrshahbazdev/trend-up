// ==================== WEB3 CONFIGURATION ====================

// Web3 Feature Toggle - Set to true to disable Web3 and use mock data
export const DISABLE_WEB3 = import.meta.env.VITE_DISABLE_WEB3 === 'true' || false;

// Mock wallet address for testing
export const MOCK_WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

// Mock Web3 data for when Web3 is disabled
export const MOCK_WEB3_DATA = {
  // Token info
  tokenBalance: '1000000000000000000000', // 1000 tokens (18 decimals)
  tokenName: 'TrendUp',
  tokenSymbol: 'TUP',
  tokenDecimals: 18,
  totalSupply: '100000000000000000000000000', // 100M tokens
  
  // Voting
  democraticVotesCount: 3,
  hodlVotingActive: false,
  userVotingPower: '1000000000000000000000', // 1000 tokens
  voteCooldown: 0, // No cooldown in mock
  
  // Democratic votes mock data
  democraticVotes: [
    {
      id: 0,
      title: 'Should we reduce transaction fees to 1%?',
      totalVotes: 150,
      votedYes: 95,
      votedNo: 55,
      expiryTimestamp: Math.floor(Date.now() / 1000) + 86400 * 5, // 5 days from now
    },
    {
      id: 1,
      title: 'Implement automatic liquidity provision?',
      totalVotes: 89,
      votedYes: 67,
      votedNo: 22,
      expiryTimestamp: Math.floor(Date.now() / 1000) + 86400 * 3, // 3 days from now
    },
    {
      id: 2,
      title: 'Enable token burning mechanism?',
      totalVotes: 200,
      votedYes: 120,
      votedNo: 80,
      expiryTimestamp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days from now
    },
  ],
  
  // Fees
  buyTeamFee: '3',
  sellTeamFee: '3',
  liquidityFee: '2',
  
  // HODL
  hodlActivationTimestamp: 0,
  isSaleRestricted: false,
};

// ==================== APP CONSTANTS ====================

export const mockNotifications = [
    {
        id: 1,
        avatar: "https://i.pravatar.cc/150?img=10",
        title: "Bitcoin crossed $60K!",
        description: "BTC is booming again. Check the market now.",
        time: "2 mins ago",
    },
    {
        id: 2,
        avatar: "https://i.pravatar.cc/150?img=15",
        title: "ETH gas fees dropped",
        description: "Now is a good time for some DeFi transactions.",
        time: "10 mins ago",
    },
    {
        id: 3,
        avatar: "https://i.pravatar.cc/150?img=7",
        title: "Solana transaction failed",
        description: "Retrying might help. Check your wallet.",
        time: "30 mins ago",
    },
    {
        id: 4,
        avatar: "https://i.pravatar.cc/150?img=9",
        title: "New proposal on your DAO",
        description: "Vote before 6 PM today to have your say.",
        time: "1 hour ago",
    },
];

export const emojiIcon= ["😀", "😂", "😍", "🤔", "👍", "👎", "❤️", "🔥", "💯", "😢", "😡", "🎉", "👏", "🙌", "💪", "🤝"];

export const users = [
    {
        id: "general",
        name: "# general",
        avatar: "/abstract-geometric-shapes.png",
        color: "#5865F2",
        status: "online",
    },
    {
        id: "alice",
        name: "Alice",
        avatar: "/alice-in-wonderland.png",
        color: "#ff6b6b",
        status: "online",
    },
    {
        id: "bob",
        name: "Bob",
        avatar: "/bob-portrait.png",
        color: "#4ecdc4",
        status: "away",
    },
    {
        id: "charlie",
        name: "Charlie",
        avatar: "/abstract-figure-charlie.png",
        color: "#45b7d1",
        status: "online",
    },
    {
        id: "david",
        name: "David",
        avatar: "/abstract-colorful-swirls.png",
        color: "#f39c12",
        status: "busy",
    },
    {
        id: "eve",
        name: "Eve",
        avatar: abstract_design_elements,
        color: "#e74c3c",
        status: "offline",
        lastSeen: new Date(Date.now() - 3600000),
    },
];

import abstract_design_elements from "../assets/images/abstract-design-elements.png"

// Initial conversations
export const initialConversations = [
    {
        userId: "general",
        unreadCount: 0,
        messages: [
            {
                id: "1",
                user: { name: "Alice", avatar: "/alice-in-wonderland.png", color: "#ff6b6b" },
                content: "Hey everyone! How's it going?",
                timestamp: new Date(Date.now() - 3600000),
                reactions: [
                    { emoji: "👋", count: 3, users: ["Bob", "Charlie", "David"] },
                    { emoji: "😊", count: 1, users: ["Bob"] },
                ],
            },
            {
                id: "2",
                user: { name: "Bob", avatar: "/bob-portrait.png", color: "#4ecdc4" },
                content: "Pretty good! Just working on some new features.",
                timestamp: new Date(Date.now() - 3000000),
                reactions: [{ emoji: "💪", count: 2, users: ["Alice", "Charlie"] }],
            },
            {
                id: "3",
                user: { name: "Charlie", avatar: "/abstract-figure-charlie.png", color: "#45b7d1" },
                content: "Check out this cool design I made!",
                timestamp: new Date(Date.now() - 1800000),
                reactions: [
                    { emoji: "🔥", count: 4, users: ["Alice", "Bob", "David", "Eve"] },
                    { emoji: "👏", count: 2, users: ["Alice", "David"] },
                ],
                attachments: [
                    { name: "design-mockup.png", url: abstract_design_elements, type: "image", size: 245760 },
                ],
            },
        ],
    },
    {
        userId: "alice",
        unreadCount: 2,
        messages: [
            {
                id: "alice-1",
                user: { name: "Alice", avatar: "/alice-in-wonderland.png", color: "#ff6b6b" },
                content: "Hey! How are you doing?",
                timestamp: new Date(Date.now() - 1800000),
                reactions: [],
            },
            {
                id: "alice-2",
                user: { name: "Alice", avatar: "/alice-in-wonderland.png", color: "#ff6b6b" },
                content: "I wanted to ask you about that project we discussed.",
                timestamp: new Date(Date.now() - 1200000),
                reactions: [],
            },
            {
                id: "alice-1-1",
                user: { name: "You", avatar: "/abstract-geometric-shapes.png", color: "#5865F2" },
                content: "Hey alice, how's the development going?",
                timestamp: new Date(Date.now() - 2400000),
                reactions: [],
            },{
                id: "alice-1-1",
                user: { name: "You", avatar: "/abstract-geometric-shapes.png", color: "#5865F2" },
                content: "Hey alice, how's the chat  going?",
                timestamp: new Date(Date.now() - 2500000),
                reactions: [],
            },
        ],
    },
    {
        userId: "bob",
        unreadCount: 0,
        messages: [
            {
                id: "bob-1",
                user: { name: "You", avatar: "/abstract-geometric-shapes.png", color: "#5865F2" },
                content: "Hey Bob, how's the development going?",
                timestamp: new Date(Date.now() - 2400000),
                reactions: [],
            },  {
                id: "bob-1",
                user: { name: "You", avatar: "/abstract-geometric-shapes.png", color: "#5865F2" },
                content: "Hey Bob, how's the development going?",
                timestamp: new Date(Date.now() - 2400000),
                reactions: [],
            },
            {
                id: "bob-2",
                user: { name: "Bob", avatar: "/bob-portrait.png", color: "#4ecdc4" },
                content: "Going well! Almost finished with the new features.",
                timestamp: new Date(Date.now() - 2100000),
                reactions: [{ emoji: "👍", count: 1, users: ["You"] }],
            },
        ],
    },
];


// ==================== SOCIAL CATEGORIES ====================

// Default categories for posts (matches backend post enums exactly)
export const DEFAULT_CATEGORIES = [
    {
        _id: 'general',
        name: 'General',
        description: 'General discussions and topics',
        color: '#3B82F6',
        isDefault: true,
        tags: ['general', 'discussion', 'chat'],
        keywords: ['general', 'discussion', 'chat', 'talk']
    },
    {
        _id: 'technology',
        name: 'Technology',
        description: 'Technology news, discussions, and innovations',
        color: '#10B981',
        tags: ['tech', 'technology', 'innovation', 'software'],
        keywords: ['technology', 'tech', 'software', 'hardware', 'innovation', 'ai', 'programming']
    },
    {
        _id: 'business',
        name: 'Business',
        description: 'Business news, entrepreneurship, and finance',
        color: '#F59E0B',
        tags: ['business', 'finance', 'entrepreneurship', 'startup'],
        keywords: ['business', 'finance', 'entrepreneurship', 'startup', 'investment', 'economy']
    },
    {
        _id: 'entertainment',
        name: 'Entertainment',
        description: 'Movies, music, games, and entertainment',
        color: '#EF4444',
        tags: ['entertainment', 'movies', 'music', 'games'],
        keywords: ['entertainment', 'movies', 'music', 'games', 'tv', 'celebrities', 'fun']
    },
    {
        _id: 'sports',
        name: 'Sports',
        description: 'Sports news, discussions, and updates',
        color: '#8B5CF6',
        tags: ['sports', 'fitness', 'athletics', 'competition'],
        keywords: ['sports', 'fitness', 'athletics', 'football', 'basketball', 'soccer', 'olympics']
    },
    {
        _id: 'science',
        name: 'Science',
        description: 'Scientific discoveries, research, and education',
        color: '#06B6D4',
        tags: ['science', 'research', 'education', 'discovery'],
        keywords: ['science', 'research', 'education', 'discovery', 'physics', 'chemistry', 'biology']
    },
    {
        _id: 'crypto_news',
        name: 'Crypto News',
        description: 'Latest cryptocurrency news and updates',
        color: '#F97316',
        tags: ['crypto', 'news', 'bitcoin', 'ethereum'],
        keywords: ['crypto', 'news', 'bitcoin', 'ethereum', 'blockchain', 'cryptocurrency', 'altcoin']
    },
    {
        _id: 'defi',
        name: 'DeFi',
        description: 'Decentralized Finance discussions and protocols',
        color: '#8B5CF6',
        tags: ['defi', 'yield', 'farming', 'liquidity'],
        keywords: ['defi', 'yield', 'farming', 'liquidity', 'protocols', 'tokens', 'staking']
    },
    {
        _id: 'nfts',
        name: 'NFTs',
        description: 'Non-Fungible Tokens and digital collectibles',
        color: '#EC4899',
        tags: ['nft', 'collectibles', 'art', 'digital'],
        keywords: ['nft', 'collectibles', 'art', 'digital', 'marketplace', 'opensea', 'minting']
    },
    {
        _id: 'trading_signals',
        name: 'Trading Signals',
        description: 'Trading signals, analysis, and market insights',
        color: '#10B981',
        tags: ['trading', 'signals', 'analysis', 'market'],
        keywords: ['trading', 'signals', 'analysis', 'market', 'technical', 'fundamental', 'charts']
    },
    {
        _id: 'market_analysis',
        name: 'Market Analysis',
        description: 'In-depth market analysis and research',
        color: '#3B82F6',
        tags: ['market', 'analysis', 'research', 'trends'],
        keywords: ['market', 'analysis', 'research', 'trends', 'forecast', 'prediction', 'insights']
    },
    {
        _id: 'memes',
        name: 'Memes',
        description: 'Crypto memes and humorous content',
        color: '#F59E0B',
        tags: ['memes', 'funny', 'humor', 'crypto'],
        keywords: ['memes', 'funny', 'humor', 'crypto', 'doge', 'shiba', 'comedy']
    },
    {
        _id: 'tutorials',
        name: 'Tutorials',
        description: 'Educational tutorials and guides',
        color: '#06B6D4',
        tags: ['tutorials', 'education', 'guides', 'learning'],
        keywords: ['tutorials', 'education', 'guides', 'learning', 'how-to', 'step-by-step', 'beginner']
    },
    {
        _id: 'ama',
        name: 'AMA',
        description: 'Ask Me Anything sessions and Q&A',
        color: '#EF4444',
        tags: ['ama', 'q&a', 'questions', 'answers'],
        keywords: ['ama', 'q&a', 'questions', 'answers', 'interview', 'discussion', 'community']
    },
    {
        _id: 'events',
        name: 'Events',
        description: 'Crypto events, conferences, and meetups',
        color: '#8B5CF6',
        tags: ['events', 'conferences', 'meetups', 'networking'],
        keywords: ['events', 'conferences', 'meetups', 'networking', 'summit', 'expo', 'gathering']
    }
];

// Category colors for consistent theming
export const CATEGORY_COLORS = {
    general: '#3B82F6',
    technology: '#10B981',
    business: '#F59E0B',
    entertainment: '#EF4444',
    sports: '#8B5CF6',
    science: '#06B6D4',
    crypto_news: '#F97316',
    defi: '#8B5CF6',
    nfts: '#EC4899',
    trading_signals: '#10B981',
    market_analysis: '#3B82F6',
    memes: '#F59E0B',
    tutorials: '#06B6D4',
    ama: '#EF4444',
    events: '#8B5CF6'
};

// Category icons (Material-UI icon names)
export const CATEGORY_ICONS = {
    general: 'ChatBubbleOutline',
    technology: 'Computer',
    business: 'Business',
    entertainment: 'Movie',
    sports: 'Sports',
    science: 'Science',
    crypto_news: 'Newspaper', // Uses existing NewspaperIcon
    defi: 'AccountBalance',
    nfts: 'Image', // Uses existing ImageIcon
    trading_signals: 'TrendingUp',
    market_analysis: 'Analytics',
    memes: 'Mood',
    tutorials: 'School',
    ama: 'QuestionAnswer',
    events: 'Event'
};

export const dummyPost =  [
    {
        id: 1,
        username: "CryptoNerd",
        userImage: "https://i.pravatar.cc/150?img=1",
        description: "Bitcoin is holding strong despite market volatility. Could a bull run be coming? 📈🚀 #Bitcoin",
        postImage: "https://images.pexels.com/photos/730564/pexels-photo-730564.jpeg",
        date: "2025-08-07",
        type: "post",
    },
    {
        id: 2,
        username: "EtherQueen",
        userImage: "https://i.pravatar.cc/150?img=2",
        description: "Ethereum’s gas fees drop as layer 2 adoption rises. Is it time to dive in? ⚙️🔥 #Ethereum",
        postImage: "https://images.pexels.com/photos/6771900/pexels-photo-6771900.jpeg",
        date: "2025-08-06",
        type: "poll",
    },
    {
        id: 3,
        username: "AltcoinDaily",
        userImage: "https://i.pravatar.cc/150?img=3",
        description: "Solana breaks past resistance. Is SOL ready to flip Ethereum? 🌊 #Solana #CryptoNews",
        postImage: "https://images.pexels.com/photos/30855424/pexels-photo-30855424.jpeg",
        date: "2025-08-05",
        type: "post",
    },
    {
        id: 4,
        username: "DeFiWizard",
        userImage: "https://i.pravatar.cc/150?img=4",
        description: "DeFi platforms are reshaping traditional banking. Which one do you trust most?",
        postImage: "https://images.pexels.com/photos/5980751/pexels-photo-5980751.jpeg",
        date: "2025-08-05",
        type: "post",
    },
    {
        id: 5,
        username: "StableSteve",
        userImage: "https://i.pravatar.cc/150?img=5",
        description: "USDT vs USDC — which stablecoin is your go-to for trading security? 💵🔐",
        postImage: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
        date: "2025-08-04",
        type: "poll",
    },
    {
        id: 6,
        username: "DegenDoge",
        userImage: "https://i.pravatar.cc/150?img=6",
        description: "Dogecoin just surged 12% on Elon’s tweet. Never underestimate meme power! 🐶🚀 #DOGE",
        postImage: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
        date: "2025-08-04",
        type: "poll",
    },
    {
        id: 7,
        username: "CryptoGuru",
        userImage: "https://i.pravatar.cc/150?img=7",
        description: "Which coin will dominate the AI + blockchain space in 2025? Cast your vote now! 🤖💰",
        postImage: "https://assets.coingecko.com/coins/images/13397/large/graph.png",
        date: "2025-08-03",
        type: "poll",
    },
    {
        id: 8,
        username: "NFT_Nancy",
        userImage: "https://i.pravatar.cc/150?img=8",
        description: "NFTs are more than JPEGs — they're smart contracts in disguise. 🎨💡 #NFTCommunity",
        postImage: "https://assets.coingecko.com/coins/images/12885/large/flow_logo.png",
        date: "2025-08-02",
        type: "post",
    },
    {
        id: 9,
        username: "LiteLegend",
        userImage: "https://i.pravatar.cc/150?img=9",
        description: "Litecoin halves again! Historically, this has triggered rallies. Will history repeat? ⛏️📉",
        postImage: "https://assets.coingecko.com/coins/images/2/large/litecoin.png",
        date: "2025-08-01",
        type: "post",
    },
    {
        id: 10,
        username: "XRPFanatic",
        userImage: "https://i.pravatar.cc/150?img=10",
        description: "XRP lawsuit nearly settled. Could this be the start of an explosive breakout? ⚖️🚀",
        postImage: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
        date: "2025-07-31",
        type: "poll",
    },
];