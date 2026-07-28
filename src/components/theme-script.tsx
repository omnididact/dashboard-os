/**
 * Inline FOUC-prevention script — runs before paint.
 * Keep tiny; no imports.
 */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('dashboard-theme');if(t!=='light'&&t!=='dark')t='dark';var r=document.documentElement;r.classList.toggle('dark',t==='dark');r.classList.toggle('light',t==='light');r.style.colorScheme=t;r.dataset.theme=t;}catch(e){document.documentElement.classList.add('dark');}})();`;
  return (
    <script
      dangerouslySetInnerHTML={{ __html: code }}
      // Next App Router allows blocking script in head for theme
    />
  );
}
