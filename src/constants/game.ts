import type { Cloud } from "../types";

export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 720;
export const BIRD_SIZE = 36;
export const BIRD_START_X = 120;
export const BIRD_START_Y = (CANVAS_HEIGHT - BIRD_SIZE) / 2;
export const PIPE_WIDTH = 80;
export const PIPE_GAP = 190;
export const PIPE_SPEED = 2.2;
export const PIPE_MIN_HEIGHT = 120;
export const PIPE_HEIGHT_RANGE = 320;
export const GRAVITY = 0.24;
export const JUMP_VELOCITY = -4.2;
export const PIPE_SPAWN_SPACING = 320;
export const PIPE_START_OFFSET = 300;
export const PIPE_RESPAWN_OFFSET = 240;
export const FLOOR_HEIGHT = 100;
export const FLOOR_BORDER_HEIGHT = 16;
export const PIPE_CAP_HEIGHT = 20;
export const OVERLAY_PADDING = 40;
export const OVERLAY_HEIGHT = 140;
export const OVERLAY_Y_OFFSET = 70;
export const SCORE_TEXT_X = 22;
export const SCORE_TEXT_Y = 52;
export const CHICKEN_ICON_URL = "https://img.icons8.com/?size=96&id=101707&format=png";
export const CLOUD_SPEED = 0.5;
export const START_TEXT = "START WITH SPACE";
export const TOUCH_START_TEXT = "TAP TO START";
export const GAME_OVER_TEXT = "GAME OVER";
export const TOUCH_GAME_OVER_TEXT = "GAME OVER - TAP TO RESTART";
export const FULLSCREEN_BUTTON_TEXT = "Play in fullscreen";
export const TOUCH_HINT_TEXT = "Tap to start";
export const KEYBOARD_HINT_TEXT = "Play: press the space bar or tap the screen";
export const SCORE_LABEL = "Score";

export const CLOUDS: Cloud[] = [
    { x: 80, y: 120, width: 70, height: 34 },
    { x: 250, y: 180, width: 92, height: 42 },
    { x: 380, y: 95, width: 64, height: 30 }
];

const createRandomPipeHeight = () => PIPE_MIN_HEIGHT + Math.random() * PIPE_HEIGHT_RANGE;

export const createDefaultPipes = () => [
    { x: 520, y: createRandomPipeHeight() },
    { x: 760, y: createRandomPipeHeight() },
    { x: 1000, y: createRandomPipeHeight() }
];
