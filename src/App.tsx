import Game from "./components/Game";

export default function App() {
    return (
        <div className="relative m-0 h-screen w-screen overflow-hidden p-0">
            <div className="flex h-full w-full items-center justify-center bg-transparent p-0">
                <Game />
            </div>
        </div>
    );
}
 
