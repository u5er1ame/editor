import BasedRoom from './BasedRoom.svelte';
import BasedBoard from './BasedBoard.svelte';
import BasedBreaker from './BasedBreaker.svelte';
import BasedRootBreaker from './BasedRootBreaker.svelte';

import Room from './RoomGroup.svelte';
import Board from './BoardGroup.svelte';
import Breaker from './Breaker.svelte';
import RootBreaker from './RootBreaker.svelte';

import RwRoom from './rewrite/Room.svelte';
import RwBoard from './rewrite/Board.svelte';
import RwBreaker from './rewrite/Breaker.svelte';

export default { Room, Board, Breaker, RootBreaker };


export const Base = {
    Room: BasedRoom,
    Board: BasedBoard,
    Breaker: BasedBreaker,
    RootBreaker: BasedRootBreaker
};

export const Rewrite = {
    Room: RwRoom,
    Board: RwBoard,
    Breaker: RwBreaker
};
