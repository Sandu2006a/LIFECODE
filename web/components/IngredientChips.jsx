export default function IngredientChips({ chips, gradient }) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip, i) => (
        <span
          key={i}
          className="p-px rounded-full"
          style={{ background: gradient }}
        >
          <span className="block px-4 py-1.5 rounded-full bg-white font-body text-[10px] tracking-widest uppercase text-[#333]">
            {chip}
          </span>
        </span>
      ))}
    </div>
  );
}
