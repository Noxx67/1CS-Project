import styles from './ScolariteIcons.module.css';

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function Svg({ children, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      {children}
    </svg>
  );
}

const ICONS = {
  calendar: (
    <Svg>
      <rect x="5" y="5.5" width="14" height="14" rx="2.4" {...STROKE} />
      <path d="M8.5 3.5v4M15.5 3.5v4M5 10h14" {...STROKE} />
    </Svg>
  ),
  clock: (
    <Svg>
      <circle cx="12" cy="12" r="7.2" {...STROKE} />
      <path d="M12 8.2v4.2l2.8 1.6" {...STROKE} />
    </Svg>
  ),
  document: (
    <Svg>
      <path d="M8 4.5h6l3.5 3.5v11.5H8a2.5 2.5 0 0 1-2.5-2.5v-10A2.5 2.5 0 0 1 8 4.5Z" {...STROKE} />
      <path d="M13.5 4.8V8.5H17" {...STROKE} />
    </Svg>
  ),
  pending: (
    <Svg>
      <path d="M8 4.5h6l3.5 3.5v11.5H8a2.5 2.5 0 0 1-2.5-2.5v-10A2.5 2.5 0 0 1 8 4.5Z" {...STROKE} />
      <path d="M13.5 4.8V8.5H17" {...STROKE} />
      <circle cx="12" cy="14.5" r="2.4" {...STROKE} />
      <path d="M12 12.6v1.9" {...STROKE} />
    </Svg>
  ),
  approved: (
    <Svg>
      <circle cx="12" cy="12" r="7.2" {...STROKE} />
      <path d="M8.6 12.2 11.1 14.7 15.8 9.4" {...STROKE} />
    </Svg>
  ),
  rejected: (
    <Svg>
      <circle cx="12" cy="12" r="7.2" {...STROKE} />
      <path d="M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6" {...STROKE} />
    </Svg>
  ),
  filter: (
    <Svg>
      <path d="M4 7h16" {...STROKE} />
      <path d="M7 12h10" {...STROKE} />
      <path d="M10 17h4" {...STROKE} />
      <circle cx="9" cy="7" r="2" {...STROKE} />
      <circle cx="15" cy="12" r="2" {...STROKE} />
      <circle cx="12" cy="17" r="2" {...STROKE} />
    </Svg>
  ),
  export: (
    <Svg>
      <path d="M12 4.5v9.5" {...STROKE} />
      <path d="m8.5 10 3.5 3.5 3.5-3.5" {...STROKE} />
      <path d="M5.5 18.5h13" {...STROKE} />
    </Svg>
  ),
  archive: (
    <Svg>
      <path d="M4.5 8.5h15v10a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2v-10Z" {...STROKE} />
      <path d="M3.5 5.5h17v3h-17v-3Z" {...STROKE} />
      <path d="M10 12.5h4" {...STROKE} />
    </Svg>
  ),
  attachment: (
    <Svg>
      <path d="M14.2 5.8h-3.4a3.4 3.4 0 0 0 0 6.8h6.8a2.6 2.6 0 0 0 0-5.2h-6" {...STROKE} />
    </Svg>
  ),
  medical: (
    <Svg>
      <path d="M12 6.5v11" {...STROKE} />
      <path d="M7 12h10" {...STROKE} />
      <path d="M9.5 8.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5" {...STROKE} />
      <path d="M9.5 15.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5" {...STROKE} />
    </Svg>
  ),
  transport: (
    <Svg>
      <path d="M5.5 14.5h13" {...STROKE} />
      <path d="M6.5 14.5V9.5h3l1.5-2h4l1.5 2h3v5" {...STROKE} />
      <circle cx="8.5" cy="14.5" r="1.5" {...STROKE} />
      <circle cx="15.5" cy="14.5" r="1.5" {...STROKE} />
    </Svg>
  ),
  administrative: (
    <Svg>
      <path d="M8 5.5h8v13H8a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" {...STROKE} />
      <path d="M10 9.5h4M10 12.5h4M10 15.5h2.5" {...STROKE} />
    </Svg>
  ),
  external: (
    <Svg>
      <path d="M14 5.5h4.5V10" {...STROKE} />
      <path d="M10 14 18.5 5.5" {...STROKE} />
      <path d="M6.5 8.5v9h9" {...STROKE} />
    </Svg>
  ),
};

export default function ScolariteIcon({ name, size = 'md', className = '' }) {
  const icon = ICONS[name];

  if (!icon) {
    return null;
  }

  const sizeClass = styles[`size${size.charAt(0).toUpperCase()}${size.slice(1)}`] || styles.sizeMd;

  return (
    <span className={`${styles.icon} ${sizeClass} ${className}`.trim()}>
      {icon}
    </span>
  );
}
