import { useEffect, useMemo, useRef, useState } from "react";
import Game from "./components/Game";

export default function App() {
    return (
        <div className="app-shell">
            <div className="game-panel">
                <Game />
            </div>
        </div>
    );
}
 
