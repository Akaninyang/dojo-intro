use starknet::ContractAddress;
use crate::models::Direction;
use dojo::prelude::*;

#[starknet::interface]
pub trait IActions<T> {
    fn spawn(ref self: T, new_score: u64);
    fn move(ref self: T, direction: Direction);
}

//Events
    #[dojo::event]
    #[derive(Copy, Drop, Serde)]
    pub struct Spawned {
        #[key]
        player: ContractAddress,
        new_x: u8,
        new_z: u8,
        present_score: u64,
    }

    #[dojo::event]
    #[derive(Copy, Drop, Serde)]
    pub struct Moved {
        #[key]
        player: ContractAddress,
        new_x: u8,
        new_z: u8,
    }

    #[dojo::event]
    #[derive(Copy, Drop, Serde)]
    pub struct HighScoreUpdated {
        #[key]
        player: ContractAddress,
        high_score: u64,
    }

#[dojo::contract]
pub mod actions {
    use dojo::prelude::*;
    use super::{IActions, Spawned, Moved, HighScoreUpdated};
    use crate::models::{Direction, Position, VoyageScore, PositionTrait};
    use dojo::model::ModelStorage;
    // use core::array::{ArrayTrait, Array};
    use dojo::event::EventStorage;

    pub const INIT_POSITION: u8 = 1; //start in middle lane, ground level

    #[abi(embed_v0)]
    impl ActionsImpl of IActions<ContractState> {
        fn spawn(ref self: ContractState, new_score: u64) {
            let mut world = self.world_default();

            let player = starknet::get_caller_address();

            let position = Position {
                player,
                x: INIT_POSITION,
                z: INIT_POSITION,
            };

            world.write_model(@position);

            let mut voyage_score: VoyageScore = world.read_model(player);

            if voyage_score.score == 0 && voyage_score.high_score == 0 {
                voyage_score = VoyageScore {
                    player,
                    score: 0,
                    high_score: 0,
                };
            }

            voyage_score.score = new_score;

            if voyage_score.score > voyage_score.high_score {
                    voyage_score.high_score = voyage_score.score;

                    world.emit_event( @HighScoreUpdated { 
                    player, 
                    high_score: voyage_score.high_score, 
                });
            }

            voyage_score.score = 0;

            world.write_model(@voyage_score);

            //Emit Spawned event
            world.emit_event( @Spawned { 
                player, 
                new_x: position.x, 
                new_z: position.z, 
                present_score: voyage_score.score,
             });
        }

        fn move(ref self: ContractState, direction: Direction) {
            let mut world = self.world_default();

            let player = starknet::get_caller_address();

            let mut position: Position = world.read_model(player);
            position.apply_direction(direction);

            world.write_model(@position);

            //Emit Moved event
            world.emit_event( @Moved { 
                player, 
                new_x: position.x, 
                new_z: position.z 
            });
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"Stark_Explorer_Game")
        }
    }
}