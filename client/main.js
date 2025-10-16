import Controller from '@cartridge/controller';
import { init, ToriiQueryBuilder, KeysClause } from '@dojoengine/sdk';
import controllerOpts from './controller.js';
import { initGame, updateFromEntitiesData, initStarfield } from './game.js';

      import manifest from './manifest_sepolia.json' assert { type: 'json' };

    //const manifest = await fetch('./manifest_sepolia.json').then(res => res.json());

      const DOMAIN_SEPERATOR = {
        name: 'Stark_Explorer',
        version: '1.0',
        chainId: '0x534e5f5345504f4c4941',
        revision: '1',
      };

      async function run(account) {
        const torii = await init({
          client: {
            worldAddress: manifest.world.address,
            toriiUrl: import.meta.env.VITE_PUBLIC_TORII,
          },
          domain: DOMAIN_SEPERATOR,
        });

        initGame(account, manifest);

        // Subscribe to model updates
        const [_, subscription] = await torii.subscribeEntityQuery({
          query: new ToriiQueryBuilder().withClause(
            KeysClause(['Stark_Explorer_Game-Position', 'Stark_Explorer_Game-Coins'], [account.address], 'FixedLen').build(),
          ),
          callback: ({ data, error }) => {
            if (data) {
              updateFromEntitiesData(data);
            }
            if (error) {
              console.error(error);
            }
          },
        });

        // Unsubscribe on window exit
        window.addEventListener('beforeunload', () => {
          if (subscription) {
            subscription.cancel();
          }
        });
      }

      const controller = new Controller(controllerOpts);

      document.getElementById('controller-button').onclick = async () => {
      try {
        console.log("Connecting to Cartridge...");
        const account = await controller.connect();

        if (!account) {
          throw new Error("No account returned from Cartridge");
        }

        console.log("Connected to Cartridge:", account.address);

        // Now safely start your visuals
        initStarfield();

        const connectBtn = document.getElementById('controller-button');
        connectBtn.textContent = 'Connected';
        connectBtn.style.backgroundColor = '#4CAF50';

        document.getElementById('spawn-button').disabled = false;

        // 🔹 Wait a bit before running game logic (ensures popup fully closes)
        setTimeout(() => {
          run(account).catch((error) => console.error("Game error:", error));
        }, 500);
      } catch (error) {
        console.error('Failed to connect:', error);
        const connectBtn = document.getElementById('controller-button');
        connectBtn.textContent = 'Connection Failed';
        connectBtn.style.backgroundColor = '#f44336';
      }
    };