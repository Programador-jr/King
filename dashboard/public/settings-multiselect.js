(() => {
  "use strict";

  const instances = new Set();

  const normalizeForSearch = (value) =>
    String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const buildSummaryLabel = (select) => {
    const selected = Array.from(select.selectedOptions || []);
    if (selected.length === 0) return "Nenhum selecionado";
    if (selected.length === 1) return selected[0].textContent?.trim() || "1 selecionado";
    return `${selected.length} selecionados`;
  };

  const dispatchNativeChange = (select) => {
    if (!(select instanceof HTMLSelectElement)) return;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const enhanceSelect = (select) => {
    if (!(select instanceof HTMLSelectElement)) return;
    if (select.dataset.msEnhanced === "1") return;

    const isMultiple = Boolean(select.multiple);

    const wrapper = document.createElement("div");
    wrapper.className = "ms";
    if (select.classList.contains("form-select-sm") || select.classList.contains("form-control-sm")) {
      wrapper.classList.add("ms-sm");
    }
    select.parentNode?.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    select.classList.add("ms-native");
    select.dataset.msEnhanced = "1";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "ms-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    const triggerText = document.createElement("span");
    triggerText.className = "ms-trigger-text";
    trigger.appendChild(triggerText);

    const panel = document.createElement("div");
    panel.className = "ms-panel";
    panel.hidden = true;

    const searchWrap = document.createElement("div");
    searchWrap.className = "ms-search";

    const searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.className = "form-control form-control-sm";
    searchInput.placeholder = "Pesquisar...";
    searchInput.setAttribute("aria-label", "Pesquisar");
    searchInput.autocomplete = "off";
    searchWrap.appendChild(searchInput);

    const optionsWrap = document.createElement("div");
    optionsWrap.className = "ms-options";
    optionsWrap.setAttribute("role", "listbox");

    panel.appendChild(searchWrap);
    panel.appendChild(optionsWrap);

    wrapper.insertBefore(trigger, select);
    wrapper.insertBefore(panel, select);

    const entries = [];
    const fragment = document.createDocumentFragment();

    Array.from(select.options || []).forEach((option) => {
      const label = document.createElement("label");
      label.className = "ms-option";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "ms-checkbox";
      checkbox.checked = Boolean(option.selected);
      checkbox.disabled = Boolean(option.disabled);

      const checkUi = document.createElement("span");
      checkUi.className = "ms-check";
      checkUi.setAttribute("aria-hidden", "true");

      const text = document.createElement("span");
      text.className = "ms-option-text";
      const optionText = option.textContent?.trim() || "";
      text.textContent = optionText;

      const searchable = normalizeForSearch(optionText);
      label.dataset.search = searchable;

      checkbox.addEventListener("change", () => {
        if (option.disabled) {
          checkbox.checked = Boolean(option.selected);
          return;
        }

        if (isMultiple) {
          option.selected = checkbox.checked;
          triggerText.textContent = buildSummaryLabel(select);
          dispatchNativeChange(select);
          return;
        }

        if (!checkbox.checked) {
          checkbox.checked = true;
          return;
        }

        select.value = option.value;
        entries.forEach((entry) => {
          if (entry.checkbox === checkbox) return;
          entry.checkbox.checked = false;
          entry.option.selected = false;
        });
        triggerText.textContent = buildSummaryLabel(select);
        dispatchNativeChange(select);
        setOpen(false);
      });

      label.appendChild(checkbox);
      label.appendChild(checkUi);
      label.appendChild(text);
      fragment.appendChild(label);

      entries.push({ option, checkbox, label });
    });

    optionsWrap.appendChild(fragment);

    const syncFromSelect = () => {
      entries.forEach((entry) => {
        entry.checkbox.checked = Boolean(entry.option.selected);
      });
      triggerText.textContent = buildSummaryLabel(select);
    };

    select.addEventListener("change", syncFromSelect);
    select.addEventListener("input", syncFromSelect);

    const setOpen = (open) => {
      const isOpen = Boolean(open);
      panel.hidden = !isOpen;
      wrapper.classList.toggle("ms-open", isOpen);
      trigger.setAttribute("aria-expanded", String(isOpen));

      if (isOpen) {
        closeAll(wrapper);
        searchInput.value = "";
        entries.forEach((entry) => {
          entry.label.hidden = false;
          entry.checkbox.checked = Boolean(entry.option.selected);
        });
        queueMicrotask(() => searchInput.focus());
      }
    };

    const toggleOpen = () => setOpen(panel.hidden);

    trigger.addEventListener("click", toggleOpen);
    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleOpen();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    });

    searchInput.addEventListener("input", () => {
      const query = normalizeForSearch(searchInput.value.trim());
      entries.forEach((entry) => {
        if (!query) entry.label.hidden = false;
        else entry.label.hidden = !String(entry.label.dataset.search || "").includes(query);
      });
    });

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        trigger.focus();
      }
    });

    syncFromSelect();

    const instance = { wrapper, setOpen, isOpen: () => !panel.hidden };
    instances.add(instance);
  };

  const closeAll = (exceptWrapper) => {
    instances.forEach((instance) => {
      if (exceptWrapper && instance.wrapper === exceptWrapper) return;
      if (!instance.isOpen()) return;
      instance.setOpen(false);
    });
  };

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    const clickedInside = target.closest(".ms");
    if (clickedInside) return;

    closeAll();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeAll();
  });

  window.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".settings-form select").forEach(enhanceSelect);
  });
})();
