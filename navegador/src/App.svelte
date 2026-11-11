<script>
  import { onMount } from 'svelte';
  import { marked } from 'marked';
  import catalog from './lib/catalog.json';

  const baseUrl = import.meta.env.BASE_URL;
  const counts = {
    grades: catalog.grades.length,
    bimesters: catalog.grades.reduce((sum, grade) => sum + grade.bimesters.length, 0),
    sheets: catalog.grades.reduce((sum, grade) => sum + grade.sheetCount, 0),
  };

  let activeLevel = 'Primaria';
  let selectedGradeId = catalog.grades[0]?.id ?? '';
  let search = '';
  let openBimester = '';
  let shownPlanId = '';
  let theme = 'light';
  let planHtmlCache = {};
  let loadingPlanId = '';
  let planLoadErrorId = '';
  let planResults = [];
  let planSearchLoading = false;
  let planSearchPromise;
  let searchTimer;

  onMount(() => {
    const saved = localStorage.getItem('planificacion-theme');
    theme = saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
  });

  $: currentGrades = catalog.grades.filter((grade) => grade.level === activeLevel);
  $: selectedGrade = catalog.grades.find((grade) => grade.id === selectedGradeId) ?? currentGrades[0];
  $: normalizedSearch = search.trim().toLocaleLowerCase('es');
  $: if (normalizedSearch) schedulePlanSearch(normalizedSearch);
  $: if (!normalizedSearch) {
    clearTimeout(searchTimer);
    planResults = [];
    planSearchLoading = false;
  }
  $: searchResults = normalizedSearch
    ? catalog.grades.flatMap((grade) => grade.bimesters.flatMap((bimester) =>
        bimester.sheets
          .filter((sheet) => `${grade.label} ${grade.level} ${bimester.label} ${bimester.title} ${sheet.title}`.toLocaleLowerCase('es').includes(normalizedSearch))
          .map((sheet) => ({ ...sheet, grade, bimester }))))
    : [];

  function chooseLevel(level) {
    activeLevel = level;
    const first = catalog.grades.find((grade) => grade.level === level);
    if (first) selectedGradeId = first.id;
    openBimester = '';
    shownPlanId = '';
  }

  function chooseGrade(grade) {
    selectedGradeId = grade.id;
    openBimester = '';
    shownPlanId = '';
  }

  function schedulePlanSearch(query) {
    clearTimeout(searchTimer);
    planResults = [];
    planSearchLoading = true;
    searchTimer = setTimeout(() => runPlanSearch(query), 180);
  }

  async function runPlanSearch(query) {
    try {
      planSearchPromise ??= fetch(`${baseUrl}plan-search.json`).then((response) => {
        if (!response.ok) throw new Error('No se pudo cargar el índice de búsqueda.');
        return response.json();
      });
      const index = await planSearchPromise;
      if (query !== normalizedSearch) return;
      const matchingIds = new Set(index.filter((entry) => entry.text.includes(query)).map((entry) => entry.id));
      planResults = catalog.grades.flatMap((grade) => grade.bimesters
        .filter((bimester) => matchingIds.has(bimester.id))
        .map((bimester) => ({ grade, bimester })));
    } catch {
      planResults = [];
    } finally {
      if (query === normalizedSearch) planSearchLoading = false;
    }
  }

  async function loadPlan(bimester) {
    if (planHtmlCache[bimester.id] || loadingPlanId === bimester.id) return;
    loadingPlanId = bimester.id;
    planLoadErrorId = '';
    try {
      const response = await fetch(`${baseUrl}${bimester.markdownPath}`);
      if (!response.ok) throw new Error('No se pudo cargar el plan.');
      const markdown = await response.text();
      planHtmlCache = { ...planHtmlCache, [bimester.id]: marked.parse(markdown) };
    } catch {
      planLoadErrorId = bimester.id;
    } finally {
      if (loadingPlanId === bimester.id) loadingPlanId = '';
    }
  }

  function togglePlan(bimester) {
    openBimester = bimester.code;
    if (shownPlanId === bimester.id) {
      shownPlanId = '';
      return;
    }
    shownPlanId = bimester.id;
    loadPlan(bimester);
  }

  function showSearchPlan(result) {
    activeLevel = result.grade.level;
    selectedGradeId = result.grade.id;
    openBimester = result.bimester.code;
    shownPlanId = result.bimester.id;
    search = '';
    loadPlan(result.bimester);
    setTimeout(() => document.getElementById(`plan-${result.bimester.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('planificacion-theme', theme);
  }
</script>

<svelte:head>
  <title>Computación 2027 · Planificaciones</title>
  <meta name="description" content="Planificaciones de Computación 2027 y hojas imprimibles por nivel, grado y bimestre." />
</svelte:head>

<header class="topbar">
  <a class="brand" href="https://github.com/Diego2326/planificacion-computacion-2027" aria-label="Repositorio de planificación 2027">
    <img src={`${baseUrl}logo-colegio.png`} alt="" />
    <span><strong>Computación 2027</strong><small>Biblioteca de planificación</small></span>
  </a>
  <div class="header-actions">
    <a class="repo-link" href="https://github.com/Diego2326/planificacion-computacion-2027" target="_blank" rel="noreferrer">Repositorio <span aria-hidden="true">↗</span></a>
    <button class="theme-toggle" onclick={toggleTheme} aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'} title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}>
      {#if theme === 'light'}<span aria-hidden="true">☾</span><span>Oscuro</span>{:else}<span aria-hidden="true">☀</span><span>Claro</span>{/if}
    </button>
  </div>
</header>

<main class="page">
  <section class="page-intro">
    <div>
      <p class="kicker">COLEGIO BILINGÜE MONTESSORI · 2027</p>
      <h1>Planificaciones de Computación</h1>
      <p class="intro-text">Consulta los planes completos por grado y bimestre, junto con sus hojas imprimibles individuales.</p>
    </div>
    <div class="catalog-counts"><strong>{counts.grades}</strong> grados <span>·</span> <strong>{counts.bimesters}</strong> bimestres <span>·</span> <strong>{counts.sheets}</strong> hojas</div>
  </section>

  <label class="search-field" for="site-search">
    <span aria-hidden="true">⌕</span>
    <input id="site-search" bind:value={search} placeholder="Buscar en planes y hojas imprimibles…" />
    {#if search}<button onclick={() => search = ''} aria-label="Limpiar búsqueda">×</button>{/if}
    <kbd>Ctrl K</kbd>
  </label>

  {#if normalizedSearch}
    <section class="search-results">
      <div class="section-title"><h2>Resultados</h2><span>{planResults.length} planes · {searchResults.length} hojas</span></div>
      {#if planResults.length}
        <h3 class="results-subtitle">Planificaciones completas</h3>
        <div class="result-list">
          {#each planResults as result}
            <button class="result-row result-button" onclick={() => showSearchPlan(result)}>
              <span class="file-label plan-label">PLAN</span>
              <span class="result-main"><strong>{result.bimester.title}</strong><small>{result.grade.label} · {result.bimester.code} · {result.bimester.label}</small></span>
              <span class="open-mark" aria-hidden="true">↓</span>
            </button>
          {/each}
        </div>
      {/if}
      {#if searchResults.length}
        <h3 class="results-subtitle">Hojas imprimibles</h3>
        <div class="result-list">
          {#each searchResults as result}
            <a class="result-row" href={result.url} target="_blank" rel="noreferrer">
              <span class="file-label">PDF</span>
              <span class="result-main"><strong>{result.title}</strong><small>{result.grade.label} · {result.bimester.code} · Hoja {result.number}</small></span>
              <span class="open-mark" aria-hidden="true">↗</span>
            </a>
          {/each}
        </div>
      {:else if !planResults.length && !planSearchLoading}
        <p class="empty-state">No hay planes u hojas que coincidan. Prueba otra búsqueda.</p>
      {:else if planSearchLoading}<p class="empty-state">Buscando en las planificaciones…</p>
      {/if}
    </section>
  {:else}
    <nav class="level-tabs" aria-label="Nivel educativo">
      {#each catalog.levels as level}
        <button class:active={activeLevel === level.label} aria-pressed={activeLevel === level.label} onclick={() => chooseLevel(level.label)}>{level.label}</button>
      {/each}
    </nav>

    <div class="browser-layout">
      <nav class="grade-list" aria-label="Grados">
        <h2>Grados</h2>
        {#each currentGrades as grade}
          <button class="grade-button" class:active={selectedGradeId === grade.id} aria-current={selectedGradeId === grade.id ? 'page' : undefined} onclick={() => chooseGrade(grade)}>
            <span>{grade.label}</span><small>{grade.sheetCount} hojas</small>
          </button>
        {/each}
      </nav>

      {#if selectedGrade}
        <section class="grade-content">
          <div class="grade-heading">
            <div><p class="kicker">{selectedGrade.level}</p><h2>{selectedGrade.label}</h2><p class="muted">Computación · 4 bimestres · {selectedGrade.sheetCount} hojas individuales</p></div>
            <div class="annual-links">
              {#if selectedGrade.yearPdfUrl}<a href={selectedGrade.yearPdfUrl} target="_blank" rel="noreferrer">PDF anual <span>↗</span></a>{/if}
              {#if selectedGrade.planningDocxUrl}<a href={selectedGrade.planningDocxUrl} target="_blank" rel="noreferrer">Planificación DOCX <span>↗</span></a>{/if}
              {#if selectedGrade.htmlUrl}<a href={selectedGrade.htmlUrl} target="_blank" rel="noreferrer">HTML editable <span>↗</span></a>{/if}
            </div>
          </div>

          <div class="section-title bimesters-title"><h3>Planificación anual</h3><span>Cuatro unidades · planes completos y hojas por separado</span></div>
          <div class="bimester-list">
            {#each selectedGrade.bimesters as bimester}
              <article class="bimester">
                <div class="bimester-header">
                  <button class="bimester-toggle" aria-expanded={openBimester === bimester.code} onclick={() => openBimester = openBimester === bimester.code ? '' : bimester.code}>
                    <span class="bimester-code">{bimester.code}</span>
                    <span class="bimester-name"><strong>{bimester.title}</strong><small>{bimester.label} · {bimester.sheets.length} hojas</small></span>
                    <span class="expand" aria-hidden="true">{openBimester === bimester.code ? '−' : '+'}</span>
                  </button>
                  <button class="plan-link" onclick={() => togglePlan(bimester)} aria-expanded={shownPlanId === bimester.id}>{shownPlanId === bimester.id ? 'Cerrar plan' : 'Plan completo'}</button>
                </div>
                {#if openBimester === bimester.code}
                  <div class="sheet-list">
                    {#each bimester.sheets as sheet}
                      <a class="sheet-row" href={sheet.url} target="_blank" rel="noreferrer">
                        <span class="sheet-no">{String(sheet.number).padStart(2, '0')}</span>
                        <span>{sheet.title}</span>
                        <span class="download">PDF ↓</span>
                      </a>
                    {/each}
                  </div>
                {/if}
                {#if shownPlanId === bimester.id}
                  <section class="full-plan" id={`plan-${bimester.id}`}>
                    <div class="plan-toolbar"><strong>{bimester.label} · Planificación completa</strong><a href={bimester.planUrl} target="_blank" rel="noreferrer">Abrir Markdown original ↗</a></div>
                    {#if loadingPlanId === bimester.id}<p class="plan-status">Cargando planificación…</p>
                    {:else if planLoadErrorId === bimester.id}<p class="plan-status">No se pudo cargar el plan. <button onclick={() => loadPlan(bimester)}>Volver a intentar</button></p>
                    {:else}<div class="markdown-content">{@html planHtmlCache[bimester.id] ?? ''}</div>{/if}
                  </section>
                {/if}
              </article>
            {/each}
          </div>
        </section>
      {/if}
    </div>
  {/if}

  <footer><span>Basado en el CNB de Guatemala y referentes internacionales.</span><a href="https://github.com/Diego2326/planificacion-computacion-2027/blob/main/README.md" target="_blank" rel="noreferrer">Leer sobre la planificación ↗</a></footer>
</main>

<svelte:window onkeydown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); document.getElementById('site-search')?.focus(); } if (event.key === 'Escape') search = ''; }} />
