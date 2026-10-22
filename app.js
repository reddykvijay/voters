/**
 * Badvel Electors Portal - Single Page Application Engine
 * Assembly Constituency 124-BADVEL (SC)
 * 100% Real Extracted Electoral Roll Data
 */

// Global State
let allVoters = [];
let filteredVoters = [];
let starredEpics = new Set(JSON.parse(localStorage.getItem('starred_voters') || '[]'));
let currentView = 'cards';
let currentPage = 1;
let pageSize = 48;
let currentSort = 'sl_asc';

// Filter State
let filters = {
  searchQuery: '',
  part: 'all',
  section: 'all',
  gender: 'all',
  minAge: 18,
  maxAge: 100,
  relation: 'all',
  houseNo: '',
  onlyStarred: false
};

let currentModalElector = null;

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  updateStarredBadge();
  await loadVoterData();
  populateSectionOptions();
  applyFiltersAndRender();
});

// Load 100% Genuine Voter Data from voters.json or CSV
async function loadVoterData() {
  try {
    const res = await fetch('data/voters.json');
    if (res.ok) {
      allVoters = await res.json();
    } else {
      const csvRes = await fetch('Complete_Badvel_Electors_1177.csv');
      if (csvRes.ok) {
        const text = await csvRes.text();
        allVoters = parseCSVText(text);
      }
    }
  } catch (err) {
    console.error('Error fetching voters.json:', err);
  }

  filteredVoters = [...allVoters];
}

function populateSectionOptions() {
  const sections = Array.from(new Set(allVoters.map(v => v.section).filter(Boolean))).sort();
  const select = document.getElementById('section-select');
  if (!select) return;

  select.innerHTML = '<option value="all">All Sections</option>';
  sections.forEach(sec => {
    const opt = document.createElement('option');
    opt.value = sec;
    opt.textContent = sec;
    select.appendChild(opt);
  });
}

function handleSectionChange() {
  filters.section = document.getElementById('section-select').value;
  currentPage = 1;
  applyFiltersAndRender();
}

function handleSearchInput() {
  const query = document.getElementById('global-search').value.trim();
  filters.searchQuery = query;
  
  const clearBtn = document.getElementById('clear-search-btn');
  if (query) {
    clearBtn.classList.remove('hidden');
  } else {
    clearBtn.classList.add('hidden');
  }

  currentPage = 1;
  applyFiltersAndRender();
}

function clearSearch() {
  document.getElementById('global-search').value = '';
  document.getElementById('clear-search-btn').classList.add('hidden');
  filters.searchQuery = '';
  currentPage = 1;
  applyFiltersAndRender();
}

function setPartFilter(part) {
  filters.part = part;
  document.querySelectorAll('.part-btn').forEach(btn => {
    const isSelected = String(btn.dataset.part) === String(part);
    if (isSelected) {
      btn.className = 'part-btn px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 transition';
    } else {
      btn.className = 'part-btn px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition';
    }
  });
  currentPage = 1;
  applyFiltersAndRender();
}

function setGenderFilter(gender) {
  filters.gender = gender;
  document.querySelectorAll('.gender-btn').forEach(btn => {
    const isSelected = btn.dataset.gender === gender;
    if (isSelected) {
      btn.className = 'gender-btn px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 transition';
    } else {
      btn.className = 'gender-btn px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition';
    }
  });
  currentPage = 1;
  applyFiltersAndRender();
}

function handleAgeRangeChange() {
  const minVal = parseInt(document.getElementById('age-min').value);
  const maxVal = parseInt(document.getElementById('age-max').value);
  filters.minAge = Math.min(minVal, maxVal);
  filters.maxAge = Math.max(minVal, maxVal);
  document.getElementById('age-range-display').textContent = `${filters.minAge} - ${filters.maxAge} yrs`;
  currentPage = 1;
  applyFiltersAndRender();
}

function setQuickAge(min, max) {
  document.getElementById('age-min').value = min;
  document.getElementById('age-max').value = max;
  handleAgeRangeChange();
}

function handleRelationFilterChange() {
  filters.relation = document.getElementById('relation-select').value;
  currentPage = 1;
  applyFiltersAndRender();
}

function handleHouseFilterInput() {
  filters.houseNo = document.getElementById('house-filter-input').value.trim();
  currentPage = 1;
  applyFiltersAndRender();
}

function toggleStarredFilter() {
  filters.onlyStarred = !filters.onlyStarred;
  const btn = document.getElementById('starred-filter-btn');
  if (filters.onlyStarred) {
    btn.classList.add('bg-amber-50', 'border-amber-400', 'text-amber-600', 'dark:bg-amber-950/40');
  } else {
    btn.classList.remove('bg-amber-50', 'border-amber-400', 'text-amber-600', 'dark:bg-amber-950/40');
  }
  currentPage = 1;
  applyFiltersAndRender();
}

function toggleFilterDrawer() {
  const drawer = document.getElementById('filter-drawer');
  drawer.classList.toggle('hidden');
}

function handleSortChange() {
  currentSort = document.getElementById('sort-select').value;
  applyFiltersAndRender();
}

function setSortFromHeader(column) {
  if (column === 'sl') {
    currentSort = currentSort === 'sl_asc' ? 'sl_desc' : 'sl_asc';
  } else if (column === 'name') {
    currentSort = currentSort === 'name_asc' ? 'name_desc' : 'name_asc';
  } else if (column === 'age') {
    currentSort = currentSort === 'age_asc' ? 'age_desc' : 'age_asc';
  } else if (column === 'house') {
    currentSort = 'house_asc';
  }
  document.getElementById('sort-select').value = currentSort;
  applyFiltersAndRender();
}

function resetAllFilters() {
  filters = {
    searchQuery: '',
    part: 'all',
    section: 'all',
    gender: 'all',
    minAge: 18,
    maxAge: 100,
    relation: 'all',
    houseNo: '',
    onlyStarred: false
  };

  document.getElementById('global-search').value = '';
  document.getElementById('clear-search-btn').classList.add('hidden');
  document.getElementById('age-min').value = 18;
  document.getElementById('age-max').value = 100;
  document.getElementById('age-range-display').textContent = '18 - 100 yrs';
  document.getElementById('relation-select').value = 'all';
  if (document.getElementById('section-select')) document.getElementById('section-select').value = 'all';
  document.getElementById('house-filter-input').value = '';
  document.getElementById('sort-select').value = 'sl_asc';
  currentSort = 'sl_asc';

  document.getElementById('starred-filter-btn').classList.remove('bg-amber-50', 'border-amber-400', 'text-amber-600', 'dark:bg-amber-950/40');

  setPartFilter('all');
  setGenderFilter('all');
}

// Core Filter & Sort Algorithm
function applyFiltersAndRender() {
  const q = filters.searchQuery.toLowerCase();
  const houseQuery = filters.houseNo.toLowerCase();

  filteredVoters = allVoters.filter(v => {
    // Universal text search
    if (q) {
      const matchName = v.name && v.name.toLowerCase().includes(q);
      const matchEpic = v.epic && v.epic.toLowerCase().includes(q);
      const matchRel = v.relativeName && v.relativeName.toLowerCase().includes(q);
      const matchHouse = v.houseNo && v.houseNo.toLowerCase().includes(q);
      const matchSl = String(v.slNo) === q;
      if (!matchName && !matchEpic && !matchRel && !matchHouse && !matchSl) {
        return false;
      }
    }

    // Part filter
    if (filters.part !== 'all' && String(v.partNo) !== String(filters.part)) {
      return false;
    }

    // Section filter
    if (filters.section !== 'all' && v.section !== filters.section) {
      return false;
    }

    // Gender filter
    if (filters.gender !== 'all' && v.gender !== filters.gender) {
      return false;
    }

    // Age range
    const age = Number(v.age);
    if (age && (age < filters.minAge || age > filters.maxAge)) {
      return false;
    }

    // Relation type
    if (filters.relation !== 'all') {
      const rel = (v.relationType || '').toLowerCase();
      if (!rel.includes(filters.relation)) {
        return false;
      }
    }

    // Specific House No filter
    if (houseQuery && (!v.houseNo || !v.houseNo.toLowerCase().includes(houseQuery))) {
      return false;
    }

    // Only starred
    if (filters.onlyStarred && !starredEpics.has(v.epic)) {
      return false;
    }

    return true;
  });

  // Sorting
  filteredVoters.sort((a, b) => {
    if (currentSort === 'sl_asc') {
      return (Number(a.partNo) - Number(b.partNo)) || (Number(a.slNo) - Number(b.slNo));
    } else if (currentSort === 'sl_desc') {
      return (Number(b.partNo) - Number(a.partNo)) || (Number(b.slNo) - Number(a.slNo));
    } else if (currentSort === 'name_asc') {
      return (a.name || '').localeCompare(b.name || '');
    } else if (currentSort === 'name_desc') {
      return (b.name || '').localeCompare(a.name || '');
    } else if (currentSort === 'age_asc') {
      return (Number(a.age) || 0) - (Number(b.age) || 0);
    } else if (currentSort === 'age_desc') {
      return (Number(b.age) || 0) - (Number(a.age) || 0);
    } else if (currentSort === 'house_asc') {
      return (a.houseNo || '').localeCompare(b.houseNo || '', undefined, { numeric: true });
    }
    return 0;
  });

  updateMetrics();
  renderCurrentView();
  renderPrintSlips();
}

// Update Top KPI Summary Metrics
function updateMetrics() {
  const total = filteredVoters.length;
  const originalTotal = allVoters.length || 1;
  const pct = Math.round((total / originalTotal) * 100);

  const males = filteredVoters.filter(v => v.gender === 'Male').length;
  const females = filteredVoters.filter(v => v.gender === 'Female').length;
  const malePct = total > 0 ? ((males / total) * 100).toFixed(1) : '0';
  const femalePct = total > 0 ? ((females / total) * 100).toFixed(1) : '0';

  const sexRatio = males > 0 ? Math.round((females / males) * 1000) : 0;

  // Distinct households
  const houses = new Set(filteredVoters.map(v => v.houseNo).filter(Boolean));
  const avgFamily = houses.size > 0 ? (total / houses.size).toFixed(1) : '0';

  // Average age
  const validAges = filteredVoters.map(v => Number(v.age)).filter(a => a > 0);
  const avgAge = validAges.length > 0 ? (validAges.reduce((a, b) => a + b, 0) / validAges.length).toFixed(1) : '0';

  document.getElementById('stat-total').textContent = total.toLocaleString();
  document.getElementById('stat-filtered-pill').textContent = `${pct}% of total`;
  document.getElementById('stat-male').textContent = males.toLocaleString();
  document.getElementById('stat-male-pct').textContent = `${malePct}%`;
  document.getElementById('stat-female').textContent = females.toLocaleString();
  document.getElementById('stat-female-pct').textContent = `${femalePct}%`;
  document.getElementById('stat-sex-ratio').textContent = sexRatio.toLocaleString();
  document.getElementById('stat-households').textContent = houses.size.toLocaleString();
  document.getElementById('stat-avg-family').textContent = `~${avgFamily} / hs`;
  document.getElementById('stat-avg-age').textContent = avgAge;

  document.getElementById('results-count').textContent = total.toLocaleString();

  const isFilterActive = filters.part !== 'all' || filters.section !== 'all' || filters.gender !== 'all' || filters.minAge > 18 || filters.maxAge < 100 || filters.relation !== 'all' || filters.houseNo;
  const badge = document.getElementById('active-filter-badge');
  if (isFilterActive) {
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function setViewMode(view) {
  currentView = view;
  const views = ['cards', 'table', 'households', 'analytics'];
  
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    const btn = document.getElementById(`view-${v}-btn`);
    if (v === view) {
      el.classList.remove('hidden');
      btn.className = 'p-1.5 rounded-md text-xs font-semibold transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm';
    } else {
      el.classList.add('hidden');
      btn.className = 'p-1.5 rounded-md text-xs font-medium transition-all text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white';
    }
  });

  const paginationControls = document.getElementById('pagination-controls');
  if (view === 'analytics') {
    paginationControls.classList.add('hidden');
  } else {
    paginationControls.classList.remove('hidden');
  }

  renderCurrentView();
  lucide.createIcons();
}

function renderCurrentView() {
  if (currentView === 'cards') {
    renderCardsView();
  } else if (currentView === 'table') {
    renderTableView();
  } else if (currentView === 'households') {
    renderHouseholdsView();
  } else if (currentView === 'analytics') {
    renderAnalyticsView();
  }
  updatePagination();
  lucide.createIcons();
}

// VIEW 1: VOTER CARDS
function renderCardsView() {
  const container = document.getElementById('cards-container');
  container.innerHTML = '';

  const pagedVoters = getPagedRecords();
  if (pagedVoters.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400">
        <i data-lucide="search-x" class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3"></i>
        <h4 class="text-base font-bold text-slate-700 dark:text-slate-200">No matching electors found</h4>
        <p class="text-xs mt-1">Try relaxing your search terms or clearing active filters.</p>
        <button onclick="resetAllFilters()" class="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-sm hover:bg-indigo-700">Reset Filters</button>
      </div>
    `;
    return;
  }

  pagedVoters.forEach(v => {
    const isStarred = starredEpics.has(v.epic);
    const genderColor = v.gender === 'Male' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
    
    const card = document.createElement('div');
    card.className = 'voter-card bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden';
    card.innerHTML = `
      <!-- Top Card Header: Sl No, Part No, EPIC -->
      <div>
        <div class="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-1.5">
            <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono">
              #${v.slNo}
            </span>
            <span class="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              Part ${v.partNo}
            </span>
          </div>

          <div class="flex items-center gap-1">
            <button onclick="copyToClipboard('${v.epic}', event)" title="Click to copy EPIC" class="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md transition">
              <span>${v.epic}</span>
              <i data-lucide="copy" class="w-3 h-3 opacity-60"></i>
            </button>
            <button onclick="toggleStar('${v.epic}', event)" title="Bookmark voter" class="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <i data-lucide="star" class="w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}"></i>
            </button>
          </div>
        </div>

        <!-- Name & Details -->
        <div class="cursor-pointer" onclick="openDetailModal('${v.epic}')">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 transition">
            ${highlightMatch(v.name, filters.searchQuery)}
          </h3>

          <div class="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <div class="flex items-center gap-1 truncate">
              <span class="text-slate-400 text-[11px] min-w-[70px]">${v.relationType || 'Relative'}:</span>
              <span class="font-medium truncate">${highlightMatch(v.relativeName, filters.searchQuery)}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-slate-400 text-[11px] min-w-[70px]">House No:</span>
              <button onclick="filterByHouse('${v.houseNo}', event)" class="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                ${highlightMatch(v.houseNo || 'N/A', filters.searchQuery)}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Card Footer: Age, Gender, Action -->
      <div class="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div class="flex items-center gap-1.5">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${genderColor}">
            ${v.gender}
          </span>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Age ${v.age}
          </span>
        </div>

        <button onclick="openDetailModal('${v.epic}')" class="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1">
          Details <i data-lucide="chevron-right" class="w-3 h-3"></i>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

// VIEW 2: DATA TABLE
function renderTableView() {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = '';

  const pagedVoters = getPagedRecords();
  if (pagedVoters.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="py-12 text-center text-slate-400">
          No matching records found.
        </td>
      </tr>
    `;
    return;
  }

  pagedVoters.forEach(v => {
    const isStarred = starredEpics.has(v.epic);
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition cursor-pointer';
    tr.onclick = (e) => {
      if (!e.target.closest('button')) {
        openDetailModal(v.epic);
      }
    };
    tr.innerHTML = `
      <td class="py-2.5 px-4 font-mono font-medium text-slate-500">${v.partNo}</td>
      <td class="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white">#${v.slNo}</td>
      <td class="py-2.5 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">${v.epic}</td>
      <td class="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">${highlightMatch(v.name, filters.searchQuery)}</td>
      <td class="py-2.5 px-4 text-slate-500">${v.relationType || "Father's Name"}</td>
      <td class="py-2.5 px-4 font-medium text-slate-700 dark:text-slate-300">${highlightMatch(v.relativeName, filters.searchQuery)}</td>
      <td class="py-2.5 px-4 font-medium">
        <button onclick="filterByHouse('${v.houseNo}', event)" class="text-indigo-600 dark:text-indigo-400 hover:underline">
          ${v.houseNo}
        </button>
      </td>
      <td class="py-2.5 px-4 font-mono">${v.age}</td>
      <td class="py-2.5 px-4">
        <span class="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${v.gender === 'Male' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'}">
          ${v.gender}
        </span>
      </td>
      <td class="py-2.5 px-4 text-slate-400 text-[10px] truncate max-w-[140px]">${v.section || '-'}</td>
      <td class="py-2.5 px-4 text-center">
        <div class="flex items-center justify-center gap-1">
          <button onclick="toggleStar('${v.epic}', event)" title="Bookmark" class="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
            <i data-lucide="star" class="w-3.5 h-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}"></i>
          </button>
          <button onclick="copyToClipboard('${v.epic}', event)" title="Copy EPIC" class="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// VIEW 3: HOUSEHOLDS
function renderHouseholdsView() {
  const container = document.getElementById('households-container');
  container.innerHTML = '';

  const houseMap = new Map();
  filteredVoters.forEach(v => {
    const h = v.houseNo || 'Unknown';
    if (!houseMap.has(h)) {
      houseMap.set(h, []);
    }
    houseMap.get(h).push(v);
  });

  document.getElementById('household-total-badge').textContent = `${houseMap.size} Households`;

  const sortedHouses = Array.from(houseMap.entries()).sort((a, b) => b[1].length - a[1].length);

  sortedHouses.slice(0, 60).forEach(([houseNo, members]) => {
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between';
    
    let membersHtml = members.map(m => `
      <li class="py-1.5 flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800/60 last:border-none">
        <div class="truncate pr-2">
          <span class="font-bold text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600" onclick="openDetailModal('${m.epic}')">${m.name}</span>
          <span class="text-[10px] text-slate-400 block">${m.relationType}: ${m.relativeName}</span>
        </div>
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <span class="text-[10px] font-mono text-slate-500">${m.age}y</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded font-semibold ${m.gender === 'Male' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300'}">${m.gender[0]}</span>
        </div>
      </li>
    `).join('');

    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <i data-lucide="home" class="w-4 h-4"></i>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-bold block">House Number</span>
              <strong class="text-sm font-bold text-slate-900 dark:text-white">${houseNo}</strong>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
            ${members.length} Voters
          </span>
        </div>

        <ul class="space-y-0.5 max-h-56 overflow-y-auto pr-1">
          ${membersHtml}
        </ul>
      </div>

      <div class="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
        <span class="text-[11px] text-slate-400">Part: ${members[0].partNo}</span>
        <button onclick="filterByHouse('${houseNo}')" class="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold text-[11px]">
          Focus House &rarr;
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

// VIEW 4: ANALYTICS
function renderAnalyticsView() {
  const brackets = [
    { label: 'Youth (18 - 25 yrs)', min: 18, max: 25, color: 'bg-indigo-500' },
    { label: 'Young Adults (26 - 35 yrs)', min: 26, max: 35, color: 'bg-blue-500' },
    { label: 'Middle Aged (36 - 50 yrs)', min: 36, max: 50, color: 'bg-emerald-500' },
    { label: 'Mature Adults (51 - 65 yrs)', min: 51, max: 65, color: 'bg-amber-500' },
    { label: 'Senior Citizens (65+ yrs)', min: 66, max: 120, color: 'bg-rose-500' },
  ];

  const total = filteredVoters.length || 1;
  const ageChart = document.getElementById('age-chart-bars');
  ageChart.innerHTML = '';

  brackets.forEach(b => {
    const count = filteredVoters.filter(v => Number(v.age) >= b.min && Number(v.age) <= b.max).length;
    const pct = ((count / total) * 100).toFixed(1);
    
    ageChart.innerHTML += `
      <div>
        <div class="flex justify-between text-xs font-medium mb-1">
          <span class="text-slate-700 dark:text-slate-300">${b.label}</span>
          <span class="font-bold text-slate-900 dark:text-white">${count.toLocaleString()} (${pct}%)</span>
        </div>
        <div class="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
          <div class="${b.color} h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  });

  const part285 = filteredVoters.filter(v => String(v.partNo) === '285');
  const part286 = filteredVoters.filter(v => String(v.partNo) === '286');

  const partBars = document.getElementById('gender-part-bars');
  partBars.innerHTML = '';

  [
    { name: 'Part 285 (Dakshanaramapuram)', list: part285 },
    { name: 'Part 286 (Ramapuram / S.C Colony)', list: part286 }
  ].forEach(p => {
    const pTotal = p.list.length || 1;
    const m = p.list.filter(v => v.gender === 'Male').length;
    const f = p.list.filter(v => v.gender === 'Female').length;
    const mPct = ((m / pTotal) * 100).toFixed(1);
    const fPct = ((f / pTotal) * 100).toFixed(1);

    partBars.innerHTML += `
      <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
        <div class="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
          <span>${p.name}</span>
          <span>${p.list.length} Voters</span>
        </div>
        <div class="flex h-3 rounded-full overflow-hidden mb-1.5">
          <div class="bg-blue-500 h-full" style="width: ${mPct}%" title="Male: ${m} (${mPct}%)"></div>
          <div class="bg-rose-500 h-full" style="width: ${fPct}%" title="Female: ${f} (${fPct}%)"></div>
        </div>
        <div class="flex justify-between text-[11px] text-slate-500">
          <span class="text-blue-600 dark:text-blue-400">Male: ${m} (${mPct}%)</span>
          <span class="text-rose-600 dark:text-rose-400">Female: ${f} (${fPct}%)</span>
        </div>
      </div>
    `;
  });

  const surnameCount = {};
  filteredVoters.forEach(v => {
    if (v.name) {
      const parts = v.name.split(/\s+/);
      const token = parts[parts.length - 1];
      if (token && token.length > 2 && !['REDDY', 'KUMAR', 'RAO', 'DEVI'].includes(token.toUpperCase())) {
        surnameCount[token] = (surnameCount[token] || 0) + 1;
      }
    }
  });

  const sortedSurnames = Object.entries(surnameCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const surnamesList = document.getElementById('surnames-list');
  surnamesList.innerHTML = sortedSurnames.map(([name, count]) => `
    <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs">
      <span class="font-bold text-slate-800 dark:text-slate-200">${name}</span>
      <span class="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold font-mono">${count} electors</span>
    </div>
  `).join('');

  const houseMap = {};
  filteredVoters.forEach(v => {
    if (v.houseNo) {
      houseMap[v.houseNo] = (houseMap[v.houseNo] || 0) + 1;
    }
  });
  const topHouses = Object.entries(houseMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topHousesList = document.getElementById('top-households-list');
  topHousesList.innerHTML = topHouses.map(([house, count]) => `
    <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onclick="filterByHouse('${house}')">
      <div class="flex items-center gap-2">
        <i data-lucide="home" class="w-3.5 h-3.5 text-amber-500"></i>
        <span class="font-bold text-slate-800 dark:text-slate-200">House #${house}</span>
      </div>
      <span class="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold font-mono">${count} voters</span>
    </div>
  `).join('');
}

function renderPrintSlips() {
  const printContainer = document.getElementById('print-container');
  printContainer.innerHTML = '';

  const printGrid = document.createElement('div');
  printGrid.className = 'print-grid';

  const printItems = filteredVoters.slice(0, 300);

  printItems.forEach(v => {
    const slip = document.createElement('div');
    slip.className = 'print-slip';
    slip.innerHTML = `
      <div>
        <div class="print-slip-header">
          <span>AC 124-BADVEL</span>
          <span>Part: ${v.partNo} &bull; Sl: #${v.slNo}</span>
        </div>
        <div class="print-slip-epic">${v.epic}</div>
        <div class="print-slip-name">${v.name}</div>
        <div><strong>${v.relationType || "Relative"}:</strong> ${v.relativeName}</div>
        <div><strong>House No:</strong> ${v.houseNo || '-'}</div>
      </div>
      <div class="print-slip-footer">
        <span>Age: ${v.age} yrs</span>
        <span>Gender: ${v.gender}</span>
        <span>Polling: Stn ${v.partNo}</span>
      </div>
    `;
    printGrid.appendChild(slip);
  });

  printContainer.appendChild(printGrid);
}

function getPagedRecords() {
  if (pageSize === 'all') {
    return filteredVoters;
  }
  const start = (currentPage - 1) * pageSize;
  return filteredVoters.slice(start, start + pageSize);
}

function updatePagination() {
  const total = filteredVoters.length;
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(total / pageSize);
  
  document.getElementById('pagination-info').textContent = `Page ${currentPage} of ${totalPages || 1}`;
  document.getElementById('current-page-num').textContent = `Page ${currentPage}`;

  document.getElementById('prev-page-btn').disabled = currentPage <= 1;
  document.getElementById('next-page-btn').disabled = currentPage >= totalPages;
}

function goToPage(page) {
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(filteredVoters.length / pageSize);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderCurrentView();
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }
}

function handlePageSizeChange() {
  const val = document.getElementById('page-size-select').value;
  pageSize = val === 'all' ? 'all' : parseInt(val);
  currentPage = 1;
  renderCurrentView();
}

function openDetailModal(epic) {
  const voter = allVoters.find(v => v.epic === epic);
  if (!voter) return;

  currentModalElector = voter;
  document.getElementById('modal-name').textContent = voter.name;
  document.getElementById('modal-epic').textContent = voter.epic;
  document.getElementById('modal-relative').textContent = voter.relativeName || 'N/A';
  document.getElementById('modal-rel-type').textContent = voter.relationType || "Father's Name";
  document.getElementById('modal-house').textContent = voter.houseNo || 'N/A';
  document.getElementById('modal-age-gender').textContent = `${voter.age} yrs • ${voter.gender}`;
  document.getElementById('modal-part-sl').textContent = `Part ${voter.partNo} • Serial #${voter.slNo}`;
  document.getElementById('modal-section').textContent = voter.section || 'N/A';

  const familyList = document.getElementById('modal-family-list');
  familyList.innerHTML = '';
  
  if (voter.houseNo) {
    const coResidents = allVoters.filter(v => v.houseNo === voter.houseNo && v.epic !== voter.epic);
    if (coResidents.length > 0) {
      coResidents.forEach(c => {
        familyList.innerHTML += `
          <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 transition cursor-pointer" onclick="openDetailModal('${c.epic}')">
            <div>
              <span class="font-bold text-slate-800 dark:text-slate-200">${c.name}</span>
              <span class="text-[10px] text-slate-400 block">${c.relationType}: ${c.relativeName}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="font-mono text-[10px] text-slate-400">${c.age}y</span>
              <span class="text-[10px] font-bold ${c.gender === 'Male' ? 'text-blue-500' : 'text-rose-500'}">${c.gender[0]}</span>
            </div>
          </div>
        `;
      });
    } else {
      familyList.innerHTML = `<span class="text-slate-400 italic">No other co-residents recorded in house ${voter.houseNo}</span>`;
    }
  } else {
    familyList.innerHTML = `<span class="text-slate-400 italic">No house number available</span>`;
  }

  const isStarred = starredEpics.has(voter.epic);
  document.getElementById('modal-star-text').textContent = isStarred ? 'Unstar Voter' : 'Star Voter';

  document.getElementById('detail-modal').classList.remove('hidden');
  lucide.createIcons();
}

function closeDetailModal() {
  document.getElementById('detail-modal').classList.add('hidden');
  currentModalElector = null;
}

function filterByHouseFromModal() {
  if (currentModalElector && currentModalElector.houseNo) {
    filterByHouse(currentModalElector.houseNo);
    closeDetailModal();
  }
}

function filterByHouse(houseNo, event) {
  if (event) event.stopPropagation();
  document.getElementById('house-filter-input').value = houseNo;
  filters.houseNo = houseNo;
  currentPage = 1;
  applyFiltersAndRender();
  showToast(`Filtering for House #${houseNo}`);
}

function toggleModalStar() {
  if (!currentModalElector) return;
  toggleStar(currentModalElector.epic);
  const isStarred = starredEpics.has(currentModalElector.epic);
  document.getElementById('modal-star-text').textContent = isStarred ? 'Unstar Voter' : 'Star Voter';
}

function printSingleSlipFromModal() {
  if (!currentModalElector) return;
  const printContainer = document.getElementById('print-container');
  printContainer.innerHTML = `
    <div class="print-grid" style="grid-template-columns: 1fr; max-width: 350px; margin: 40px auto;">
      <div class="print-slip" style="padding: 20px; font-size: 11pt; border: 2px dashed #000;">
        <div class="print-slip-header" style="font-size: 11pt;">
          <span>AC 124-BADVEL</span>
          <span>Part: ${currentModalElector.partNo} &bull; Sl: #${currentModalElector.slNo}</span>
        </div>
        <div class="print-slip-epic" style="font-size: 13pt; margin: 8px 0;">${currentModalElector.epic}</div>
        <div class="print-slip-name" style="font-size: 14pt;">${currentModalElector.name}</div>
        <div style="margin: 6px 0;"><strong>${currentModalElector.relationType || 'Relative'}:</strong> ${currentModalElector.relativeName}</div>
        <div style="margin: 6px 0;"><strong>House No:</strong> ${currentModalElector.houseNo || '-'}</div>
        <div class="print-slip-footer" style="font-size: 11pt; margin-top: 12px; padding-top: 8px;">
          <span>Age: ${currentModalElector.age} yrs</span>
          <span>Gender: ${currentModalElector.gender}</span>
        </div>
      </div>
    </div>
  `;
  window.print();
  renderPrintSlips();
}

function toggleStar(epic, event) {
  if (event) event.stopPropagation();
  if (starredEpics.has(epic)) {
    starredEpics.delete(epic);
    showToast('Removed bookmark');
  } else {
    starredEpics.add(epic);
    showToast('Bookmarked voter');
  }
  localStorage.setItem('starred_voters', JSON.stringify(Array.from(starredEpics)));
  updateStarredBadge();
  renderCurrentView();
}

function updateStarredBadge() {
  document.getElementById('starred-count-badge').textContent = starredEpics.size;
}

function copyToClipboard(text, event) {
  if (event) event.stopPropagation();
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Copied ${text}`);
  }).catch(() => {
    showToast('Failed to copy');
  });
}

function highlightMatch(text, query) {
  if (!text) return '';
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-amber-200 dark:bg-amber-800 text-inherit rounded px-0.5">$1</mark>');
}

let toastTimeout;
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-message').textContent = msg;
  toast.classList.remove('opacity-0', 'translate-y-12', 'pointer-events-none');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-12', 'pointer-events-none');
  }, 2200);
}

function initTheme() {
  if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function toggleDarkMode() {
  if (document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
}

function toggleExportMenu() {
  document.getElementById('export-menu').classList.toggle('hidden');
}

document.addEventListener('click', (e) => {
  const menu = document.getElementById('export-menu');
  const btn = document.getElementById('export-btn');
  if (menu && !menu.contains(e.target) && !btn.contains(e.target)) {
    menu.classList.add('hidden');
  }
});

function exportToCSV() {
  const headers = ['Part No', 'Sl No', 'EPIC No', 'Name', 'Relation Type', 'Relative Name', 'House No', 'Age', 'Gender', 'Section'];
  const rows = filteredVoters.map(v => [
    v.partNo,
    v.slNo,
    `"${v.epic}"`,
    `"${(v.name || '').replace(/"/g, '""')}"`,
    `"${(v.relationType || '').replace(/"/g, '""')}"`,
    `"${(v.relativeName || '').replace(/"/g, '""')}"`,
    `"${(v.houseNo || '').replace(/"/g, '""')}"`,
    v.age,
    v.gender,
    `"${(v.section || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  downloadBlob(csvContent, 'Complete_Badvel_Electors_Filtered.csv', 'text/csv;charset=utf-8;');
  showToast(`Exported ${filteredVoters.length} records to CSV`);
}

function exportToJSON() {
  const jsonContent = JSON.stringify(filteredVoters, null, 2);
  downloadBlob(jsonContent, 'Badvel_Electors_Filtered.json', 'application/json');
  showToast(`Exported ${filteredVoters.length} records to JSON`);
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function openImportModal() {
  document.getElementById('import-modal').classList.remove('hidden');
}

function closeImportModal() {
  document.getElementById('import-modal').classList.add('hidden');
}

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const text = evt.target.result;
    if (file.name.endsWith('.json')) {
      try {
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          allVoters = json;
          showToast(`Imported ${allVoters.length} records from JSON`);
          populateSectionOptions();
          applyFiltersAndRender();
          closeImportModal();
        }
      } catch (err) {
        alert('Invalid JSON file format');
      }
    } else {
      const parsed = parseCSVText(text);
      if (parsed && parsed.length > 0) {
        allVoters = parsed;
        showToast(`Imported ${allVoters.length} records from CSV`);
        populateSectionOptions();
        applyFiltersAndRender();
        closeImportModal();
      } else {
        alert('Could not parse voter records from CSV');
      }
    }
  };
  reader.readAsText(file);
}

function parseCSVText(csv) {
  const lines = csv.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const row = [];
    let inQuote = false;
    let entry = '';
    for (let char of lines[i]) {
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        row.push(entry.trim().replace(/^"|"$/g, ''));
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim().replace(/^"|"$/g, ''));

    if (row.length >= 5) {
      records.push({
        partNo: row[0] || '285',
        slNo: parseInt(row[1]) || i,
        epic: row[2] || '',
        name: row[3] || '',
        relationType: row[4] || "Father's Name",
        relativeName: row[5] || '',
        houseNo: row[6] || '',
        age: parseInt(row[7]) || 30,
        gender: row[8] || 'Male',
        section: row[9] || ''
      });
    }
  }
  return records;
}
