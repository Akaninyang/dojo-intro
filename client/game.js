/**
 * game.js - frontend engine for Stark Explorer
 *
 * Exports:
 *   - initGame(account, manifest)
 *   - updateFromEntitiesData(entities)
 *
 * spawn(account, manifest), move(account, manifest, direction), collect_coins(account, manifest)
 *
 * Collisions:
 *  - Coin collect -> collect_coins(account, manifest)
 *  - Asteroid hit -> spawn(account, manifest)  
 */

// =======================
// CONFIG
// =======================
// ==== CONFIG ====
const LANES = 3;
const LANE_POS = [16.5, 50, 83.5]; // % left positions
const ASTEROID_MIN_DELAY = 800;
const ASTEROID_MAX_DELAY = 1400;
const COIN_MIN_DELAY = 1800;
const COIN_MAX_DELAY = 3200;
const ASTEROID_FALL_TIME = 4200; // ms
const COIN_FALL_TIME = 3800; // ms

// ==== STATE ====
let accountRef = null;
let manifestRef = null;
let gameActive = false;
let currentLane = 1; // 0..2
let asteroidTimer = null;
let coinTimer = null;
let activeObjects = new Set();
let localLeaderboard = [];

// ==== DOM ====
const playfield = document.getElementById('playfield');
const ufo = document.getElementById('ufo');
const scoreDisplay = document.getElementById('score-display'); // small
const scoreBig = document.getElementById('score-big');         // big
const highDisplay = document.getElementById('high-score-display'); // small
const highBig = document.getElementById('high-big');               // big
const positionDisplay = document.getElementById('position-display');
const spawnBtn = document.getElementById('spawn-button');
const coinSound = document.getElementById('coinSound');
const crashSound = document.getElementById('crashSound');
const leaderboardEl = document.getElementById('leaderboard');

// ==== EXPORTS ====
export { initGame, updateFromEntitiesData, initStarfield };

// ==== HELPER ====
function randBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ==== STARFIELD ====
function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = canvas.width = innerWidth;
  let h = canvas.height = innerHeight;
  const stars = [];
  const STAR_COUNT = Math.floor((w * h) / 5000);

  function reset() {
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.2,
        speed: Math.random() * 0.4 + 0.05,
        alpha: 0.3 + Math.random() * 0.7
      });
    }
  }
  reset();
  window.addEventListener('resize', reset);

  function step() {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > h) s.y = 0;
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ==== ON-CHAIN SCORE UPDATES ====
const NAMESPACE = 'Stark_Explorer_Game';
const SCORE_MODEL = 'Coins';
const ACTIONS_CONTRACT = 'Stark_Explorer_Game-actions';

function updateFromEntitiesData(entities) {
  entities.forEach((entity) => {
    if (!entity.models) return;

    if (entity.models[NAMESPACE][SCORE_MODEL]) {
      const coins = entity.models[NAMESPACE][SCORE_MODEL];
      updateScoreDisplay(coins.score);
      updateHighScoreDisplay(coins.high_score);
      updateLocalLeaderboard(coins.high_score);
    }
  });
}

function updateScoreDisplay(score) {
  if (scoreDisplay) scoreDisplay.textContent = `Coins: ${score}`;
  if (scoreBig) scoreBig.textContent = score;
}

function updateHighScoreDisplay(highScore) {
  if (highDisplay) highDisplay.textContent = `High Score: ${highScore}`;
  if (highBig) highBig.textContent = highScore;
}

function updateLocalLeaderboard(highScore) {
  if (typeof highScore !== 'number' && typeof highScore !== 'string') return;
  const scoreNum = Number(highScore);
  const key = 'stark_explorer_local_leaderboard_v1';
  try {
    const raw = localStorage.getItem(key);
    let list = raw ? JSON.parse(raw) : [];
    const meIndex = list.findIndex(i => i.name === 'You');
    if (meIndex >= 0) {
      if (list[meIndex].score < scoreNum) list[meIndex].score = scoreNum;
    } else {
      list.push({ name: 'You', score: scoreNum });
    }
    list = list.sort((a, b) => b.score - a.score).slice(0, 5);
    localStorage.setItem(key, JSON.stringify(list));
    renderLeaderboard(list);
  } catch (e) {
    console.warn('leaderboard update fail', e);
  }
}

function renderLeaderboard(list) {
  if (!leaderboardEl) return;
  leaderboardEl.innerHTML = '';
  if (list.length === 0) {
    leaderboardEl.innerHTML = `<div class="muted">No scores yet — collect some coins!</div>`;
    return;
  }
  list.forEach((row, idx) => {
    const el = document.createElement('div');
    el.className = 'leader';
    el.innerHTML = `<div><div class="name">${idx + 1}. ${row.name}</div><div class="score">${row.score}</div></div>`;
    leaderboardEl.appendChild(el);
  });
}

// ==== SPAWN / COLLECT ====
async function spawn(account, manifest) {
  if (!account || !manifest) return;
  try {
    const tx = await account.execute({
      contractAddress: manifest.contracts.find(c => c.tag === ACTIONS_CONTRACT).address,
      entrypoint: 'spawn',
      calldata: [],
    });
    console.log('Spawn tx sent:', tx);
  } catch (e) {
    console.error('spawn fail', e);
  }
}

async function collectCoins(account, manifest) {
  if (!account || !manifest) return;
  try {
    const tx = await account.execute([{
      contractAddress: manifest.contracts.find(c => c.tag === ACTIONS_CONTRACT).address,
      entrypoint: 'collect_coins',
      calldata: [],
    }]);
    console.log('Collect coins tx sent:', tx);
  } catch (e) {
    console.error('collect_coins fail', e);
  }
}

// ==== GAME ENGINE ====
function initGame(account, manifest) {
  accountRef = account;
  manifestRef = manifest;

  if (spawnBtn) {
    spawnBtn.disabled = false;
    spawnBtn.onclick = () => spawn(accountRef, manifestRef);
  }

  currentLane = 1;
  moveUfoToLane(currentLane);

  window.addEventListener('keydown', handleKeyDown);

  startSpawning();
}

// Frontend-only movement
function handleKeyDown(e) {
  if (e.key === 'ArrowLeft' && currentLane > 0) {
    currentLane--;
    moveUfoToLane(currentLane);
  } else if (e.key === 'ArrowRight' && currentLane < LANES - 1) {
    currentLane++;
    moveUfoToLane(currentLane);
  }
}

function moveUfoToLane(laneIndex) {
  const leftPercent = LANE_POS[laneIndex];
  ufo.style.left = `${leftPercent}%`;
  if (positionDisplay) positionDisplay.textContent = `Lane (${laneIndex})`;
}

// ==== SPAWNING ====
let objCounter = 0;

function startSpawning() {
  stopSpawning();
  gameActive = true;
  scheduleNextAsteroid();
  scheduleNextCoin();
}

function stopSpawning() {
  gameActive = false;
  if (asteroidTimer) clearTimeout(asteroidTimer);
  if (coinTimer) clearTimeout(coinTimer);
  activeObjects.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
  activeObjects.clear();
}

function scheduleNextAsteroid() {
  if (!gameActive) return;
  asteroidTimer = setTimeout(() => {
    spawnAsteroid();
    scheduleNextAsteroid();
  }, randBetween(ASTEROID_MIN_DELAY, ASTEROID_MAX_DELAY));
}

function scheduleNextCoin() {
  if (!gameActive) return;
  coinTimer = setTimeout(() => {
    spawnCoin();
    scheduleNextCoin();
  }, randBetween(COIN_MIN_DELAY, COIN_MAX_DELAY));
}

// ==== COLLISION DETECTION ====
function checkCollision(obj) {
  if (!ufo || !obj) return false;

  const ufoRect = ufo.getBoundingClientRect();
  const objRect = obj.getBoundingClientRect();

  return !(
    ufoRect.top > objRect.bottom ||
    ufoRect.bottom < objRect.top ||
    ufoRect.left > objRect.right ||
    ufoRect.right < objRect.left
  );
}

// ==== COLLISION HANDLERS ====
function handleAsteroidCollision(asteroid, interval) {
  clearInterval(interval);
  asteroid.remove();
  activeObjects.delete(asteroid.id);

  if (crashSound) crashSound.play();

  // Stop game and show Game Over
  stopSpawning();
  if (scoreBig) scoreBig.textContent = 'GAME OVER';
  if (scoreDisplay) scoreDisplay.textContent = 'Game Over';
  alert('You hit an asteroid! Game Over.');
}

function handleCoinCollision(coin, interval) {
  clearInterval(interval);
  coin.remove();
  activeObjects.delete(coin.id);

  if (coinSound) coinSound.play();

  // Increment local score
  let currentScore = parseInt(scoreBig.textContent) || 0;
  currentScore += 1;
  updateScoreDisplay(currentScore);
  updateHighScoreDisplay(Math.max(currentScore, parseInt(highBig.textContent) || 0));
}

// ==== OBJECT SPAWNING ====
function spawnAsteroid() {
  const lane = randBetween(0, LANES - 1);
  const id = `asteroid-${++objCounter}`;
  const el = document.createElement('div');
  el.className = 'asteroid';
  el.id = id;
  const size = randBetween(36, 62);
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  const jitter = (Math.random() - 0.5) * 10;
  el.style.left = `${LANE_POS[lane] + jitter}%`;
  el.style.animationDuration = `${ASTEROID_FALL_TIME + randBetween(-200, 200)}ms`;
  playfield.appendChild(el);
  activeObjects.add(id);

  const interval = setInterval(() => {
    if (!document.getElementById(id)) return clearInterval(interval);
    if (checkCollision(el)) handleAsteroidCollision(el, interval);
  }, 50);

  el.addEventListener('animationend', () => {
    el.remove();
    activeObjects.delete(id);
    clearInterval(interval);
  });
}

function spawnCoin() {
  if (!gameActive) return;

  const lane = randBetween(0, LANES - 1);
  const id = `coin-${++objCounter}`;

  const coin = document.createElement('div');
  coin.id = id;
  coin.className = 'coin';

  // size and position
  coin.style.width = '28px';
  coin.style.height = '28px';
  const laneCenter = LANE_POS[lane];
  const jitter = (Math.random() - 0.5) * 8;
  coin.style.left = `${laneCenter + jitter}%`;
  coin.style.top = '-40px';

  // animation
  const fallTime = COIN_FALL_TIME + randBetween(-200, 400);
  coin.style.transition = `transform ${fallTime}ms linear`;
  playfield.appendChild(coin);
  activeObjects.add(id);

  // move coin to bottom
  requestAnimationFrame(() => {
    coin.style.transform = `translateY(${playfield.clientHeight + 40}px)`;
  });

  // collision check
  const interval = setInterval(() => {
    if (!document.getElementById(id)) {
      clearInterval(interval);
      activeObjects.delete(id);
      return;
    }
    if (checkCollision(coin)) {
      handleCoinCollision(coin, interval);
    }
  }, 80);

  // remove when animation finishes
  setTimeout(() => {
    if (document.getElementById(id)) {
      coin.remove();
      activeObjects.delete(id);
    }
    clearInterval(interval);
  }, fallTime + 50);

  // schedule next coin
  if (gameActive) {
    const delay = randBetween(COIN_MIN_DELAY, COIN_MAX_DELAY);
    coinTimer = setTimeout(spawnCoin, delay);
  }
}