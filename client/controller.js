/**
 * Setups controller options:
 * https://docs.cartridge.gg/controller/getting-started
 *
 * This example uses Katana for local host development.
 */
import { provider } from 'starknet';
import manifest from '../contracts/manifest_dev.json' assert { type: 'json' };

const actionsContract = manifest.contracts.find(
  (contract) => contract.tag === 'Stark_Hunter_Game-actions'
);

const controllerOpts = {
  chains: [{ rpcUrl: 'http://localhost:5050' }],
  // "KATANA"
  defaultChainId: '0x4b4154414e41',

  policies: {
    contracts: {
      [actionsContract.address]: {
        name: 'Actions',
        description: 'Actions contract to control the player movement',
        methods: [
          {
            name: 'Spawn',
            entrypoint: 'spawn',
            description: 'Spawn the player in the game',
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