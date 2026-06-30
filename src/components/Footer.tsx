export default function Footer() {
    return (
        <footer className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-[11px] font-medium tracking-[0.2em] text-white/85 backdrop-blur-sm sm:text-xs">
            <a
                href="https://www.linkedin.com/in/mert-vural-b8080563/"
                target="_blank"
                rel="noreferrer"
                className="transition-opacity hover:opacity-80"
            >
                Built by Mert Vural
            </a>
        </footer>
    );
}
