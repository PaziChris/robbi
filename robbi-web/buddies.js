/* Robbi – Begleiter-Tiere
 * Alle Tiere teilen sich dasselbe Grundgerüst wie Arzi (viewBox 0 0 100 92, Kopf bei 50/37, Augen bei 44/35 und 56/35,
 * Körper bei 50/68, Füße bei 41/85 und 59/85). Darum passt die ganze Garderobe auf jedes Tier.
 */
export const ANIMALS = {
  owl:     { name: 'Eule',   emoji: '🦉', def: 'Sova',   act: 'wag', colors: [['#8B6B4A', '#F1E2C6', '#6E5236'], ['#EDE9E1', '#FFFFFF', '#B9B2A6'], ['#7D7F86', '#E4E5E8', '#55575D'], ['#B98A4E', '#F6E7CC', '#8C6534']] },
  wolf:    { name: 'Wolf',   emoji: '🐺', def: 'Lupo',   act: 'wag', colors: [['#8E99A3', '#E9EDF0', '#5E6872'], ['#ECEAE6', '#FFFFFF', '#BDB8B0'], ['#3E3E44', '#9C9CA3', '#26262A'], ['#A58662', '#EFE3D2', '#75593C']] },
  bull:    { name: 'Stier',  emoji: '🐂', def: 'Toro',   act: 'wag', colors: [['#7A4A2E', '#D9B48C', '#4E2E1C'], ['#2E2A28', '#8A7F78', '#1A1716'], ['#B07A4C', '#EBCFAE', '#7E5230'], ['#EDE6DC', '#FFFFFF', '#B5AB9D']] },
  rooster: { name: 'Hahn',   emoji: '🐓', def: 'Coco',   act: 'wag', colors: [['#F7F3EA', '#FFFFFF', '#E0D6C2'], ['#A5552C', '#E8B98E', '#743819'], ['#2F2C2A', '#6F6A66', '#1A1817'], ['#E3B04B', '#F7E2B3', '#B88526']] },
  cat:     { name: 'Katze',  emoji: '🐱', def: 'Mia',    act: 'wag', colors: [['#E8A15C', '#FBE7CF', '#C77D3A'], ['#3A3A3F', '#8D8D96', '#232327'], ['#9DA3AA', '#E6E8EB', '#6D737A'], ['#F3EEE6', '#FFFFFF', '#C9C0B2'], ['#D9B98F', '#F7EBDA', '#A9875F']] },
  fox:     { name: 'Fuchs',  emoji: '🦊', def: 'Foxi',   act: 'wag', colors: [['#E2752D', '#FFF5EA', '#3A2A22'], ['#A9ADB3', '#F4F5F6', '#3A3B3E'], ['#C9472A', '#FCEDE4', '#3A2420']] },
  panda:   { name: 'Panda',  emoji: '🐼', def: 'Pao',    act: 'wag', colors: [['#FFFFFF', '#F1F1F1', '#2B2B2B'], ['#FFF7EC', '#F4EADB', '#5A3A2A']] },
  bunny:   { name: 'Hase',   emoji: '🐰', def: 'Hoppel', act: 'wag', colors: [['#C9C3BD', '#FFFFFF', '#9C958E'], ['#F4F2EE', '#FFFFFF', '#CFC9C0'], ['#A47852', '#EEDCC8', '#77553A'], ['#3E3A38', '#8E8783', '#252220']] }
};
export const GOLD = ['#E0B23C', '#F7E7B5', '#B58A1F'];          // goldenes Fell – ab 1000 Punkten
export const GOLD_XP = 1000;

const eyes = (iris) => `
    <g class="eye l">${iris ? `<circle cx="44" cy="35" r="4.2" fill="${iris}"/>` : ''}<circle cx="44" cy="35" r="2.7" fill="var(--eye)"/><circle cx="45" cy="34" r=".9" fill="#fff"/></g>
    <g class="eye r">${iris ? `<circle cx="56" cy="35" r="4.2" fill="${iris}"/>` : ''}<circle cx="56" cy="35" r="2.7" fill="var(--eye)"/><circle cx="57" cy="34" r=".9" fill="#fff"/></g>`;
const mouth = (y = 46, w = 3.5) => `<path class="open" d="M${50 - w} ${y} Q50 ${y + 2.6} ${50 + w} ${y}" fill="none" stroke="#5A3A2A" stroke-width="1.3" stroke-linecap="round"/>
    <path class="happy" d="M${50 - w - .5} ${y - .5} Q50 ${y + 5} ${50 + w + .5} ${y - .5} Z" fill="#B5434A"/>`;
const cheeks = `<circle cx="38.5" cy="42" r="2.6" fill="#F28C8C" opacity=".45"/><circle cx="61.5" cy="42" r="2.6" fill="#F28C8C" opacity=".45"/>`;
const arms = c => `<g class="b-arms"><path d="M33 58 Q28 68 35 77" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/><path d="M67 58 Q72 68 65 77" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/></g>`;
const wings = c => `<g class="b-arms"><path d="M32 58 Q23 69 31 81 Q37 72 35 59 Z" fill="${c}"/><path d="M68 58 Q77 69 69 81 Q63 72 65 59 Z" fill="${c}"/></g>`;

/* Jedes Tier: tail, arms, extraBody (Muster), ears (hinter dem Kopf), face (über dem Kopf), feet-Farbe */
function parts(id, [C, B, D]) {
  switch (id) {
    case 'owl': return {
      tail: `<path d="M43 82 L50 91 L57 82 Z" fill="${D}"/>`, arms: wings(D), feetC: '#F2A33A',
      body: `<path d="M44 64 l3 2.2 l3 -2.2 M50 64 l3 2.2 l3 -2.2 M47 70 l3 2.2 l3 -2.2 M44 76 l3 2.2 l3 -2.2 M50 76 l3 2.2 l3 -2.2" fill="none" stroke="${D}" stroke-width=".9" opacity=".7"/>`,
      ears: `<path d="M34 25 L29 9 L41 19 Z M66 25 L71 9 L59 19 Z" fill="${D}"/>`,
      face: `<circle cx="44" cy="35" r="7.6" fill="${B}"/><circle cx="56" cy="35" r="7.6" fill="${B}"/>${eyes('#F2B33D')}<path d="M47.6 40 L52.4 40 L50 45 Z" fill="#F2A33A"/>
        <path class="open" d="M50 45 l0 0" stroke="none"/><path class="happy" d="M47.8 44.6 Q50 48.6 52.2 44.6 Z" fill="#B5434A"/>`
    };
    case 'wolf': return {
      tail: `<path d="M66 79 C86 82 94 64 87 55 C83 63 78 70 66 72 Z" fill="${C}"/><path d="M87 55 C90 60 90 66 86 70 C84 64 85 59 87 55 Z" fill="${B}"/>`, arms: arms(C), feetC: D,
      ears: `<path d="M33 26 L30 8 L44 19 Z M67 26 L70 8 L56 19 Z" fill="${C}"/><path d="M34 22 L32.5 12.5 L40.5 19 Z M66 22 L67.5 12.5 L59.5 19 Z" fill="#E7B9B9"/>`,
      face: `<path d="M50 20 Q45.5 29 50 36 Q54.5 29 50 20 Z" fill="${B}" opacity=".7"/><ellipse cx="50" cy="44" rx="9.5" ry="6.8" fill="${B}"/>${eyes()}<ellipse cx="50" cy="40.6" rx="2.8" ry="1.9" fill="#2B2B2B"/>${mouth(45.6, 3)}`
    };
    case 'bull': return {
      tail: `<path d="M66 76 Q80 81 83 66" fill="none" stroke="${C}" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="83" cy="64" rx="2.6" ry="3.6" fill="${D}"/>`, arms: arms(C), feetC: D,
      ears: `<path d="M34 22 C24 21 19 13 23 6 C25 12 30 16 37 17 Z M66 22 C76 21 81 13 77 6 C75 12 70 16 63 17 Z" fill="#F3E7CF"/>
        <ellipse cx="28.5" cy="30" rx="6.5" ry="3.2" transform="rotate(-18 28.5 30)" fill="${C}"/><ellipse cx="71.5" cy="30" rx="6.5" ry="3.2" transform="rotate(18 71.5 30)" fill="${C}"/>
        <ellipse cx="28.5" cy="30" rx="3.8" ry="1.6" transform="rotate(-18 28.5 30)" fill="#E7A9A0"/><ellipse cx="71.5" cy="30" rx="3.8" ry="1.6" transform="rotate(18 71.5 30)" fill="#E7A9A0"/>`,
      face: `<path d="M43 19 Q50 13 57 19 Q50 22.5 43 19 Z" fill="${D}"/>${eyes()}<ellipse cx="50" cy="45.5" rx="11.5" ry="7.8" fill="#E7B9A0"/><ellipse cx="45.6" cy="44.6" rx="1.6" ry="2.2" fill="#8A4A3A"/><ellipse cx="54.4" cy="44.6" rx="1.6" ry="2.2" fill="#8A4A3A"/>${mouth(49.4, 3)}`
    };
    case 'rooster': return {
      tail: `<path d="M64 72 C76 60 84 50 82 38" fill="none" stroke="#1F5FA8" stroke-width="4.2" stroke-linecap="round"/><path d="M66 76 C80 70 90 62 91 50" fill="none" stroke="#F4F4F4" stroke-width="4.2" stroke-linecap="round"/><path d="M66 80 C80 80 90 74 94 64" fill="none" stroke="#D7263D" stroke-width="4.2" stroke-linecap="round"/>`,
      arms: wings(D), feetC: '#F2A33A',
      ears: `<path d="M40 21 Q39 12 44 14 Q45 7 50 10.5 Q54 5.5 56.5 12 Q61 11 60.5 19 Z" fill="#D7263D"/>`,
      face: `${eyes()}<path d="M46.8 39.6 L53.2 39.6 L50 45 Z" fill="#F2A33A"/><path d="M49 45 Q46.8 50.5 50 51.5 Q53.2 50.5 51 45 Z" fill="#D7263D"/><path class="open" d="M50 45 l0 0" stroke="none"/><path class="happy" d="M47.6 44 Q50 47.6 52.4 44 Z" fill="#B5434A"/>`
    };
    case 'cat': return {
      tail: `<path d="M64 78 C84 82 92 62 82 56 C75 52 70 60 76 63" fill="none" stroke="${C}" stroke-width="4.5" stroke-linecap="round"/>`, arms: arms(C), feetC: D,
      ears: `<path d="M32 27 L31 10 L45 19 Z M68 27 L69 10 L55 19 Z" fill="${C}"/><path d="M33.5 23 L33 14 L40.5 19 Z M66.5 23 L67 14 L59.5 19 Z" fill="#F2A7B0"/>`,
      face: `<path d="M46 19 l1 5 M50 18 l0 5.5 M54 19 l-1 5" stroke="${D}" stroke-width="1.4" stroke-linecap="round"/>${eyes()}<path d="M48.2 40.4 L51.8 40.4 L50 42.6 Z" fill="#F2A7B0"/>
        <path d="M40 41 L31 39.5 M40 43 L31 44 M60 41 L69 39.5 M60 43 L69 44" stroke="#5A4A40" stroke-width=".7" opacity=".7"/>${mouth(44.4, 2.6)}${cheeks}`
    };
    case 'fox': return {
      tail: `<path d="M64 80 C88 86 98 62 88 50 C84 62 78 70 64 72 Z" fill="${C}"/><path d="M88 50 C93 56 93 64 88 69 C86 62 86 56 88 50 Z" fill="${B}"/>`, arms: arms(D), feetC: D,
      ears: `<path d="M32 27 L29 7 L45 19 Z M68 27 L71 7 L55 19 Z" fill="${C}"/><path d="M29 7 L31 15 L35 12 Z M71 7 L69 15 L65 12 Z" fill="${D}"/>`,
      face: `<path d="M30 39 Q38 52 50 48 Q62 52 70 39 Q62 45 50 43 Q38 45 30 39 Z" fill="${B}"/>${eyes()}<ellipse cx="50" cy="43" rx="2.4" ry="1.7" fill="#2B2B2B"/>${mouth(46.2, 2.6)}`
    };
    case 'panda': return {
      tail: `<circle cx="66" cy="80" r="3.5" fill="${C}"/>`, arms: arms(D), feetC: D,
      body: `<path d="M31 60 Q50 48 69 60 Q66 54 50 50 Q34 54 31 60 Z" fill="${D}"/>`,
      ears: `<circle cx="33.5" cy="21" r="6.5" fill="${D}"/><circle cx="66.5" cy="21" r="6.5" fill="${D}"/>`,
      face: `<ellipse cx="43.5" cy="36" rx="5.4" ry="6.6" transform="rotate(25 43.5 36)" fill="${D}"/><ellipse cx="56.5" cy="36" rx="5.4" ry="6.6" transform="rotate(-25 56.5 36)" fill="${D}"/>
        <g class="eye l"><circle cx="44" cy="35" r="2.4" fill="#fff"/><circle cx="44.3" cy="35.2" r="1.4" fill="#111"/></g><g class="eye r"><circle cx="56" cy="35" r="2.4" fill="#fff"/><circle cx="55.7" cy="35.2" r="1.4" fill="#111"/></g>
        <ellipse cx="50" cy="42" rx="2.6" ry="1.8" fill="${D}"/>${mouth(45, 2.6)}${cheeks}`
    };
    case 'bunny': return {
      tail: `<circle cx="68" cy="80" r="5" fill="${B}"/>`, arms: arms(C), feetC: D,
      ears: `<ellipse cx="42.5" cy="9" rx="4.6" ry="13" transform="rotate(-8 42.5 9)" fill="${C}"/><ellipse cx="57.5" cy="9" rx="4.6" ry="13" transform="rotate(8 57.5 9)" fill="${C}"/>
        <ellipse cx="42.5" cy="10" rx="2.2" ry="9.5" transform="rotate(-8 42.5 10)" fill="#F2A7B0"/><ellipse cx="57.5" cy="10" rx="2.2" ry="9.5" transform="rotate(8 57.5 10)" fill="#F2A7B0"/>`,
      face: `${eyes()}<ellipse cx="50" cy="41" rx="2" ry="1.4" fill="#F28C9C"/><rect x="48.4" y="45.2" width="3.2" height="2.6" rx=".5" fill="#fff" stroke="#C9C0B2" stroke-width=".4"/>${mouth(44.4, 2.6)}${cheeks}`
    };
  }
  return null;
}

/* Fertiges SVG (als Text). outfit = { head, body, shoes } – HTML der Garderobe aus Arzis Zeichnung */
export function buddySvg(id, colorIdx, outfit, xp = 0) {
  const a = ANIMALS[id]; if (!a) return '';
  const col = colorIdx === 'gold' && xp >= GOLD_XP ? GOLD : (a.colors[colorIdx] || a.colors[0]);
  const [C, B, D] = col, p = parts(id, col);
  return `<svg class="buddy" viewBox="0 0 100 92" aria-hidden="true" data-animal="${id}">
    <ellipse cx="50" cy="86" rx="34" ry="5" fill="var(--sea-soft)"/>
    <g class="b-tail">${p.tail}</g>
    <g class="b-body"><ellipse cx="50" cy="68" rx="20" ry="18" fill="${C}"/><ellipse cx="50" cy="71" rx="11" ry="12" fill="${B}"/>${p.body || ''}</g>
    ${p.arms}
    ${outfit ? outfit.body : ''}
    <ellipse class="b-foot" cx="41" cy="85" rx="7" ry="3.5" fill="${p.feetC}"/><ellipse class="b-foot" cx="59" cy="85" rx="7" ry="3.5" fill="${p.feetC}"/>
    ${outfit ? outfit.shoes : ''}
    <g class="b-head">${p.ears}<circle cx="50" cy="37" r="20" fill="${C}"/>${p.face}${outfit ? outfit.head : ''}</g>
  </svg>`;
}
