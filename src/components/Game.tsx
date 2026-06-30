import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 720;
const BIRD_SIZE = 36;
const BIRD_START_X = 120;
const BIRD_START_Y = (CANVAS_HEIGHT - BIRD_SIZE) / 2;
const PIPE_WIDTH = 80;
const PIPE_GAP = 190;
const PIPE_SPEED = 2.2;
const PIPE_MIN_HEIGHT = 120;
const PIPE_HEIGHT_RANGE = 320;
const GRAVITY = 0.24;
const JUMP_VELOCITY = -4.2;
const PIPE_SPAWN_SPACING = 320;
const PIPE_START_OFFSET = 300;
const PIPE_RESPAWN_OFFSET = 240;
const FLOOR_HEIGHT = 100;
const FLOOR_BORDER_HEIGHT = 16;
const PIPE_CAP_HEIGHT = 20;
const OVERLAY_PADDING = 40;
const OVERLAY_HEIGHT = 140;
const OVERLAY_Y_OFFSET = 70;
const SCORE_TEXT_X = 22;
const SCORE_TEXT_Y = 52;

const randomPipeHeight = () => PIPE_MIN_HEIGHT + Math.random() * PIPE_HEIGHT_RANGE;

const playTickleSound = () => {
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const makePulse = (frequency: number, start: number) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + 0.18);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(ctx.currentTime + start);
        oscillator.stop(ctx.currentTime + start + 0.18);
    };

    makePulse(580, 0);
    makePulse(430, 0.08);
    setTimeout(() => ctx.close(), 400);
};

const defaultPipes = [
    { x: 520, y: randomPipeHeight() },
    { x: 760, y: randomPipeHeight() },
    { x: 1000, y: randomPipeHeight() }
];

type Pipe = { x: number; y: number };
type GameState = "start" | "running" | "gameover";

type GameContextType = {
    gameState: GameState;
    score: number;
    startGame: () => void;
    performJump: () => void;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = (): GameContextType => {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error("useGame must be used within GameProvider");
    return ctx;
};

export default function Game() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const gameContainerRef = useRef<HTMLDivElement | null>(null);
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<GameState>("start");
    const chicken = useRef({ x: BIRD_START_X, y: BIRD_START_Y, vy: 0 });
    const gravity = useRef(GRAVITY);
    const animationRef = useRef(0);
    const scoreRef = useRef(0);
    const pipesRef = useRef<Pipe[]>([]);
    const isAlive = useRef(true);

    const isTouch = useState(() => {
        if (typeof window === "undefined") return false;
        return (
            ("ontouchstart" in window) ||
            navigator.maxTouchPoints > 0 ||
            (window.matchMedia && window.matchMedia("(pointer: coarse)").matches)
        );
    })[0];

    const overlayText = useMemo(() => {
        if (gameState === "start") return isTouch ? "DOKUNARAK BAŞLA" : "SPACE İLE BAŞLA";
        if (gameState === "gameover") return isTouch ? "OYUN BİTTİ - DOKUNARAK TEKRAR" : "OYUN BİTTİ - SPACE İLE TEKRAR";
        return "";
    }, [gameState, isTouch]);

    const performJump = () => {
        if (!isAlive.current) return;
        chicken.current.vy = JUMP_VELOCITY;
        playTickleSound();
    };

    const enterFullscreen = () => {
        try {
            const el = gameContainerRef.current ?? canvasRef.current ?? document.documentElement;
            if (el && (el as any).requestFullscreen) {
                (el as any).requestFullscreen().catch(() => {});
            }
        } catch {}
    };

    const startGame = () => {
        scoreRef.current = 0;
        setScore(0);
        const startX = CANVAS_WIDTH + PIPE_START_OFFSET;
        pipesRef.current = defaultPipes.map((p, index) => ({ x: startX + index * PIPE_SPAWN_SPACING, y: randomPipeHeight() }));
        chicken.current = { x: BIRD_START_X, y: BIRD_START_Y, vy: 0 };
        gravity.current = GRAVITY;
        isAlive.current = true;
        setGameState("running");
        enterFullscreen();
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.code !== "Space") return;
            event.preventDefault();
            if (gameState !== "running") startGame();
            performJump();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [gameState]);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resizeCanvasForDisplay = () => {
            const dpr = window.devicePixelRatio || 1;
            const cssWidth = canvas.clientWidth;
            const cssHeight = canvas.clientHeight;
            canvas.width = Math.round(cssWidth * dpr);
            canvas.height = Math.round(cssHeight * dpr);
            const scaleX = cssWidth / CANVAS_WIDTH;
            const scaleY = cssHeight / CANVAS_HEIGHT;
            const scale = Math.min(scaleX, scaleY);
            const offsetX = (cssWidth - CANVAS_WIDTH * scale) / 2;
            const offsetY = (cssHeight - CANVAS_HEIGHT * scale) / 2;
            const tx = Math.round(offsetX * dpr);
            const ty = Math.round(offsetY * dpr);
            ctx.setTransform(dpr * scale, 0, 0, dpr * scale, tx, ty);
        };

        resizeCanvasForDisplay();
        window.addEventListener("resize", resizeCanvasForDisplay);

        const drawScene = () => {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.clip();

            const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
            gradient.addColorStop(0, "#a1d8ff");
            gradient.addColorStop(1, "#e6f4ff");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            const sunGradient = ctx.createRadialGradient(380, 80, 10, 380, 80, 80);
            sunGradient.addColorStop(0, "#fff9c4");
            sunGradient.addColorStop(1, "#ffd54f");
            ctx.fillStyle = sunGradient;
            ctx.beginPath();
            ctx.arc(380, 80, 70, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#ffffffcc";
            ctx.beginPath();
            ctx.ellipse(120, 85, 45, 22, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(180, 120, 55, 24, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#74c24d";
            ctx.fillRect(0, CANVAS_HEIGHT - FLOOR_HEIGHT, CANVAS_WIDTH, FLOOR_HEIGHT);
            ctx.fillStyle = "#53912d";
            ctx.fillRect(0, CANVAS_HEIGHT - FLOOR_HEIGHT - FLOOR_BORDER_HEIGHT, CANVAS_WIDTH, FLOOR_BORDER_HEIGHT);

            ctx.fillStyle = "#ffcf6a";
            ctx.beginPath();
            ctx.ellipse(chicken.current.x + BIRD_SIZE / 2, chicken.current.y + BIRD_SIZE / 2, BIRD_SIZE / 2, BIRD_SIZE / 2.4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ff8c00";
            ctx.beginPath();
            ctx.ellipse(chicken.current.x + BIRD_SIZE / 2, chicken.current.y + 18, 16, 11, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.ellipse(chicken.current.x + 18, chicken.current.y + 14, 7, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#000";
            ctx.beginPath();
            ctx.arc(chicken.current.x + 20, chicken.current.y + 14, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#d52b1e";
            ctx.beginPath();
            ctx.moveTo(chicken.current.x + 14, chicken.current.y - 4);
            ctx.lineTo(chicken.current.x + 22, chicken.current.y - 24);
            ctx.lineTo(chicken.current.x + 28, chicken.current.y - 6);
            ctx.fill();

            ctx.fillStyle = "#ffb84d";
            ctx.beginPath();
            ctx.moveTo(chicken.current.x + 30, chicken.current.y + 22);
            ctx.lineTo(chicken.current.x + 46, chicken.current.y + 20);
            ctx.lineTo(chicken.current.x + 34, chicken.current.y + 28);
            ctx.fill();

            if (gameState === "running") {
                pipesRef.current.forEach((pipe) => {
                    if (pipe.x + PIPE_WIDTH < 0 || pipe.x > CANVAS_WIDTH) return;
                    ctx.fillStyle = "#2f8e44";
                    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.y);
                    ctx.fillStyle = "#1f5f31";
                    ctx.fillRect(pipe.x, pipe.y - PIPE_CAP_HEIGHT, PIPE_WIDTH, PIPE_CAP_HEIGHT);
                    ctx.fillStyle = "#2f8e44";
                    ctx.fillRect(pipe.x, pipe.y + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.y - PIPE_GAP - FLOOR_HEIGHT);
                    ctx.fillStyle = "#1f5f31";
                    ctx.fillRect(pipe.x, pipe.y + PIPE_GAP, PIPE_WIDTH, PIPE_CAP_HEIGHT);
                });
            }

            ctx.fillStyle = "#ffffff";
            ctx.font = "32px Poppins, sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(`Puan: ${scoreRef.current}`, SCORE_TEXT_X, SCORE_TEXT_Y);

            if (overlayText) {
                ctx.fillStyle = "rgba(0,0,0,0.65)";
                ctx.fillRect(OVERLAY_PADDING, CANVAS_HEIGHT / 2 - OVERLAY_Y_OFFSET, CANVAS_WIDTH - OVERLAY_PADDING * 2, OVERLAY_HEIGHT);
                ctx.fillStyle = "#fff";
                ctx.textAlign = "center";
                ctx.font = "28px Poppins, sans-serif";
                ctx.fillText(overlayText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            }
            ctx.restore();
        };

        const step = () => {
            if (gameState !== "running") {
                drawScene();
                animationRef.current = requestAnimationFrame(step);
                return;
            }

            chicken.current.vy += gravity.current;
            chicken.current.y += chicken.current.vy;

            if (chicken.current.y + BIRD_SIZE > CANVAS_HEIGHT - FLOOR_HEIGHT || chicken.current.y < 0) {
                isAlive.current = false;
            }

            let nextPipes = pipesRef.current.map((pipe) => ({ x: pipe.x - PIPE_SPEED, y: pipe.y }));
            if (nextPipes[0].x + PIPE_WIDTH < 0) {
                nextPipes = nextPipes.slice(1);
                nextPipes.push({ x: nextPipes[nextPipes.length - 1].x + PIPE_RESPAWN_OFFSET, y: randomPipeHeight() });
            }

            nextPipes.forEach((pipe) => {
                if (chicken.current.x + BIRD_SIZE > pipe.x && chicken.current.x < pipe.x + PIPE_WIDTH) {
                    if (chicken.current.y < pipe.y || chicken.current.y + BIRD_SIZE > pipe.y + PIPE_GAP) {
                        isAlive.current = false;
                    }
                }
                if (pipe.x + PIPE_WIDTH < chicken.current.x && pipe.x + PIPE_WIDTH > chicken.current.x - PIPE_SPEED) {
                    scoreRef.current += 1;
                    setScore(scoreRef.current);
                }
            });

            if (!isAlive.current) {
                setGameState("gameover");
            }

            pipesRef.current = nextPipes;
            drawScene();
            animationRef.current = requestAnimationFrame(step);
        };

        drawScene();
        animationRef.current = requestAnimationFrame(step);
        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener("resize", resizeCanvasForDisplay);
        };
    }, [gameState, overlayText]);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (gameState !== "running") {
            startGame();
        }
        performJump();
    };

    const handleFullscreenButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        enterFullscreen();
        if (gameState !== "running") {
            startGame();
        }
    };

    return (
        <GameContext.Provider value={{ gameState, score, startGame, performJump }}>
            <div ref={gameContainerRef} className="canvas-wrap" onPointerDown={handlePointerDown} onClick={(e) => e.preventDefault()}>
                <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
                {isTouch && gameState !== "running" && (
                    <button
                        type="button"
                        className="fullscreen-button"
                        onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onClick={handleFullscreenButtonClick}
                    >
                        Tam ekran oyna
                    </button>
                )}
                {gameState !== "running" && !overlayText && (
                    <div className="touch-hint">{isTouch ? "Dokunarak başla" : "Oyna: boşluk tuşuna bas veya ekrana tıkla"}</div>
                )}
            </div>
        </GameContext.Provider>
    );
}
