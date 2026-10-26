import { createClient } from '@supabase/supabase-js';
import {
  AdminSettings,
  DepositRecord,
  Round,
  UserBet,
  UserProfile,
  WithdrawalRequest,
} from '../types';

export const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://slibenbmosftqyozhyto.supabase.co';
export const supabaseKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_R5bspy3ytWGVLfvI9sobZA_pTcDYQaz';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Service to sync app state with Supabase cloud database.
 * Every operation safely catches errors so if specific tables or policies
 * are not yet created in the Supabase instance, the application falls back
 * smoothly to local state without interrupting gameplay.
 */
class SupabaseSyncService {
  private client = supabase;
  private isConnected = true;

  public getClient() {
    return this.client;
  }

  /**
   * Upload user avatar to Supabase Storage 'avatars' bucket.
   * Path matches the RLS policy:
   * auth.uid()::text = (storage.foldername(name))[1]
   * i.e. `${userId}/${fileName}`
   */
  public async uploadAvatar(
    userId: string,
    file: File | Blob,
    customName?: string
  ): Promise<{ publicUrl: string | null; error: string | null }> {
    try {
      const cleanUserId = userId || 'anonymous';
      const ext =
        file instanceof File ? file.name.split('.').pop() || 'png' : 'png';
      const fileName = customName || `avatar_${Date.now()}.${ext}`;
      const filePath = `${cleanUserId}/${fileName}`;

      const { error: uploadError } = await this.client.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type || 'image/png',
        });

      if (uploadError) {
        console.warn('Supabase storage avatars upload:', uploadError.message);
        return { publicUrl: null, error: uploadError.message };
      }

      const { data } = this.client.storage.from('avatars').getPublicUrl(filePath);
      return { publicUrl: data.publicUrl, error: null };
    } catch (err: any) {
      console.warn('Storage upload error:', err);
      return { publicUrl: null, error: err?.message || 'Storage upload error' };
    }
  }

  /**
   * Sync Profile in public.profiles table (username, display_name, avatar_url)
   */
  public async syncProfile(profile: {
    id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.client.from('profiles').upsert({
        id: profile.id,
        username: profile.username || null,
        display_name: profile.display_name || null,
        avatar_url: profile.avatar_url || null,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('Supabase syncProfile:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  /**
   * Fetch profile from public.profiles
   */
  public async getProfile(userId: string): Promise<{
    id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  } | null> {
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) return null;
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Supabase Auth: Register new user with email & password and initial profile
   */
  public async signUpWithEmail(
    email: string,
    password: string,
    profileData?: {
      username?: string;
      display_name?: string;
      avatar_url?: string;
      referral_code?: string;
    }
  ): Promise<{ user: any; error: string | null }> {
    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: profileData?.username,
            display_name: profileData?.display_name,
            avatar_url: profileData?.avatar_url,
          },
        },
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        await this.syncProfile({
          id: data.user.id,
          username: profileData?.username,
          display_name: profileData?.display_name,
          avatar_url: profileData?.avatar_url,
        });
      }

      return { user: data.user, error: null };
    } catch (err: any) {
      return { user: null, error: err?.message || 'Registration failed' };
    }
  }

  /**
   * Supabase Auth: Sign in with email & password
   */
  public async signInWithEmail(
    email: string,
    password: string
  ): Promise<{ user: any; error: string | null }> {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      return { user: data.user, error: null };
    } catch (err: any) {
      return { user: null, error: err?.message || 'Login failed' };
    }
  }

  /**
   * Supabase Auth: Sign out
   */
  public async signOut(): Promise<void> {
    try {
      await this.client.auth.signOut();
    } catch {
      // Ignore
    }
  }

  /**
   * Supabase Auth: Get current session user
   */
  public async getCurrentAuthUser(): Promise<any> {
    try {
      const { data } = await this.client.auth.getUser();
      return data?.user || null;
    } catch {
      return null;
    }
  }

  // 1. Sync User Bet to Supabase
  public async recordBet(bet: UserBet): Promise<void> {
    try {
      const { error } = await this.client.from('bets').upsert({
        id: bet.id,
        round_id: bet.roundId,
        coin: bet.coin,
        side: bet.side,
        amount: bet.amount,
        entry_price: bet.entryPrice,
        exit_price: bet.exitPrice || null,
        status: bet.status,
        payout: bet.payout || 0,
        user_identifier: bet.userIdentifier,
        source: bet.source,
        created_at: new Date(bet.timestamp).toISOString(),
      });
      if (error) {
        // Table might not exist yet or RLS policy, silently continue
      }
    } catch {
      // Offline or network error
    }
  }

  // 2. Sync Settled Round
  public async recordRound(round: Round): Promise<void> {
    try {
      const { error } = await this.client.from('rounds').upsert({
        id: round.id,
        coin: round.coin,
        duration: round.duration,
        entry_price: round.entryPrice,
        exit_price: round.exitPrice || null,
        start_time: new Date(round.startTime).toISOString(),
        end_time: new Date(round.endTime).toISOString(),
        status: round.status,
        up_pool: round.upPool,
        down_pool: round.downPool,
        winning_side: round.winningSide || null,
        provably_fair_hash: round.provablyFairHash,
        server_seed: round.serverSeed,
        client_seed: round.clientSeed,
      });
      if (error) {
        // Table may not exist yet
      }
    } catch {
      // Non-blocking
    }
  }

  // 3. Sync User Profile / Balance
  public async syncUser(user: UserProfile): Promise<void> {
    try {
      const { error } = await this.client.from('users').upsert({
        id: user.id,
        email: user.email,
        balance: user.balance,
        wallet_balance: user.walletBalance,
        referral_code: user.referralCode,
        referral_earnings: user.referralEarnings,
        total_bets_placed: user.totalBetsPlaced,
        total_won_amount: user.totalWonAmount,
        total_lost_amount: user.totalLostAmount,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        // Non-blocking
      }
    } catch {
      // Non-blocking
    }
  }

  // 4. Sync Deposit Record
  public async recordDeposit(deposit: DepositRecord): Promise<void> {
    try {
      const { error } = await this.client.from('deposits').upsert({
        id: deposit.id,
        user_id: deposit.userId,
        amount: deposit.amount,
        network: deposit.network,
        address: deposit.address,
        tx_hash: deposit.txHash,
        status: deposit.status,
        created_at: new Date(deposit.createdAt).toISOString(),
      });
      if (error) {
        // Non-blocking
      }
    } catch {
      // Non-blocking
    }
  }

  // 5. Sync Withdrawal Request
  public async recordWithdrawal(withdrawal: WithdrawalRequest): Promise<void> {
    try {
      const { error } = await this.client.from('withdrawals').upsert({
        id: withdrawal.id,
        user_id: withdrawal.userId,
        user_address: withdrawal.userAddress,
        amount: withdrawal.amount,
        fee: withdrawal.fee,
        net_amount: withdrawal.netAmount,
        network: withdrawal.network,
        status: withdrawal.status,
        created_at: new Date(withdrawal.createdAt).toISOString(),
      });
      if (error) {
        // Non-blocking
      }
    } catch {
      // Non-blocking
    }
  }

  // 6. Sync Admin Settings
  public async syncSettings(settings: AdminSettings): Promise<void> {
    try {
      const { error } = await this.client.from('settings').upsert({
        id: 'global_settings',
        house_commission: settings.houseCommission,
        withdrawal_fee: settings.withdrawalFee,
        min_bet: settings.minBet,
        max_bet: settings.maxBet,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        // Non-blocking
      }
    } catch {
      // Non-blocking
    }
  }
}

export const supabaseSync = new SupabaseSyncService();
export default supabase;
