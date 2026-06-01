function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function ProceduralCover({ title, coverUrl }: { title: string; coverUrl?: string | null }) {
  if (coverUrl) {
    return <img className="cover-img" src={coverUrl} alt={`${title} cover art`} loading="lazy" />;
  }

  const hash = hashString(title || "AI CORE");
  const hueA = hash % 360;
  const hueB = (hash * 7) % 360;
  const blocks = Array.from({ length: 18 }, (_, index) => ({
    left: (hash * (index + 3)) % 88,
    top: (hash * (index + 11)) % 88,
    size: 6 + ((hash + index * 13) % 20),
    rot: (hash + index * 19) % 90,
  }));

  return (
    <div
      className="procedural-cover"
      style={{
        ["--hue-a" as string]: hueA,
        ["--hue-b" as string]: hueB,
      }}
      aria-label={`Procedural AI Core cover for ${title}`}
    >
      <div className="cover-grid" />
      {blocks.map((block, index) => (
        <i
          key={index}
          className="cover-chip"
          style={{
            left: `${block.left}%`,
            top: `${block.top}%`,
            width: `${block.size}%`,
            height: `${Math.max(4, block.size / 2)}%`,
            transform: `rotate(${block.rot}deg)`,
          }}
        />
      ))}
      <div className="cover-robot">◉▣◉</div>
      <div className="cover-title">{title}</div>
      <div className="cover-stamp">AI CORE CD-SINGLE</div>
    </div>
  );
}
