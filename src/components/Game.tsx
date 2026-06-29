import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 720;
const BIRD_SIZE = 36;
const PIPE_WIDTH = 80;
const PIPE_GAP = 190;
const PIPE_SPEED = 2.2;

const randomPipeHeight = () => 120 + Math.random() * 320;

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
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<GameState>("start");
    const chicken = useRef({ x: 120, y: CANVAS_HEIGHT / 2 - BIRD_SIZE / 2, vy: 0 });
    const gravity = useRef(0.24);
    const animationRef = useRef(0);
    const scoreRef = useRef(0);
    const pipesRef = useRef<Pipe[]>([]);
    const isAlive = useRef(true);

    const overlayText = useMemo(() => {
        if (gameState === "start") return "SPACE İLE BAŞLA";
        if (gameState === "gameover") return "OYUN BİTTİ - SPACE İLE TEKRAR";
        return "";
    }, [gameState]);

    const performJump = () => {
        if (!isAlive.current) return;
        chicken.current.vy = -4.2;
        playTickleSound();
    };

    const isTouch = useState(() => {
        if (typeof window === "undefined") return false;
        return (
            ("ontouchstart" in window) ||
            navigator.maxTouchPoints > 0 ||
            (window.matchMedia && window.matchMedia("(pointer: coarse)").matches)
        );
    })[0];

    const startGame = () => {
        scoreRef.current = 0;
        setScore(0);
        const spacing = 320;
        const startX = CANVAS_WIDTH + 300;
        pipesRef.current = defaultPipes.map((p, index) => ({ x: startX + index * spacing, y: randomPipeHeight() }));
        chicken.current = { x: 120, y: CANVAS_HEIGHT / 2 - BIRD_SIZE / 2, vy: 0 };
        gravity.current = 0.24;
        isAlive.current = true;
        setGameState("running");
        try {
            const el = canvasRef.current ?? document.documentElement;
            if (el && (el as any).requestFullscreen) {
                (el as any).requestFullscreen().catch(() => {});
            }
        } catch {}
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
            ctx.fillRect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);
            ctx.fillStyle = "#53912d";
            ctx.fillRect(0, CANVAS_HEIGHT - 108, CANVAS_WIDTH, 16);

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
                    ctx.fillRect(pipe.x, pipe.y - 20, PIPE_WIDTH, 20);
                    ctx.fillStyle = "#2f8e44";
                    ctx.fillRect(pipe.x, pipe.y + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.y - PIPE_GAP - 100);
                    ctx.fillStyle = "#1f5f31";
                    ctx.fillRect(pipe.x, pipe.y + PIPE_GAP, PIPE_WIDTH, 20);
                });
            }

            ctx.fillStyle = "#ffffff";
            ctx.font = "32px Poppins, sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(`Puan: ${scoreRef.current}`, 22, 52);

            if (overlayText) {
                ctx.fillStyle = "rgba(0,0,0,0.65)";
                ctx.fillRect(40, CANVAS_HEIGHT / 2 - 70, CANVAS_WIDTH - 80, 140);
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

            if (chicken.current.y + BIRD_SIZE > CANVAS_HEIGHT - 100 || chicken.current.y < 0) {
                isAlive.current = false;
            }

            let nextPipes = pipesRef.current.map((pipe) => ({ x: pipe.x - PIPE_SPEED, y: pipe.y }));
            if (nextPipes[0].x + PIPE_WIDTH < 0) {
                nextPipes = nextPipes.slice(1);
                nextPipes.push({ x: nextPipes[nextPipes.length - 1].x + 240, y: randomPipeHeight() });
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

    return (
        <GameContext.Provider value={{ gameState, score, startGame, performJump }}>
            <div className="canvas-wrap" onPointerDown={handlePointerDown} onClick={(e) => e.preventDefault()}>
                <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
                {gameState !== "running" && !overlayText && (
                    <div className="touch-hint">{isTouch ? "Dokunarak başla" : "Oyna: boşluk tuşuna bas veya ekrana tıkla"}</div>
                )}
            </div>
        </GameContext.Provider>
    );
}
