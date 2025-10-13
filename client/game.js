/**
 * Game logic.
 *
 * Updates the UI by parsing Torii responses.
 * Sends transactions to the chain using controller account.
 */

// import { loadEnv } from "vite";

const NAMESPACE = 'Stark_Hunter_Game';
const POSITION_MODEL = 'Position';
const COINS_MODEL = 'Coins';

const ACTIONS_CONTRACT = 'Stark_Hunter_Game-actions';

function updateFromEntitiesData(entities) {
  entities.forEach((entity) => {
    updateFromEntityData(entity);
  });
}

function updateFromEntityData(entity) {
  if (entity.models) {
    if (entity.models[NAMESPACE][POSITION_MODEL]) {
      const position = entity.models[NAMESPACE][POSITION_MODEL];
      updatePositionDisplay(position.x, position.z);
    }

    if (entity.models[NAMESPACE][COINS_MODEL]) {
      const coins = entity.models[NAMESPACE][COINS_MODEL];
      updateCoinsDisplay(coins.coin_count);
    }
  }
}

function updatePositionDisplay(x, z) {
  const positionDisplay = document.getElementById('position-display');
  if (positionDisplay) {
    positionDisplay.textContent = `Lane, Vertical State(${x}, ${z})`;
  }
}

function updateCoinsDisplay(coins) {
  const coinsDisplay = document.getElementById('coins-display');
  if (coinsDisplay) {
    coinsDisplay.textContent = `Coins Collected: ${coins}`;
  }
}

// Generates a random integer between min and max (inclusive)
// function getRandomIntInclusive(min, max) {
//   min = Math.ceil(min);
//   max = Math.floor(max);
//   return Math.floor(Math.random() * (max - min + 1)) + min;
//   }
// const randomObstacleLane = getRandomIntInclusive(0, 2);
// const randomObstacleHeight = getRandomIntInclusive(0, 2); // Generates a random lane between 0 and 2 (inclusive)


function initGame(account, manifest) {
  document.getElementById('up-button').onclick = async () => {
    await move(account, manifest, 'Up');
  };
  document.getElementById('right-button').onclick = async () => {
    await move(account, manifest, 'Right');
  };
  document.getElementById('down-button').onclick = async () => {
    await move(account, manifest, 'Down');
  };
  document.getElementById('left-button').onclick = async () => {
    await move(account, manifest, 'Left');
  };
  document.getElementById('collect-coins-button').onclick = async () => {
    await collect_coins(account, manifest);
  };
  // document.getElementById('reset-jump-slide-button').onclick = async () => {
  //   await jump_slide_reset(account, manifest);
  // };
  document.getElementById('obstacle-button').onclick = async () => {
    await spawn(account, manifest);
  };
  

  document.getElementById('spawn-button').onclick = async () => {
    await spawn(account, manifest);

    document.getElementById('up-button').disabled = false;
    document.getElementById('right-button').disabled = false;
    document.getElementById('down-button').disabled = false;
    document.getElementById('left-button').disabled = false;
    document.getElementById('collect-coins-button').disabled = false;
    // document.getElementById('reset-jump-slide-button').disabled = false;
    document.getElementById('obstacle-button').disabled = false;
  };
}

async function spawn(account, manifest) {
  const tx = await account.execute({
    contractAddress: manifest.contracts.find((contract) => contract.tag === ACTIONS_CONTRACT)
      .address,
    entrypoint: 'spawn',
    calldata: [],
  });

  console.log('Transaction sent:', tx);
}

async function move(account, manifest, direction) {
  let calldata;

  // Cairo serialization uses the variant index to determine the direction.
  // Refer to models.cairo in contracts folder.
  switch (direction) {
    case 'Middle':
      calldata = ['0'];
      break;
    case 'Left':
      calldata = ['1'];
      break;
    case 'Right':
      calldata = ['2'];
      break;
    case 'Up':
      calldata = ['3'];
      break;
    case 'Down':
      calldata = ['4'];
      break;
  }

  const tx = await account.execute({
    contractAddress: manifest.contracts.find((contract) => contract.tag === ACTIONS_CONTRACT)
      .address,
    entrypoint: 'move',
    calldata: calldata,
  });

  console.log('Transaction sent:', tx);
}

async function collect_coins(account, manifest) {
  let action_addr = manifest.contracts.find(
    (contract) => contract.tag === ACTIONS_CONTRACT,
  ).address;
  const tx = await account.execute([
    {
      contractAddress: action_addr,
      entrypoint: 'collect_coins',
      calldata: [],
    },
  ]);
  console.log('Transaction sent:', tx);
}

// async function jump_slide_reset(account, manifest) {
//   const tx = await account.execute({
//     contractAddress: manifest.contracts.find((contract) => contract.tag === ACTIONS_CONTRACT)
//       .address,
//     entrypoint: 'jump_slide_reset',
//     calldata: [],
//   });

//   console.log('Transaction sent:', tx);
// }

// async function collison_checker(account, manifest, lane, height) {
//   const tx = await account.execute({
//     contractAddress: manifest.contracts.find((contract) => contract.tag === ACTIONS_CONTRACT)
//       .address,
//     entrypoint: 'collison_checker',
//     calldata: [lane, height],
//   });

//   console.log('Transaction sent:', tx);
// }

export { initGame, updateFromEntitiesData };

