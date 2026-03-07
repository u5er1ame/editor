
import Room from './RoomGroup.svelte';
import Board from './BoardGroup.svelte';
import Breaker from './Breaker.svelte';
import RootBreaker from './RootBreaker.svelte';

import RwRoom from './rewrite/Room.svelte';
import RwBoard from './rewrite/Board.svelte';
import RwBreaker from './rewrite/Breaker.svelte';

export default { Room, Board, Breaker, RootBreaker };


export const Rewrite = {
    Room: RwRoom,
    Board: RwBoard,
    Breaker: RwBreaker
};
