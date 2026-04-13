export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-lc-line px-8 md:px-16 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <span className="font-sans font-700 text-xs tracking-widest2 text-white uppercase select-none">
        LIFECODE
      </span>
      <p className="font-body text-xs text-lc-dim tracking-wider">
        &copy; {year} LIFECODE. All rights reserved.
      </p>
      <div className="flex gap-8">
        {['Privacy', 'Terms', 'Contact'].map((link) => (
          <a
            key={link}
            href="#"
            className="font-body text-xs text-lc-dim hover:text-lc-silver tracking-widest uppercase transition-colors duration-300"
          >
            {link}
          </a>
        ))}
      </div>
    </footer>
  );
}
