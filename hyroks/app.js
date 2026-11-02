// All assets and data are local; relative URLs also work under a GitHub Pages repository path.
const sources = [
  ['open', 'individual', 'open_men_women.json'],
  ['pro', 'individual', 'pro_men_women.json'],
  ['open', 'doubles', 'open_mix_doubles.json'],
  ['pro', 'doubles', 'pro_mix_doubles.json'],
];
const splits = ['run1', 'lunges', 'run2', 'bbj', 'run3', 'ski', 'run4', 'sled', 'run5', 'row', 'run6', 'farmer', 'run7', 'wallball'];
const labels = { running: 'Running', lunges: 'Lunges', bbj: 'Burpee broad jumps', ski: 'Ski', sled: 'Sled', row: 'Row', farmer: 'Farmer carry', wallball: 'Wall balls', finish: 'Finish' };
const axes = ['running', 'lunges', 'bbj', 'ski', 'sled', 'row', 'farmer', 'wallball'];
const $ = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().replace(/\s+/g, ' ').trim();
const seconds = value => /^\d+:\d{2}:\d{2}$/.test(value) ? value.split(':').reduce((n, part) => n * 60 + Number(part), 0) : null;
const time = n => n == null || !Number.isFinite(n) ? '—' : [Math.floor(Math.abs(Math.round(n)) / 3600), Math.floor(Math.abs(Math.round(n)) % 3600 / 60), Math.abs(Math.round(n)) % 60].map(v => String(v).padStart(2, '0')).join(':');
const diff = n => n == null ? '—' : `${n < 0 ? '−' : '+'}${time(n)}`;
// Keep the plain formatter for SVG titles; HTML differences get semantic colors.
const coloredDiff = n => {
  const rounded = n == null ? null : Math.round(n);
  const tone = rounded > 0 ? 'positive' : rounded < 0 ? 'negative' : 'neutral';
  return `<span class="time-diff time-diff--${tone}">${diff(rounded)}</span>`;
};
const label = key => labels[key] || `Run ${key.slice(3)}`;
let entries = [], selected = [], cohort = [];
let cumulativeMode = 'gap';
const styles = [
  { stroke: '#111', color: '#0072B2', dash: '' },
  { stroke: '#777', color: '#D55E00', dash: '7 4' },
  { stroke: '#444', color: '#009E73', dash: '2 4' },
];

function categoryEntries() {
  return entries.filter(r => r.division === $('division').value && r.race === $('race').value && r.category === $('category').value);
}

// Store only the active field and selected results. Bib + name survives data reordering.
const selectionStorageKey = 'hyroks.selection.v1';

function saveSelection() {
  if (!entries.length) return;
  try {
    localStorage.setItem(selectionStorageKey, JSON.stringify({
      category: {
        division: $('division').value,
        race: $('race').value,
        category: $('category').value,
      },
      competitors: selected.map(id => entries.find(r => r.id === id))
        .filter(Boolean).map(r => ({ bib: r.bib, name: r.name })),
    }));
  } catch {
    // Storage may be disabled or full; the dashboard still works normally.
  }
}

function restoreSelection() {
  try {
    const saved = JSON.parse(localStorage.getItem(selectionStorageKey));
    const field = saved?.category;
    if (!field || !Array.isArray(saved.competitors)) return false;
    const peers = entries.filter(r => r.division === field.division &&
      r.race === field.race && r.category === field.category);
    if (!peers.length) return false;
    $('division').value = field.division;
    $('race').value = field.race;
    syncCategory();
    $('category').value = field.category;
    // Discard missing results, duplicates and any selections beyond the limit.
    selected = [...new Set(saved.competitors.map(item => peers.find(r =>
      r.bib === item?.bib && r.name === item?.name)?.id).filter(Boolean))].slice(0, 3);
    return true;
  } catch {
    return false;
  }
}

function syncCategory() {
  const previous = $('category').value;
  const options = $('race').value === 'doubles' ? ['Men', 'Women', 'Mixed'] : ['Men', 'Women'];
  $('category').innerHTML = options.map(v => `<option>${v}</option>`).join('');
  if (options.includes(previous)) $('category').value = previous;
}

function renderResults() {
  cohort = categoryEntries();
  const query = normalize($('search').value);
  // Searching spans all divisions so a name can be found without knowing its category.
  const pool = query ? entries : cohort;
  const shown = pool.filter(r => query.split(' ').every(term => r.search.includes(term)));
  $('search-note').textContent = query ? 'Searching all divisions and categories. Open a profile or select a result to switch to its field.' : '';
  $('results').innerHTML = shown.map(r => {
    const peers = entries.filter(p => p.group === r.group);
    const leader = peers.find(p => p.times.finish != null)?.times.finish;
    return `<tr class="${selected.includes(r.id) ? 'selected-row' : ''}"><td><input type="checkbox" data-select="${r.id}" aria-label="Compare ${escape(r.name)}" ${selected.includes(r.id) ? 'checked' : ''}></td><td class="rank">${r.rank || '—'}</td><td><strong>${escape(r.name)}</strong><small>${escape(r.members.join(' · ') || r.bib)}${query ? `<br>${escape(r.groupLabel)}` : ''}</small></td><td>${time(r.times.finish)}</td><td>${r.times.finish != null && leader != null ? coloredDiff(r.times.finish - leader) : '—'}</td><td><button class="profile-button" data-profile="${r.id}">View ↗</button></td></tr>`;
  }).join('') || '<tr><td colspan="6">No results found. Try a different name or team.</td></tr>';
  $('result-count').textContent = `${shown.length} result${shown.length === 1 ? '' : 's'}${query ? ' across all fields' : ` · ${cohort[0]?.groupLabel || ''}`} · Ranks and leader gaps are within each field.`;
}

function choose(id, profile = false) {
  const r = entries.find(e => e.id === id);
  if (!profile && selected.includes(id)) selected = selected.filter(v => v !== id);
  else {
    if (selected.length && entries.find(e => e.id === selected[0]).group !== r.group) selected = [];
    if (profile) selected = [id];
    else if (selected.length >= 3) { $('selection-message').textContent = 'Compare up to 3 results. Remove one to add another.'; renderResults(); return; }
    else selected.push(id);
    $('division').value = r.division; $('race').value = r.race; syncCategory(); $('category').value = r.category;
  }
  $('selection-message').textContent = ''; renderResults(); renderAnalysis();
  if (profile) $('analysis').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}

function mean(key) {
  const values = cohort.map(r => r.times[key]).filter(n => n != null && n > 0);
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

function score(r, key) { const average = mean(key); return average && r.times[key] > 0 ? 100 * average / r.times[key] : null; }

function svg(content, viewBox, title) { return `<svg viewBox="${viewBox}" role="img" aria-label="${escape(title)}"><title>${escape(title)}</title>${content}</svg>`; }

function radar(r, max) {
  const center = 180, radius = 113;
  const point = (i, value) => { const a = i * Math.PI / 4 - Math.PI / 2; return [center + Math.cos(a) * radius * value / max, center + Math.sin(a) * radius * value / max]; };
  const polygon = value => axes.map((_, i) => point(i, value).join(',')).join(' ');
  let content = [50, 100, max].filter((v, i, a) => a.indexOf(v) === i).map(v => `<polygon points="${polygon(v)}" fill="none" stroke="${v === 100 ? '#888' : '#ddd'}" ${v === 100 ? 'stroke-dasharray="4 4"' : ''}/><text x="184" y="${center - radius * v / max - 4}" font-size="9">${v}</text>`).join('');
  content += axes.map((key, i) => { const [x, y] = point(i, max); const [tx, ty] = point(i, max * 1.25); return `<line x1="180" y1="180" x2="${x}" y2="${y}" stroke="#e0e0dc"/><text x="${tx}" y="${ty + 4}" text-anchor="middle" font-size="10">${escape(key === 'bbj' ? 'Burpees' : key === 'farmer' ? 'Carry' : label(key))}</text>`; }).join('');
  const values = axes.map(key => score(r, key));
  if (values.every(v => v != null)) content += `<polygon points="${values.map((v, i) => point(i, v).join(',')).join(' ')}" fill="#111" fill-opacity=".10" stroke="#111" stroke-width="2"/>`;
  content += values.map((v, i) => v == null ? '' : `<circle cx="${point(i, v)[0]}" cy="${point(i, v)[1]}" r="3" fill="#111"><title>${escape(label(axes[i]))}: ${Math.round(v)} / average 100</title></circle>`).join('');
  return svg(content, '0 0 360 360', `${r.name}: performance versus field average. ${axes.map((key, i) => `${label(key)} ${values[i] == null ? 'unavailable' : Math.round(values[i])}`).join(', ')}. Higher is faster.`);
}

function legend(rows) { return `<div class="legend">${rows.map((r, i) => `<span><i style="border-color:${styles[i].color};border-top-style:${i ? 'dashed' : 'solid'}"></i>${escape(r.name)}</span>`).join('')}</div>`; }

function cumulativeChart(rows) {
  const w = 600, h = 285, left = 70, right = 25, top = 25, bottom = 45;
  const cumulative = rows.map(r => {
    let total = 0;
    return [0, ...splits.map(key => {
      // Once a split is missing, later cumulative times are unknown too.
      total = total == null || r.times[key] == null ? null : total + r.times[key];
      return total;
    })];
  });
  const gapMode = rows.length > 1 && cumulativeMode === 'gap';
  const leaders = cumulative[0].map((_, j) => {
    const values = cumulative.map(values => values[j]).filter(v => v != null);
    return values.length ? Math.min(...values) : null;
  });
  const series = cumulative.map(values => values.map((v, j) => v == null ? null : gapMode ? v - leaders[j] : v));
  const highest = Math.max(1, ...series.flat().filter(v => v != null));
  // Round the tick interval up to a readable number of seconds.
  const rawStep = highest / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = Math.max(1, [1, 2, 5, 10].find(n => n * magnitude >= rawStep) * magnitude);
  const max = step * 4;
  const x = i => left + i * (w - left - right) / splits.length;
  const y = v => h - bottom - v / max * (h - top - bottom);
  const axisTime = v => `${gapMode ? '+' : ''}${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;
  let body = `<text x="${left}" y="12" font-size="10">${gapMode ? 'Gap to fastest selected (m:ss)' : 'Elapsed split time (m:ss)'}</text>`;
  for (let i = 0; i <= 4; i++) {
    const v = max * i / 4;
    body += `<line x1="${left}" y1="${y(v)}" x2="${w - right}" y2="${y(v)}" stroke="#ddd"/><text x="${left - 8}" y="${y(v) + 4}" text-anchor="end" font-size="10">${axisTime(v)}</text>`;
  }
  body += series.map((values, i) => {
    const line = `<polyline points="${values.map((v, j) => v == null ? '' : `${x(j)},${y(v)}`).join(' ')}" fill="none" stroke="${styles[i].color}" stroke-dasharray="${styles[i].dash}" stroke-width="2"/>`;
    const points = values.map((v, j) => v == null ? '' : `<circle cx="${x(j)}" cy="${y(v)}" r="3" fill="${styles[i].color}"><title>${escape(rows[i].name)} · ${j ? escape(label(splits[j - 1])) : 'Start'}: ${gapMode ? `${diff(v)} gap · ` : ''}${time(cumulative[i][j])} elapsed</title></circle>`).join('');
    return line + points;
  }).join('');
  body += ['Start', 'Lunges', 'Burpees', 'Ski', 'Sled', 'Row', 'Carry', 'Wall balls'].map((t, i) => `<text x="${x(i * 2)}" y="${h - 20}" text-anchor="middle" font-size="10">${t}</text>`).join('');
  return svg(body, `0 0 ${w} ${h}`, gapMode
    ? 'Cumulative time gap to the fastest selected result at each checkpoint. Zero is the lead; lower is faster. The vertical scale adjusts to the selected results.'
    : 'Cumulative recorded split times at each run and station. Lower is faster. Exact values are in the split table.');
}

function finishChart(rows) {
  const max = Math.max(...rows.map(r => r.times.finish || 0), 1);
  return svg(rows.map((r, i) => { const y = 20 + i * 65; return `<text x="0" y="${y}" font-size="12">${escape(r.name)}</text><rect x="0" y="${y + 10}" width="${(r.times.finish || 0) / max * 430}" height="16" fill="${styles[i].color}"/><text x="440" y="${y + 23}" font-size="12">${time(r.times.finish)}</text>`; }).join(''), `0 0 535 ${rows.length * 65 + 10}`, 'Recorded finish time comparison. Shorter bars are faster.');
}

function renderAnalysis() {
  saveSelection();
  const rows = selected.map(id => entries.find(r => r.id === id));
  $('selection').innerHTML = rows.map(r => `<span class="chip">${escape(r.name)}<button data-remove="${r.id}" aria-label="Remove ${escape(r.name)}">×</button></span>`).join('');
  $('clear').hidden = !rows.length;
  if (!rows.length) { $('charts').innerHTML = '<div class="empty">Select a result above to explore its profile, or choose up to three from the same field to compare.</div>'; return; }
  const validFinishes = rows.map(r => r.times.finish).filter(v => v != null);
  const fastest = validFinishes.length ? Math.min(...validFinishes) : null;
  const max = Math.max(150, Math.ceil(Math.max(...rows.flatMap(r => axes.map(key => score(r, key) || 0))) / 50) * 50);
  $('charts').innerHTML = `<p class="muted">${escape(rows[0].groupLabel)} · ${cohort.length} results in this field</p><div class="chart-grid"><article class="panel"><p class="eyebrow">THE FINISH LINE</p><h3>Time to finish</h3><p>Recorded finish times. Shorter is faster.</p>${finishChart(rows)}</article><article class="panel"><p class="eyebrow">THE RACE UNFOLDS</p><h3>Cumulative split time</h3>${rows.length > 1 ? `<label class="muted">Chart view <select id="cumulative-mode"><option value="gap" ${cumulativeMode === 'gap' ? 'selected' : ''}>Gap to fastest selected</option><option value="elapsed" ${cumulativeMode === 'elapsed' ? 'selected' : ''}>Elapsed time</option></select></label>` : ''}<p>${rows.length > 1 && cumulativeMode === 'gap' ? 'Cumulative gap at each checkpoint. Zero is the fastest selected result; lower is better. Scale adjusts to the gaps.' : 'All runs and stations, in race order. Lower is faster.'}</p>${legend(rows)}<div class="chart-scroll">${cumulativeChart(rows)}</div></article></div><div class="profiles">${rows.map(r => {
    const ranked = axes.map(key => ({ key, value: score(r, key) })).filter(a => a.value != null).sort((a, b) => b.value - a.value);
    return `<article class="profile-card"><p class="eyebrow">${escape(r.bib)} · RANK ${r.rank || '—'} / ${cohort.length}</p><h3>${escape(r.name)}</h3>${r.members.length ? `<p>${escape(r.members.join(' + '))}<br>Shared team performance</p>` : ''}<div class="time">${time(r.times.finish)}</div><p>${r.times.finish != null && fastest != null ? coloredDiff(r.times.finish - fastest) : '—'} to fastest selected</p>${radar(r, max)}<p>Solid: performance · Dashed: field average (100)<br>Higher scores mean faster times.</p><div class="profile-meta"><span>RUN TOTAL<br><strong>${time(r.times.running)}</strong></span><span>STRONGEST RELATIVE SPLIT<br><strong>${ranked.length ? escape(label(ranked[0].key)) : '—'}</strong></span></div></article>`;
  }).join('')}</div><article class="panel"><p class="eyebrow">SECOND BY SECOND</p><h3>Split comparison</h3><p>Differences are relative to the fastest selected result for each row. Negative means faster than the field mean.</p><div class="table-wrap"><table class="split-table"><thead><tr><th scope="col">Split</th>${rows.map(r => `<th scope="col">${escape(r.name)}</th>`).join('')}<th scope="col">Field mean</th></tr></thead><tbody>${[...splits, 'running', 'finish'].map(key => {
    const valid = rows.map(r => r.times[key]).filter(v => v != null), best = valid.length ? Math.min(...valid) : null, avg = mean(key);
    return `<tr><td>${escape(label(key))}</td>${rows.map(r => `<td>${time(r.times[key])}<span class="delta">${r.times[key] != null && best != null ? coloredDiff(r.times[key] - best) : '—'} to best${r.times[key] != null && avg != null ? ` · ${coloredDiff(r.times[key] - avg)} vs mean` : ''}</span></td>`).join('')}<td>${time(avg)}</td></tr>`;
  }).join('')}</tbody></table></div></article>`;
}

async function init() {
  const embedded = $('race-data');
  const bundledData = embedded ? JSON.parse(embedded.textContent) : null;
  const loaded = await Promise.all(sources.map(async ([division, race, file]) => {
    let data;
    if (bundledData) {
      data = bundledData[file];
      if (!data) throw new Error(`Missing bundled data for ${file}`);
    } else {
      const response = await fetch(new URL(`./data/${file}`, document.baseURI));
      if (!response.ok) throw new Error(`Could not load ${file}`);
      data = await response.json();
    }
    return Object.entries(data).flatMap(([category, records]) => records.map((r, index) => {
      const members = Object.values(r.team_members || r.temem || {}).map(n => n.replace(/\s+/g, ' ').trim());
      const times = Object.fromEntries(Object.entries(r.results).map(([k, v]) => [k, seconds(v)]));
      times.running = splits.filter(k => k.startsWith('run')).every(k => times[k] != null) ? splits.filter(k => k.startsWith('run')).reduce((sum, k) => sum + times[k], 0) : null;
      const name = (r.competitor || r.team_name).replace(/\s+/g, ' ').trim();
      return { id: `${division}-${race}-${category}-${index}`, division, race, category, name, members, bib: r.bib, times, group: `${division}-${race}-${category}`, groupLabel: `${division === 'open' ? 'Open' : 'Pro'} / ${race === 'individual' ? 'Individual' : 'Doubles'} / ${category}`, search: normalize([name, ...members, r.bib].join(' ')) };
    }));
  }));
  entries = loaded.flat();
  for (const group of new Set(entries.map(r => r.group))) {
    const peers = entries.filter(r => r.group === group).sort((a, b) => (a.times.finish ?? Infinity) - (b.times.finish ?? Infinity));
    peers.forEach((r, i) => r.rank = r.times.finish == null ? null : peers.findIndex(p => p.times.finish === r.times.finish) + 1);
  }
  entries.sort((a, b) => a.group.localeCompare(b.group) || (a.times.finish ?? Infinity) - (b.times.finish ?? Infinity));
  const individual = entries.filter(r => r.race === 'individual').length, doubles = entries.length - individual;
  $('overview').innerHTML = `<div class="stat"><strong>${individual}</strong><small>Individual results</small></div><div class="stat"><strong>${doubles}</strong><small>Teams</small></div><div class="stat"><strong>14</strong><small>Race splits</small></div>`;
  syncCategory();
  if (!restoreSelection()) {
    cohort = categoryEntries();
    selected = cohort.slice(0, 2).map(r => r.id);
  }
  renderResults();
  renderAnalysis();
}

$('search').addEventListener('input', renderResults);
for (const id of ['division', 'race', 'category']) $(id).addEventListener('change', () => { if (id === 'race') syncCategory(); selected = []; $('selection-message').textContent = ''; renderResults(); renderAnalysis(); });
$('results').addEventListener('change', e => { if (e.target.dataset.select) choose(e.target.dataset.select); });
$('results').addEventListener('click', e => { const button = e.target.closest('[data-profile]'); if (button) choose(button.dataset.profile, true); });
$('selection').addEventListener('click', e => { const button = e.target.closest('[data-remove]'); if (button) choose(button.dataset.remove); });
$('clear').addEventListener('click', () => { selected = []; $('selection-message').textContent = ''; renderResults(); renderAnalysis(); });
init().catch(error => { console.error(error); $('overview').textContent = 'Race data could not be loaded. Please reload the page.'; $('results').innerHTML = '<tr><td colspan="6">Rebuild the site to include race data, or use the dev script to serve the source files.</td></tr>'; });

$('charts').addEventListener('change', e => {
  if (e.target.id === 'cumulative-mode') {
    cumulativeMode = e.target.value;
    renderAnalysis();
  }
});
