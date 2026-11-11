<script>
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
  let openBimester = 'B1';

  $: currentGrades = catalog.grades.filter((grade) => grade.level === activeLevel);
  $: selectedGrade = catalog.grades.find((grade) => grade.id === selectedGradeId) ?? currentGrades[0];
  $: normalizedSearch = search.trim().toLocaleLowerCase('es');
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
    openBimester = 'B1';
  }

  function chooseGrade(grade) {
    selectedGradeId = grade.id;
    openBimester = 'B1';
  }
</script>

<svelte:head>
  <title>Computación 2027 · Biblioteca docente</title>
  <meta name="description" content="Explora las planificaciones y hojas imprimibles de Computación 2027 por nivel, grado y bimestre." />
</svelte:head>

<div class="app-shell">
  <header class="topbar">
    <a class="brand" href="https://github.com/Diego2326/planificacion-computacion-2027" aria-label="Repositorio de planificación 2027">
      <img src={`${baseUrl}logo-colegio.png`} alt="Escudo del Colegio Bilingüe Montessori" />
      <span class="brand-copy"><strong>Colegio Bilingüe Montessori</strong><small>Biblioteca docente · Computación 2027</small></span>
    </a>
    <a class="repo-link" href="https://github.com/Diego2326/planificacion-computacion-2027" target="_blank" rel="noreferrer">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 6v-3.9a3.4 3.4 0 0 0-1-2.6c3.3-.4 6.8-1.6 6.8-7.2a5.6 5.6 0 0 0-1.5-3.9 5.2 5.2 0 0 0-.1-3.9S18 0 15 2a13.5 13.5 0 0 0-7 0C5 0 3.8.5 3.8.5a5.2 5.2 0 0 0-.1 3.9 5.6 5.6 0 0 0-1.5 3.9c0 5.6 3.5 6.8 6.8 7.2a3.4 3.4 0 0 0-1 2.6V22" /></svg>
      <span>Ver repositorio</span>
      <svg class="external" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/></svg>
    </a>
  </header>

  <main>
    <section class="intro">
      <div class="intro-copy">
        <div class="eyebrow"><span class="eyebrow-line"></span> PLANIFICACIÓN ACADÉMICA · 2027</div>
        <h1>Todo el año,<br /><em>más fácil de encontrar.</em></h1>
        <p>Explora planes de Computación por grado y bimestre. Abre cada planificación o descarga las hojas imprimibles una por una.</p>
      </div>
      <div class="search-card">
        <label for="site-search">Buscar una hoja, tema o grado</label>
        <div class="search-box">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>
          <input id="site-search" bind:value={search} placeholder="Ej. seguridad, gráficos, 3.º primaria" />
          {#if search}<button class="clear-search" onclick={() => search = ''} aria-label="Limpiar búsqueda">×</button>{/if}
          <kbd>⌘ K</kbd>
        </div>
        <span class="search-hint">Busca en todas las hojas imprimibles.</span>
      </div>
    </section>

    <section class="stats" aria-label="Resumen del catálogo">
      <div class="stat"><span class="stat-icon coral">▦</span><div><strong>{counts.grades}</strong><small>grados</small></div></div>
      <div class="stat"><span class="stat-icon green">◷</span><div><strong>{counts.bimesters}</strong><small>bimestres</small></div></div>
      <div class="stat"><span class="stat-icon gold">▤</span><div><strong>{counts.sheets}</strong><small>hojas individuales</small></div></div>
      <div class="stat-note">CNB Guatemala<br /><span>+ referentes internacionales</span></div>
    </section>

    {#if normalizedSearch}
      <section class="search-results">
        <div class="section-heading">
          <div><div class="eyebrow">RESULTADOS</div><h2>Hojas encontradas</h2></div>
          <span class="result-count">{searchResults.length} {searchResults.length === 1 ? 'hoja' : 'hojas'}</span>
        </div>
        {#if searchResults.length}
          <div class="results-list">
            {#each searchResults as result}
              <a class="result-row" href={result.url} target="_blank" rel="noreferrer">
                <span class="paper-icon">PDF</span>
                <span class="result-copy"><strong>{result.title}</strong><small>{result.grade.label} · {result.bimester.code} · Hoja {result.number}</small></span>
                <span class="download-mark">↗</span>
              </a>
            {/each}
          </div>
        {:else}
          <div class="empty-state"><span>⌕</span><strong>No encontré hojas con esa búsqueda.</strong><small>Prueba con otro tema, grado o palabra clave.</small></div>
        {/if}
      </section>
    {:else}
      <section class="browse-section">
        <div class="section-heading browse-heading">
          <div><div class="eyebrow">BIBLIOTECA CURRICULAR</div><h2>Elige un nivel y un grado</h2></div>
          <div class="level-switch" role="tablist" aria-label="Nivel educativo">
            {#each catalog.levels as level}
              <button role="tab" aria-selected={activeLevel === level.label} class:active={activeLevel === level.label} onclick={() => chooseLevel(level.label)}>{level.label}</button>
            {/each}
          </div>
        </div>

        <div class="workspace">
          <nav class="grade-rail" aria-label="Grados disponibles">
            <div class="rail-label">{activeLevel.toUpperCase()}</div>
            {#each currentGrades as grade}
              <button class="grade-choice" class:selected={selectedGradeId === grade.id} onclick={() => chooseGrade(grade)} aria-current={selectedGradeId === grade.id ? 'page' : undefined}>
                <span class="grade-number">{grade.label.match(/^\d+/)?.[0] ?? '•'}</span>
                <span class="grade-info"><strong>{grade.label}</strong><small>{grade.sheetCount} hojas</small></span>
                <span class="chevron">›</span>
              </button>
            {/each}
            <div class="rail-foot"><span class="dot"></span> Ciclo escolar 2027</div>
          </nav>

          {#if selectedGrade}
            <section class="grade-detail">
              <div class="grade-banner">
                <div>
                  <div class="eyebrow">{selectedGrade.level.toUpperCase()} <span class="slash">/</span> CICLO 2027</div>
                  <h3>{selectedGrade.label}</h3>
                  <p>Computación · 4 bimestres · {selectedGrade.sheetCount} hojas imprimibles individuales</p>
                </div>
                <div class="grade-stamp">{selectedGrade.label.match(/^\d+/)?.[0]}<small>{selectedGrade.level === 'Primaria' ? 'PRIMARIA' : selectedGrade.level.toUpperCase()}</small></div>
              </div>

              <div class="annual-actions">
                {#if selectedGrade.yearPdfUrl}<a class="annual-link" href={selectedGrade.yearPdfUrl} target="_blank" rel="noreferrer"><span class="annual-icon">↓</span><span><strong>Cuadernillo anual</strong><small>PDF · 24 páginas</small></span><span class="action-arrow">↗</span></a>{/if}
                {#if selectedGrade.planningDocxUrl}<a class="annual-link" href={selectedGrade.planningDocxUrl} target="_blank" rel="noreferrer"><span class="doc-icon">DOC</span><span><strong>Planificación anual</strong><small>Documento editable</small></span><span class="action-arrow">↗</span></a>{/if}
                {#if selectedGrade.htmlUrl}<a class="annual-link" href={selectedGrade.htmlUrl} target="_blank" rel="noreferrer"><span class="html-icon">HTML</span><span><strong>Fuente editable</strong><small>Maquetación imprimible</small></span><span class="action-arrow">↗</span></a>{/if}
              </div>

              <div class="bimester-heading"><h4>Planes bimestrales</h4><span>Selecciona un bimestre para ver sus hojas</span></div>
              <div class="bimester-list">
                {#each selectedGrade.bimesters as bimester}
                  <article class="bimester-card" class:expanded={openBimester === bimester.code}>
                    <div class="bimester-head">
                      <button class="bimester-toggle" aria-expanded={openBimester === bimester.code} onclick={() => openBimester = openBimester === bimester.code ? '' : bimester.code}>
                        <span class="bimester-index">{bimester.code}</span>
                        <span class="bimester-copy"><strong>{bimester.title}</strong><small>{bimester.label} · {bimester.sheets.length} hojas imprimibles</small></span>
                        <span class="expand-icon">{openBimester === bimester.code ? '−' : '+'}</span>
                      </button>
                      <a class="plan-link" href={bimester.planUrl} target="_blank" rel="noreferrer">Plan <span>↗</span></a>
                    </div>
                    {#if openBimester === bimester.code}
                      <div class="sheet-list">
                        {#each bimester.sheets as sheet}
                          <a class="sheet-row" href={sheet.url} target="_blank" rel="noreferrer">
                            <span class="sheet-number">{String(sheet.number).padStart(2, '0')}</span>
                            <span class="sheet-title">{sheet.title}</span>
                            <span class="sheet-download">Descargar PDF <span>↓</span></span>
                          </a>
                        {/each}
                      </div>
                    {/if}
                  </article>
                {/each}
              </div>
            </section>
          {/if}
        </div>
      </section>
    {/if}

    <footer><span>COLEGIO BILINGÜE MONTESSORI</span><span>Planificación de Computación 2027</span><a href="https://github.com/Diego2326/planificacion-computacion-2027/blob/main/README.md" target="_blank" rel="noreferrer">Acerca del currículo ↗</a></footer>
  </main>
</div>

<svelte:window onkeydown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); document.getElementById('site-search')?.focus(); } if (event.key === 'Escape') search = ''; }} />
