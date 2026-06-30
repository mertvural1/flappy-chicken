export type GameState = "start" | "running" | "gameover";

export interface Pipe {
    x: number;
    y: number;
}

export interface Cloud {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface GameContextType {
    gameState: GameState;
    score: number;
    startGame: () => void;
    performJump: () => void;
}
