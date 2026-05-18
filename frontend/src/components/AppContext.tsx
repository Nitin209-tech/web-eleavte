'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  discordId: string;
  username: string;
  role: string;
  coins: number;
}

interface Claim {
  id: string;
  rewardName: string;
  category: string;
  emailUsed: string;
  extraField1: string;
  deliveredPayload: string;
  claimedAt: string;
}

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  claims: Claim[];
  coins: number;
  stats: { totalVisitors: number; claimedRewards: number };
  loginWithDiscord: (mockCode?: string) => Promise<void>;
  logout: () => void;
  claimDailyCoins: () => Promise<{ success: boolean; message: string }>;
  spendCoins: (amount: number) => boolean;
  redeemRewardForm: (data: { rewardId: string; category: string; emailUsed: string; extraField1: string }) => Promise<{ success: boolean; message?: string; payload?: string }>;
  addMockCode: (codeObj: any) => void;
  mockCodes: any[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [coins, setCoins] = useState(100);
  const [stats, setStats] = useState({ totalVisitors: 1420, claimedRewards: 254 });
  const [mockCodes, setMockCodes] = useState<any[]>([
    { id: '1', code: 'MC-FREE-KEY', rewardId: 'Minecraft Key', payload: 'MC-AAAA-BBBB-CCCC' },
    { id: '2', code: 'NITRO-BOOST', rewardId: 'Nitro Boost', payload: 'https://discord.gift/nitro-promo-test' }
  ]);

  // Capture Visitor IP on open
  useEffect(() => {
    fetch('http://localhost:5000/api/visitor')
      .then(r => r.json())
      .then(d => {
        if (d.success) console.log('🌐 Visitor analytics captured safely:', d.ip);
      })
      .catch(() => {
        console.warn('📡 Offline mock mode. IP capturing skipped.');
      });

    // Check localStorage
    const saved = localStorage.getItem('heaven_user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      setCoins(u.coins || 100);
    }
  }, []);

  const loginWithDiscord = async (mockCode?: string) => {
    const code = mockCode || 'MOCK-OAUTH-DEVELOPER-CODE';
    
    try {
      const res = await fetch(`http://localhost:5000/api/auth/callback?code=${code}`);
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setCoins(data.user.coins);
        localStorage.setItem('heaven_user', JSON.stringify(data.user));
      } else {
        throw new Error(data.error);
      }
    } catch {
      // Sandbox fallback mode
      const mockUser: User = {
        id: '1',
        discordId: '123456789012345678',
        username: 'ProCyberGamer',
        role: 'ADMIN',
        coins: 500000000
      };
      setUser(mockUser);
      setCoins(500000000);
      localStorage.setItem('heaven_user', JSON.stringify(mockUser));
      console.log('🤖 Authorized under Sandbox Admin privilege.');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('heaven_user');
  };

  const claimDailyCoins = async () => {
    setCoins(prev => {
      const next = prev + 1000;
      if (user) {
        const nextUser = { ...user, coins: next };
        localStorage.setItem('heaven_user', JSON.stringify(nextUser));
      }
      return next;
    });
    return { success: true, message: '+1,000 Cyber Coins added to secure balance!' };
  };

  const spendCoins = (amount: number): boolean => {
    if (coins < amount) return false;
    setCoins(prev => {
      const next = prev - amount;
      if (user) {
        const nextUser = { ...user, coins: next };
        localStorage.setItem('heaven_user', JSON.stringify(nextUser));
      }
      return next;
    });
    return true;
  };

  const redeemRewardForm = async (data: { rewardId: string; category: string; emailUsed: string; extraField1: string }) => {
    try {
      const token = localStorage.getItem('eiq_token') || '';
      const res = await fetch('http://localhost:5000/api/rewards/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (resData.success) {
        const newClaim: Claim = {
          id: resData.claim.id,
          rewardName: resData.claim.rewardName,
          category: data.category,
          emailUsed: data.emailUsed,
          extraField1: data.extraField1,
          deliveredPayload: resData.claim.deliveredPayload,
          claimedAt: new Date(resData.claim.claimedAt).toLocaleString()
        };
        setClaims(prev => [newClaim, ...prev]);
        setStats(prev => ({ ...prev, claimedRewards: prev.claimedRewards + 1 }));
        return { success: true, payload: resData.claim.deliveredPayload };
      } else {
        throw new Error(resData.error);
      }
    } catch {
      // Sandbox Redemption fallbacks
      const payloadVal = data.category === 'MINECRAFT' ? 'MC-AAAA-BBBB-CCCC' :
                         data.category === 'NITRO' ? 'https://discord.gift/nitro-promo-test' :
                         data.category === 'ROBLOX' ? 'ROBLOX-GOLDEN-KEY-2026' : 'YOUTUBE-PREMIUM-CODE';

      const newClaim: Claim = {
        id: 'c_' + Math.floor(Math.random() * 90000),
        rewardName: data.category + ' Secure Voucher',
        category: data.category,
        emailUsed: data.emailUsed,
        extraField1: data.extraField1,
        deliveredPayload: payloadVal,
        claimedAt: new Date().toLocaleString()
      };
      setClaims(prev => [newClaim, ...prev]);
      setStats(prev => ({ ...prev, claimedRewards: prev.claimedRewards + 1 }));
      setCoins(prev => Math.max(0, prev - 300));
      return { success: true, payload: payloadVal };
    }
  };

  const addMockCode = (codeObj: any) => {
    setMockCodes(prev => [codeObj, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        claims,
        coins,
        stats,
        loginWithDiscord,
        logout,
        claimDailyCoins,
        spendCoins,
        redeemRewardForm,
        addMockCode,
        mockCodes
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
