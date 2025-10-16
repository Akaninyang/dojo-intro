use starknet::ContractAddress;
use core::num::traits::{SaturatingAdd, SaturatingSub};

#[derive(Serde, Copy, Drop, Introspect)]
pub enum Direction {
    #[default]
    Middle,
    Left,
    Right,
    //Up,
    //Down,
}

#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
pub struct Position {
    #[key]
    pub player: ContractAddress,
    pub x: u8, //0 for left lane, 1 for middle lane, 2 for right lane
    //pub z: u8, //0 for down, 1 for ground-level, 2 for up
}

#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
pub struct Coins {
    #[key]
    pub player: ContractAddress,
    pub score: u64,
    pub high_score: u64,
}

#[generate_trait]
pub impl PositionImpl of PositionTrait {
    fn apply_direction(ref self: Position, direction: Direction) {
        match direction {
            Direction::Left => { if self.x>0 {self.x = self.x.saturating_sub(1)} },
            Direction::Right => { if self.x<2 {self.x = self.x.saturating_add(1)} },
            //Direction::Up => { self.z = 2 },
            //Direction::Down => { self.z = 0 },
            Direction::Middle => { self.x = 1 },
        }
    }
}
