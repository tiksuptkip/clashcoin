import React, { useState } from 'react';
import { SecretAdmin } from '../components/SecretAdmin';
import { storage } from '../services/storage';
import { CoinSymbol, Round } from '../types';

export default function AdminPage() {
  const [subRoute, setSubRoute] = useState<'/mainadminsamjordan' | '/admin' | '/admin/dashboard'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
      const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '').replace(/\/+$/, '');
      if (path.includes('mainadminsamjordan') || hash.includes('mainadminsamjordan')) {
        return '/mainadminsamjordan';
      }
      if (path === '/admin/dashboard' || hash === 'admin/dashboard') {
        return '/admin/dashboard';
      }
    }
    return '/mainadminsamjordan';
  });

  const [settings, setSettings] = useState(storage.getSettings());
  const [user, setUser] = useState(storage.getUser());
  const [withdrawals, setWithdrawals] = useState(storage.getWithdrawals());
  const [deposits, setDeposits] = useState(storage.getDeposits());
  const [isPaused, setIsPaused] = useState(false);

  const handleNavigate = (route: '/mainadminsamjordan' | '/admin' | '/admin/dashboard' | '/admincashsport' | '/') => {
    if (route === '/') {
      window.location.href = '/';
    } else if (route === '/admincashsport') {
      window.location.href = '/admincashsport';
    } else {
      setSubRoute(route);
      window.history.pushState(null, '', route);
    }
  };

  const allRoundsList: Round[] = (['BTC', 'ETH', 'SOL', 'BNB', 'XRP'] as CoinSymbol[]).map((c) =>
    storage.getRound(c)
  );

  return (
    <SecretAdmin
      currentSubRoute={subRoute}
      onNavigate={handleNavigate}
      settings={settings}
      onUpdateSettings={(newSettings) => {
        const updated = storage.updateSettings(newSettings);
        setSettings({ ...updated });
      }}
      user={user}
      onUpdateUserBalance={(newBal) => {
        const updated = storage.updateUser({ balance: Number(newBal.toFixed(2)) });
        setUser({ ...updated });
      }}
      rounds={allRoundsList}
      isRoundsPaused={isPaused}
      onToggleRoundsPaused={() => setIsPaused(!isPaused)}
      withdrawals={withdrawals}
      deposits={deposits}
      onApproveWithdrawal={(id) => {
        storage.approveWithdrawal(id);
        setWithdrawals([...storage.getWithdrawals()]);
      }}
      onRejectWithdrawal={(id) => {
        storage.rejectWithdrawal(id);
        setUser(storage.getUser());
        setWithdrawals([...storage.getWithdrawals()]);
      }}
      onApproveDeposit={(id) => {
        storage.approveDeposit(id);
        setUser(storage.getUser());
        setDeposits([...storage.getDeposits()]);
      }}
      onRejectDeposit={(id) => {
        storage.rejectDeposit(id);
        setDeposits([...storage.getDeposits()]);
      }}
    />
  );
}
