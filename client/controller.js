/**
 * Setups controller options:
 */
import { provider } from 'starknet';
import manifest from '../contracts/manifest_dev.json' assert { type: 'json' };

const actionsContract = manifest.contracts.find(
  (contract) => contract.tag === 'Stark_Explorer_Game-actions'
);

const controllerOpts = {
  chains: [{ rpcUrl: 'https://api.cartridge.gg/x/starknet/sepolia' }],
  // "sepolia testnet"
  defaultChainId: '0x534e5f5345504f4c4941',

  policies: {
    contracts: {
      [actionsContract.address]: {
        name: 'Actions',
        description: 'Actions contract to control the player movement',
        methods: [
          {
            name: 'Spawn',
            entrypoint: 'spawn',
            description: 'Spawns the player, resets score, and displays high score in the game',
          },
          {
            name: 'Move',
            entrypoint: 'move',
            description: 'Move the player in the game',
          },
          {
            name: 'Collect Coins',
            entrypoint: 'collect_coins',
            description: 'Collects Coins',
          },
          // {
          //   name: 'Collision Checker',
          //   entrypoint: 'collision_checker',
          //   description: 'Checks for obstacle collisions',
          // },
          // {
          //   name: 'Jump/Slide Reset',
          //   entrypoint: 'jump_slide_reset',
          //   description: 'Reset Jump/Slide state to Ground',
          // },
        ],
      },
    },
  },
};

export default controllerOpts;