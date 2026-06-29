import {
  requireAuthenticated,
  showBannerAlert,
  getEmbeddedStrategies
} from "../../shared.js";
import { apiFetch, handleApiResult } from "../../api_helpers.js";

const { baseurl, apiUrl } = document.body.dataset;
let currentUserId = null;

const getNumericId = (value) => {
  if (!value || typeof value !== "object") return null;
  const id = value.user_id;
  return id == null ? null : Number(id);
};

const resolveCurrentUserId = async (authUser) => {
  const authId = getNumericId(authUser);
  if (authId != null) return authId;

  try {
    const res = await apiFetch(`${apiUrl}/auth/session`);
    return res.ok ? getNumericId(res.body) : null;
  } catch (error) {
    showBannerAlert("Error fetching current user ID");
  }
};

const getNoteOwnerId = (note) => {
  if (!note || typeof note !== "object") return null;
  const id = note.user_id;
  return id == null ? null : Number(id);
};

const isMyNote = (note) => {
  if (!note || currentUserId == null) return false;
  const noteOwnerId = getNoteOwnerId(note);
  return Number.isFinite(noteOwnerId) && noteOwnerId === currentUserId;
};

const fetchStrategies = async () =>
  getEmbeddedStrategies({ onError: showBannerAlert });

const fetchStrategyApiData = async (id) => {
  try {
    const result = await apiFetch(`${apiUrl}/strategies/${id}`);
    return result.ok ? result.item : null;
  } catch (_error) {
    showBannerAlert("Error fetching strategy data");
    return null;
  }
};

const appendHeading = (parent, level, text) => {
  const heading = document.createElement(`h${level}`);
  heading.textContent = text;
  parent.appendChild(heading);
};

const appendParagraph = (parent, text) => {
  const paragraph = document.createElement("p");
  paragraph.textContent = text || "";
  parent.appendChild(paragraph);
};

const createNoteCard = (note) => {
  const noteEl = document.createElement("article");
  noteEl.classList.add("note-card");
  noteEl.dataset.noteId = String(note.id);

  const noteHeader = document.createElement("header");

  const note_user = document.createElement("p");
  note_user.textContent = `Note by ${note.username || "Unknown"}`;
  const body = document.createElement("p");
  body.textContent = note.body || "";
  noteHeader.appendChild(note_user);
  noteEl.appendChild(noteHeader);
  noteEl.appendChild(body);

  if (isMyNote(note)) {
    const noteFooter = document.createElement("footer");
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.dataset.action = "edit-note";
    editBtn.textContent = "Edit";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.dataset.action = "delete-note";
    deleteBtn.textContent = "Delete";

    noteFooter.appendChild(editBtn);
    noteFooter.appendChild(deleteBtn);
    noteEl.appendChild(noteFooter);
  }

  return noteEl;
};

const renderNotes = (notes, containerId, notableType, notableId) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.replaceChildren();

  appendHeading(container, 4, "Notes");

  const notesListEl = document.createElement("div");
  notesListEl.dataset.notesList = "true";
  notes.forEach((note) => {
    notesListEl.appendChild(createNoteCard(note));
  });
  container.appendChild(notesListEl);

  const form = document.createElement("form");
  const textarea = document.createElement("textarea");
  textarea.name = "body";
  textarea.placeholder = "Add a note...";
  textarea.required = true;

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = "Add Note";

  const cancelEditBtn = document.createElement("button");
  cancelEditBtn.type = "button";
  cancelEditBtn.dataset.action = "cancel-edit";
  cancelEditBtn.style.display = "none";
  cancelEditBtn.textContent = "Cancel";

  form.appendChild(textarea);
  form.appendChild(submitBtn);
  form.appendChild(cancelEditBtn);
  container.appendChild(form);

  const setCreateMode = () => {
    form.removeAttribute("data-editing-note-id");
    submitBtn.textContent = "Add Note";
    textarea.placeholder = "Add a note...";
    cancelEditBtn.style.display = "none";
  };

  const setEditMode = (noteId, body) => {
    form.setAttribute("data-editing-note-id", noteId);
    textarea.value = body;
    textarea.focus();
    submitBtn.textContent = "Edit Note";
    textarea.placeholder = "Edit your note...";
    cancelEditBtn.style.display = "inline-block";
  };

  notesListEl.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    const noteCard = target.closest("[data-note-id]");
    const noteId = noteCard?.dataset.noteId;
    if (!noteId) return;

    if (target.dataset.action === "edit-note") {
      const noteBodyEl = noteCard.querySelector("p");
      setEditMode(noteId, noteBodyEl?.textContent || "");
      return;
    }

    if (target.dataset.action === "delete-note") {
      const res = await apiFetch(`${apiUrl}/notes/${noteId}`, {
        method: "DELETE"
      });

      if (handleApiResult(res, { baseurl, onError: showBannerAlert })) {
        if (form.getAttribute("data-editing-note-id") === noteId) {
          textarea.value = "";
          setCreateMode();
        }
        noteCard.remove();
        showBannerAlert(res.message || "Note deleted.");
      }
    }
  });

  cancelEditBtn.addEventListener("click", () => {
    textarea.value = "";
    setCreateMode();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = new FormData(form).get("body")?.toString().trim() || "";
    if (!body) return;

    const editingNoteId = form.getAttribute("data-editing-note-id");
    if (editingNoteId) {
      const res = await apiFetch(`${apiUrl}/notes/${editingNoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: { body } })
      });

      if (handleApiResult(res, { baseurl, onError: showBannerAlert })) {
        showBannerAlert(res.message || "Note updated.");
        textarea.value = "";
        setCreateMode();
        init();
      }
      return;
    }

    const endpoint =
      notableType === "Strategy"
        ? `${apiUrl}/strategies/${notableId}/notes`
        : `${apiUrl}/strategy_steps/${notableId}/notes`;

    const res = await apiFetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: { body } })
    });

    if (handleApiResult(res, { baseurl, onError: showBannerAlert })) {
      showBannerAlert(res.message || "Note created.");
      textarea.value = "";
      init(); // refetch all to get fresh state including the new note
    }
  });
};

const renderStrategy = (strategy, apiData) => {
  const container = document.getElementById("strategy-content");
  if (!container) return;

  if (!strategy) {
    container.replaceChildren();
    appendParagraph(container, "Strategy not found.");
    return;
  }

  container.replaceChildren();

  const titleBlock = document.createElement("div");
  const title = document.createElement("h1");
  title.textContent = strategy.title || "";
  titleBlock.appendChild(title);
  if (strategy.subtitle) {
    appendParagraph(titleBlock, strategy.subtitle);
  }
  container.appendChild(titleBlock);

  const detailsBlock = document.createElement("div");

  if (strategy.image) {
    const image = document.createElement("img");
    image.src = `${baseurl}${strategy.image}`;
    image.alt = strategy.image_alt || "";
    detailsBlock.appendChild(image);
  }

  const description = document.createElement("div");
  description.textContent = strategy.description || "";
  detailsBlock.appendChild(description);

  if (strategy.fast_facts) {
    const fastFacts = document.createElement("div");
    appendHeading(fastFacts, 3, "Fast Facts");
    const list = document.createElement("ul");
    const facts = [
      ["Outcome", strategy.fast_facts.outcome || "N/A"],
      ["Time to Launch", strategy.fast_facts.ttl || "N/A"],
      ["Cost", strategy.fast_facts.cost || "N/A"],
      ["Complexity", strategy.fast_facts.complexity || "N/A"],
      ["Staffing", strategy.fast_facts.staffing || "N/A"]
    ];

    facts.forEach(([label, value]) => {
      const item = document.createElement("li");
      const strong = document.createElement("b");
      strong.textContent = `${label}:`;
      item.appendChild(strong);
      item.appendChild(document.createTextNode(` ${value}`));
      list.appendChild(item);
    });

    fastFacts.appendChild(list);
    detailsBlock.appendChild(fastFacts);
  }

  const whatIsBlock = document.createElement("div");
  appendHeading(whatIsBlock, 3, "What is this strategy?");
  appendParagraph(whatIsBlock, strategy.what_is_this_strategy || "");
  detailsBlock.appendChild(whatIsBlock);

  const whenToUseBlock = document.createElement("div");
  appendHeading(whenToUseBlock, 3, "When to use");
  appendParagraph(whenToUseBlock, strategy.when_to_use || "");
  detailsBlock.appendChild(whenToUseBlock);

  if (
    Array.isArray(strategy.why_it_works) &&
    strategy.why_it_works.length > 0
  ) {
    const whyBlock = document.createElement("div");
    appendHeading(whyBlock, 3, "Why it Works");
    const list = document.createElement("ul");
    strategy.why_it_works.forEach((entry) => {
      const item = document.createElement("li");
      item.textContent = String(entry);
      list.appendChild(item);
    });
    whyBlock.appendChild(list);
    detailsBlock.appendChild(whyBlock);
  }

  if (strategy.sop_link) {
    const sopBlock = document.createElement("div");
    const sopLink = document.createElement("a");
    sopLink.href = `${baseurl}${strategy.sop_link}`;
    sopLink.target = "_blank";
    sopLink.rel = "noopener noreferrer";
    sopLink.textContent = "Download SOP (PDF)";
    sopBlock.appendChild(sopLink);
    detailsBlock.appendChild(sopBlock);
  }

  container.appendChild(detailsBlock);

  const stepsContainer = document.getElementById("strategy-steps");
  if (stepsContainer && apiData?.strategy_steps) {
    stepsContainer.replaceChildren();
    appendHeading(stepsContainer, 3, "Strategy Steps");
    apiData.strategy_steps.forEach((step) => {
      const stepEl = document.createElement("div");
      const inner = document.createElement("div");
      const descriptionEl = document.createElement("p");
      descriptionEl.textContent = step.description || "";
      const notesEl = document.createElement("div");
      notesEl.id = `step-notes-${step.id}`;

      inner.appendChild(descriptionEl);
      inner.appendChild(notesEl);
      stepEl.appendChild(inner);
      stepsContainer.appendChild(stepEl);
      renderNotes(
        step.notes.filter(
          (n) => n.notable_type === "StrategyStep" && n.notable_id === step.id
        ),
        `step-notes-${step.id}`,
        "StrategyStep",
        step.id
      );
    });
  }

  const testimonialsContainer = document.getElementById("testimonials");
  if (testimonialsContainer && apiData?.testimonials) {
    testimonialsContainer.replaceChildren();
    appendHeading(testimonialsContainer, 3, "Testimonials");
    const list = document.createElement("div");

    apiData.testimonials.forEach((t) => {
      const testimonial = document.createElement("div");
      const quote = document.createElement("blockquote");
      quote.textContent = t.body || "";
      const cite = document.createElement("cite");
      cite.textContent = `- Organization ${t.organization_id}`;

      testimonial.appendChild(quote);
      testimonial.appendChild(cite);
      list.appendChild(testimonial);
    });

    testimonialsContainer.appendChild(list);
  }

  if (apiData) {
    renderNotes(
      apiData.notes.filter((n) => n.notable_type === "Strategy"),
      "strategy-notes",
      "Strategy",
      apiData.id
    );
  }
};

const init = async () => {
  const auth = await requireAuthenticated();
  if (!auth) return;
  currentUserId = await resolveCurrentUserId(auth);

  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"), 10);

  if (isNaN(id)) {
    renderStrategy(null);
    return;
  }

  const [strategies, apiData] = await Promise.all([
    fetchStrategies(),
    fetchStrategyApiData(id)
  ]);

  const strategy = strategies.find((s) => s.id === id);
  renderStrategy(strategy, apiData);
};

document.addEventListener("DOMContentLoaded", init);
