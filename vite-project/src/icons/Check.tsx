interface props {
  color?: string
  size?: string
}

export default function Check({color, size="24"}: props) {
  return (
    <svg  xmlns="http://www.w3.org/2000/svg"  width={size}  height={size} viewBox="0 0 24 24"  fill="none"  stroke={color}  strokeWidth="2"  strokeLinecap="round"  strokeLinejoin="round"  className="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>
  )
}
