import test from 'node:test';
import assert from 'node:assert';
import { tournamentService } from './tournamentService';
import { storage } from './storage';
import { UserProfile } from '../types';

test('tournamentService loads realistic seeded crypto tournaments', () => {
  const tournaments = tournamentService.resetAllTournaments();
  assert.ok(tournaments.length >= 4, 'Should have at least 4 tournaments');

  const btcSlam = tournaments.find((t) => t.id === 'tour_btc_slam');
  assert.ok(btcSlam, 'BTC Grand Slam should exist');
  assert.strictEqual(btcSlam?.coin, 'BTC');
  assert.strictEqual(btcSlam?.maxParticipants, 8);
  assert.strictEqual(btcSlam?.currency, 'JOD');
  assert.strictEqual(btcSlam?.prizeDistribution.first, 60);
  assert.strictEqual(btcSlam?.prizeDistribution.second, 25);
  assert.strictEqual(btcSlam?.prizeDistribution.thirdFourth, 15);
});

test('joinTournament enforces isolated currency balance and deducts entry fee', () => {
  tournamentService.resetAllTournaments();

  const mockUser: UserProfile = {
    id: 'usr_test_tourney',
    email: 'tourney@clash.com',
    username: 'test_trader',
    display_name: 'Test Trader',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=trader',
    country: 'JO',
    currency: 'JOD',
    currencyBalances: { JOD: 50, EGP: 500, USDT: 100 },
    balance: 50,
    walletBalance: 50,
    referralCode: 'CLASH123',
    referralEarnings: 0,
    totalBetsPlaced: 0,
    totalWonAmount: 0,
    totalLostAmount: 0,
    createdAt: Date.now(),
  };

  storage.updateUser(mockUser);

  // Initial JOD balance is 50
  assert.strictEqual(storage.getCurrencyBalances().JOD, 50);

  // Join BTC Slam (Entry fee = 10 JOD)
  const res = tournamentService.joinTournament('tour_btc_slam', mockUser);
  assert.strictEqual(res.success, true);
  assert.ok(res.tournament);
  assert.strictEqual(res.tournament?.userRegistered, true);
  assert.strictEqual(res.tournament?.registeredCount, 7); // was 6, now 7

  // JOD balance should now be 40 (isolated debit)
  assert.strictEqual(storage.getCurrencyBalances().JOD, 40);
  // EGP and USDT balances must be untouched
  assert.strictEqual(storage.getCurrencyBalances().EGP, 500);
  assert.strictEqual(storage.getCurrencyBalances().USDT, 100);

  // Attempting to join again should be rejected
  const resDuplicate = tournamentService.joinTournament('tour_btc_slam', mockUser);
  assert.strictEqual(resDuplicate.success, false);
});

test('submitMatchPrediction records user direction pick (UP/DOWN)', () => {
  tournamentService.resetAllTournaments();
  const mockUser: UserProfile = {
    id: 'usr_pred_test',
    email: 'p@c.com',
    username: 'p_user',
    display_name: 'Predictor',
    country: 'JO',
    currency: 'JOD',
    currencyBalances: { JOD: 100, EGP: 0, USDT: 0 },
    balance: 100,
    walletBalance: 100,
    referralCode: 'P1',
    referralEarnings: 0,
    totalBetsPlaced: 0,
    totalWonAmount: 0,
    totalLostAmount: 0,
    createdAt: Date.now(),
  };

  storage.updateUser(mockUser);
  tournamentService.joinTournament('tour_btc_slam', mockUser);

  const t = tournamentService.getTournamentById('tour_btc_slam');
  assert.ok(t);
  const match1 = t?.matches[0];
  assert.ok(match1);

  const predRes = tournamentService.submitMatchPrediction('tour_btc_slam', match1.id, 'UP', 67500);
  assert.strictEqual(predRes.success, true);
  assert.strictEqual(predRes.matchup?.livePrediction?.p1Choice, 'UP');
});

test('advanceMatchOutcome advances winners through single elimination tree', () => {
  tournamentService.resetAllTournaments();
  const t = tournamentService.getTournamentById('tour_sol_roller');
  assert.ok(t);

  // tour_sol_roller has round 1 completed and semifinal live matches
  const semiMatch = t.matches.find((m) => m.roundNumber === 2 && m.matchIndex === 0);
  assert.ok(semiMatch);
  assert.strictEqual(semiMatch.status, 'LIVE');

  const winnerPlayerId = semiMatch.player1?.id;
  assert.ok(winnerPlayerId);

  const advRes = tournamentService.advanceMatchOutcome(t.id, semiMatch.id, winnerPlayerId);
  assert.strictEqual(advRes.success, true);
  assert.strictEqual(advRes.matchup?.status, 'COMPLETED');
  assert.strictEqual(advRes.matchup?.winnerId, winnerPlayerId);

  // Check that winner advanced to Grand Final (round 3)
  const finalMatch = advRes.tournament?.matches.find((m) => m.roundNumber === 3);
  assert.strictEqual(finalMatch?.player1?.id, winnerPlayerId);
});
