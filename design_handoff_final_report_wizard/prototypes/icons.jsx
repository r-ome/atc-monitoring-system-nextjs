// Lucide-style stroke icons for ATC. Compact, 1.6 stroke.

const Icon = ({ name, size = 16, stroke = 1.6, ...rest }) => {
  const paths = {
    home: <><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></>,
    gavel: <><path d="m14 13-7.5 7.5a1.5 1.5 0 0 1-2.1-2.1L11.9 11"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/></>,
    users: <><circle cx="9" cy="8" r="3.5"/><path d="M3 21c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4a3.5 3.5 0 0 1 0 7"/><path d="M21 21c0-2.5-1.5-4.7-3.6-5.6"/></>,
    box: <><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/></>,
    building: <><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01"/><path d="M10 21v-4h4v4"/></>,
    container: <><rect x="3" y="7" width="18" height="12" rx="1.5"/><path d="M7 7v12M12 7v12M17 7v12"/></>,
    truck: <><path d="M14 18V6H2v10a2 2 0 0 0 2 2h2"/><path d="M14 9h4l4 4v3a2 2 0 0 1-2 2h-2"/><circle cx="8" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></>,
    receipt: <><path d="M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21l2-1.5V3z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    chart: <><path d="M3 3v18h18"/><path d="M7 16l4-5 3 3 5-7"/></>,
    gear: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.8 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>,
    chevronLeft: <path d="m15 18-6-6 6-6"/>,
    chevronRight: <path d="m9 18 6-6-6-6"/>,
    chevronDown: <path d="m6 9 6 6 6-6"/>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    filter: <path d="M3 5h18l-7 9v6l-4-2v-4z"/>,
    sidebar: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></>,
    menu: <><path d="M3 6h18M3 12h18M3 18h18"/></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
    arrowUpDown: <><path d="m7 4 3 3M7 4 4 7M7 4v16M17 20l-3-3M17 20l3-3M17 20V4"/></>,
    alert: <><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></>,
    cake: <><path d="M12 6V3M9 6V3M15 6V3"/><path d="M4 12a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8H4z"/><path d="M4 16c1 0 1 1 2 1s1-1 2-1 1 1 2 1 1-1 2-1 1 1 2 1 1-1 2-1 1 1 2 1 1-1 2-1"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></>,
    x: <><path d="m6 6 12 12M18 6 6 18"/></>,
    arrowRight: <><path d="M5 12h14M13 5l7 7-7 7"/></>,
    sparkles: <><path d="M9 4v4M7 6h4M19 14v4M17 16h4M11 11l1.5 3.5L16 16l-3.5 1.5L11 21l-1.5-3.5L6 16l3.5-1.5z"/></>,
    package: <><path d="M16.5 9.4 7.5 4.2"/><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {paths[name] || null}
    </svg>
  );
};

window.Icon = Icon;
