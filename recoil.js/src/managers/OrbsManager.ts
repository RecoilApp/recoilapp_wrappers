/**
 * @module recoil.js/managers/OrbsManager
 * Manage Orbs currency — balances, transactions, daily claims and earning rules.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';

// ── API response shapes ───────────────────────────────────────────────────────

export interface OrbsBalance {
  balance: number;
  lifetime_earned: number;
  last_daily_claim: string | null;
}

export interface OrbsTransaction {
  id: string;
  amount: number;
  type: 'earn' | 'spend' | 'refund' | 'admin';
  source: string;
  item_id: string | null;
  item_name: string | null;
  description: string | null;
  created_at: string;
}

export interface OrbsTransactionList {
  transactions: OrbsTransaction[];
  total: number;
}

export interface DailyClaimResult {
  claimed: boolean;
  orbs_earned: number;
  streak_days: number;
  streak_bonus: number;
  balance: number;
  lifetime_earned: number;
}

export interface DailyStatus {
  claimable: boolean;
  next_claim_at?: string;
}

export interface OrbsEarningRule {
  id: string;
  label: string;
  orbs_amount: number;
  cooldown_seconds: number | null;
  daily_cap: number | null;
}

// ── Manager ───────────────────────────────────────────────────────────────────

export class OrbsManager {
  private readonly client: RecoilClient;

  constructor(client: RecoilClient) {
    this.client = client;
  }

  /**
   * Fetch the authenticated bot's Orbs balance.
   */
  async getBalance(): Promise<OrbsBalance> {
    return this.client.rest.get('/orbs/balance') as Promise<OrbsBalance>;
  }

  /**
   * Fetch the authenticated bot user's transaction history.
   * @param limit  Max results (1–100, default 20)
   * @param offset Pagination offset (default 0)
   */
  async getTransactions(limit = 20, offset = 0): Promise<OrbsTransactionList> {
    return this.client.rest.get(
      `/orbs/transactions?limit=${limit}&offset=${offset}`
    ) as Promise<OrbsTransactionList>;
  }

  /**
   * Check whether the daily reward is claimable right now.
   */
  async checkDaily(): Promise<DailyStatus> {
    return this.client.rest.get('/orbs/daily') as Promise<DailyStatus>;
  }

  /**
   * Claim the daily Orbs reward.
   */
  async claimDaily(): Promise<DailyClaimResult> {
    return this.client.rest.post('/orbs/daily', {}) as Promise<DailyClaimResult>;
  }

  /**
   * Fetch all active Orb earning rules.
   */
  async getEarningRules(): Promise<OrbsEarningRule[]> {
    return this.client.rest.get('/orbs/earning-rules') as Promise<OrbsEarningRule[]>;
  }
}
