export default function GradientText({
  text = "Nexus",
  size = "text-5xl",
  className = "",
  weight = "font-semibold",
}) {
  return (
    <span
      className={[
        size,
        weight,
        "tracking-[1px]",
        "bg-linear-to-r from-[#173A7A] via-[#1F6FB0] to-[#22D3C6]",
        "bg-clip-text text-transparent",
        className,
      ].join(" ")}
    >
      {text}
    </span>
  );
}
