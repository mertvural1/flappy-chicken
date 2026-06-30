import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
    BIRD_SIZE,
    BIRD_START_X,
    BIRD_START_Y,
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    CHICKEN_ICON_URL,
    CLOUDS,
    CLOUD_SPEED,
    FLOOR_BORDER_HEIGHT,
    FLOOR_HEIGHT,
    GAME_OVER_TEXT,
    GRAVITY,
    JUMP_VELOCITY,
    OVERLAY_HEIGHT,
    OVERLAY_PADDING,
    OVERLAY_Y_OFFSET,
    PIPE_CAP_HEIGHT,
    PIPE_GAP,
    PIPE_HEIGHT_RANGE,
    PIPE_MIN_HEIGHT,
    PIPE_RESPAWN_OFFSET,
    PIPE_SPEED,
    PIPE_SPAWN_SPACING,
    PIPE_START_OFFSET,
    PIPE_WIDTH,
    SCORE_LABEL,
    SCORE_TEXT_X,
    SCORE_TEXT_Y,
    createDefaultPipes,
    FLAME_POLE_COLOR,
    FLAME_POLE_GRADIENT_START,
    FLAME_POLE_GRADIENT_END,
    FLAME_FLAME_COLORS,
    FLAME_SEGMENTS,
    FLAME_HEIGHT_MAX,
    FLAME_WIDTH_MIN,
    FLAME_WIDTH_MAX
} from "../constants";
import type { GameContextType, GameState, Pipe } from "../types";
import Footer from "./Footer";

const randomPipeHeight = () => PIPE_MIN_HEIGHT + Math.random() * PIPE_HEIGHT_RANGE;

const RESTART_BUTTON_TEXT = "Restart";
const PRIMARY_BUTTON_CLASS_NAME =
    "flex-1 rounded-full bg-[#ffb84d] px-4 py-3 text-base font-black text-[#1f2a44] shadow-[0_10px_24px_rgba(255,184,77,0.35)] transition-transform active:scale-[0.98]";
const defaultPipes = createDefaultPipes();

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = (): GameContextType => {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error("useGame must be used within GameProvider");
    return ctx;
};

export default function Game() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const gameContainerRef = useRef<HTMLDivElement | null>(null);
    const chickenImageRef = useRef<HTMLImageElement | null>(null);
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<GameState>("start");
    const [isFullscreenEnabled, setIsFullscreenEnabled] = useState(false);
    const chicken = useRef({ x: BIRD_START_X, y: BIRD_START_Y, vy: 0 });
    const cloudsRef = useRef(CLOUDS.map((cloud) => ({ ...cloud })));
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
        return "";
    }, [gameState]);

    const performJump = () => {
        if (!isAlive.current) return;
        chicken.current.vy = JUMP_VELOCITY;
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
        if (isFullscreenEnabled) {
            enterFullscreen();
        }
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
        const chickenImage = new Image();
        chickenImage.src = CHICKEN_ICON_URL;
        chickenImage.onload = () => {
            chickenImageRef.current = chickenImage;
        };

        return () => {
            chickenImageRef.current = null;
        };
    }, []);

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

            cloudsRef.current.forEach((cloud) => {
                ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
                ctx.beginPath();
                ctx.ellipse(cloud.x + 18, cloud.y + 16, 18, 14, 0, 0, Math.PI * 2);
                ctx.ellipse(cloud.x + 40, cloud.y + 12, 22, 16, 0, 0, Math.PI * 2);
                ctx.ellipse(cloud.x + 62, cloud.y + 16, 18, 14, 0, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.fillStyle = "#74c24d";
            ctx.fillRect(0, CANVAS_HEIGHT - FLOOR_HEIGHT, CANVAS_WIDTH, FLOOR_HEIGHT);
            ctx.fillStyle = "#53912d";
            ctx.fillRect(0, CANVAS_HEIGHT - FLOOR_HEIGHT - FLOOR_BORDER_HEIGHT, CANVAS_WIDTH, FLOOR_BORDER_HEIGHT);

            if (chickenImageRef.current) {
                ctx.drawImage(chickenImageRef.current, chicken.current.x, chicken.current.y, BIRD_SIZE, BIRD_SIZE);
            } else {
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
            }

            const phase = performance.now() * 0.002;

            const drawFlameLayer = (
                context: CanvasRenderingContext2D,
                x: number,
                baseY: number,
                isBottom: boolean,
                localPhase: number
            ) => {
                const direction = isBottom ? 1 : -1;
                const segmentWidth = (PIPE_WIDTH - 8) / FLAME_SEGMENTS;

                for (let index = 0; index < FLAME_SEGMENTS; index += 1) {
                    const offsetX = x + 4 + index * segmentWidth;
                    const flameHeight = FLAME_HEIGHT_MAX * (0.7 + 0.3 * Math.sin(localPhase + index * 1.3));
                    const flameWidth = FLAME_WIDTH_MIN + (FLAME_WIDTH_MAX - FLAME_WIDTH_MIN) * Math.abs(Math.sin(localPhase + index * 1.15));
                    const peakX = offsetX + flameWidth * 0.5;

                    context.beginPath();
                    context.moveTo(offsetX, baseY);
                    context.bezierCurveTo(
                        offsetX + flameWidth * 0.2,
                        baseY + direction * flameHeight * 0.35,
                        peakX - flameWidth * 0.2,
                        baseY + direction * flameHeight * 0.75,
                        peakX,
                        baseY + direction * flameHeight
                    );
                    context.bezierCurveTo(
                        peakX + flameWidth * 0.2,
                        baseY + direction * flameHeight * 0.75,
                        offsetX + flameWidth - flameWidth * 0.2,
                        baseY + direction * flameHeight * 0.35,
                        offsetX + flameWidth,
                        baseY
                    );

                    const gradientFill = context.createLinearGradient(0, baseY, 0, baseY + direction * flameHeight);
                    gradientFill.addColorStop(0, FLAME_FLAME_COLORS[0]);
                    gradientFill.addColorStop(0.4, FLAME_FLAME_COLORS[1]);
                    gradientFill.addColorStop(0.75, FLAME_FLAME_COLORS[2]);
                    gradientFill.addColorStop(1, FLAME_FLAME_COLORS[3]);

                    context.fillStyle = gradientFill;
                    context.fill();
                }
            };

            const drawFlamePole = (context: CanvasRenderingContext2D, pipe: Pipe, localPhase: number) => {
                const topHeight = pipe.y;
                const bottomY = pipe.y + PIPE_GAP;
                const bottomHeight = CANVAS_HEIGHT - FLOOR_HEIGHT - bottomY;

                const poleGradient = context.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
                poleGradient.addColorStop(0, FLAME_POLE_GRADIENT_START);
                poleGradient.addColorStop(1, FLAME_POLE_GRADIENT_END);

                context.fillStyle = poleGradient;
                context.fillRect(pipe.x, 0, PIPE_WIDTH, topHeight);
                context.fillRect(pipe.x, bottomY, PIPE_WIDTH, bottomHeight);

                context.fillStyle = FLAME_POLE_COLOR;
                context.fillRect(pipe.x, topHeight - PIPE_CAP_HEIGHT, PIPE_WIDTH, PIPE_CAP_HEIGHT);
                context.fillRect(pipe.x, bottomY, PIPE_WIDTH, PIPE_CAP_HEIGHT);

                drawFlameLayer(context, pipe.x, topHeight, false, localPhase + pipe.x * 0.05);
                drawFlameLayer(context, pipe.x, bottomY, true, localPhase + pipe.x * 0.05);
            };

            if (gameState === "running") {
                pipesRef.current.forEach((pipe) => {
                    if (pipe.x + PIPE_WIDTH < 0 || pipe.x > CANVAS_WIDTH) return;
                    drawFlamePole(ctx, pipe, phase);
                });
            }

            ctx.fillStyle = "#ffffff";
            ctx.font = "32px Poppins, sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(`${SCORE_LABEL}: ${scoreRef.current}`, SCORE_TEXT_X, SCORE_TEXT_Y);

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

            cloudsRef.current = cloudsRef.current.map((cloud) => {
                let nextX = cloud.x - CLOUD_SPEED;
                if (nextX + cloud.width < -40) {
                    nextX = CANVAS_WIDTH + 40;
                }
                return { ...cloud, x: nextX };
            });

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
            return;
        }
        performJump();
    };

    const handleStartButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        startGame();
    };

    const handleRestartButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        startGame();
    };

    return (
        <GameContext.Provider value={{ gameState, score, startGame, performJump }}>
            <div
                ref={gameContainerRef}
                className="relative h-screen w-screen overflow-hidden bg-transparent touch-none cursor-pointer"
                onPointerDown={handlePointerDown}
            >
                <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block h-full w-full" />
                {gameState === "start" && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[linear-gradient(180deg,rgba(3,10,22,0.18),rgba(1,7,16,0.7))] px-4">
                        <div className="w-full max-w-[360px] rounded-[30px] border border-white/20 bg-white/95 p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8f4d24]">Flappy Chicken</p>
                            <h1 className="mt-2 text-[2rem] font-black text-[#1f2a44]">Ready to fly?</h1>
                            <p className="mt-3 text-sm leading-6 text-[#5b6578]">
                                Tap or press space to jump, dodge the pipes, and keep the chicken soaring.
                            </p>


                            <div className="mt-5 flex flex-col gap-3">
                                <button
                                    type="button"
                                    className={PRIMARY_BUTTON_CLASS_NAME}
                                    onClick={handleStartButtonClick}
                                >
                                    Start Game
                                </button>
                                  <Footer />
                            </div>
                        </div>
                    </div>
                )}
              
                {gameState === "gameover" && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
                        <div className="w-full max-w-[320px] rounded-[28px] border border-white/20 bg-white/95 p-5 text-center shadow-2xl">
                            <img
                                src="https://media.tenor.com/KhMHIViGxysAAAAM/roast-chiken.gif"
                                alt="Roasted chicken animation"
                                className="mx-auto h-24 w-24 rounded-2xl object-cover shadow-lg"
                            />
                            <p className="mt-3 text-lg font-black text-[#6b2c0f]">The chicken got roasted.</p>
                            <p className="mt-1 text-sm font-medium text-[#8f4d24]">Tap to serve another round.</p>
                            <button
                                type="button"
                                className={`mt-5 w-full ${PRIMARY_BUTTON_CLASS_NAME}`}
                                onClick={handleRestartButtonClick}
                            >
                                {RESTART_BUTTON_TEXT}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </GameContext.Provider>
    );
}
