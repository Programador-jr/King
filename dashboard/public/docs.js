(() => {
  const search = document.getElementById("docs-search");
  if (!search) return;

  const cards = [...document.querySelectorAll("[data-doc-card]")];
  const categories = [...document.querySelectorAll("[data-doc-category]")];
  const emptyState = document.getElementById("docs-empty");
  const status = document.getElementById("docs-search-status");

  const filterCards = () => {
    const query = search.value.trim().toLocaleLowerCase("pt-BR");
    let visible = 0;

    for (const card of cards) {
      const matches = !query || card.dataset.search.toLocaleLowerCase("pt-BR").includes(query);
      card.hidden = !matches;
      if (matches) visible += 1;
    }

    for (const category of categories) {
      category.hidden = !category.querySelector("[data-doc-card]:not([hidden])");
    }

    emptyState.hidden = visible > 0;
    status.textContent = query ? `${visible} ${visible === 1 ? "guia encontrado" : "guias encontrados"}` : `${cards.length} guias disponíveis`;
  };

  search.addEventListener("input", filterCards);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
    event.preventDefault();
    search.focus();
  });
})();
