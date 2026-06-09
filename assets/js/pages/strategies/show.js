import {
  requireAuthenticated,
  showBannerAlert,
  getEmbeddedStrategies,
  escHtml
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

const renderNotes = (notes, containerId, notableType, notableId) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  const notesList = notes
    .map(
      (note) => `
    <div data-note-id="${escHtml(note.id)}">
      <p>${escHtml(note.body)}</p>
      ${
        isMyNote(note)
          ? `
        <button type="button" data-action="edit-note">Edit</button>
        <button type="button" data-action="delete-note">Delete</button>
      `
          : ""
      }
    </div>
  `
    )
    .join("");

  container.innerHTML = `
    <h4>Notes</h4>
    <div data-notes-list>${notesList}</div>
    <form>
      <textarea name="body" placeholder="Add a note..." required></textarea>
      <button type="submit">Add Note</button>
      <button type="button" data-action="cancel-edit" style="display:none;">Cancel</button>
    </form>
  `;

  const form = container.querySelector("form");
  const textarea = form.querySelector('textarea[name="body"]');
  const submitBtn = form.querySelector('button[type="submit"]');
  const cancelEditBtn = form.querySelector('[data-action="cancel-edit"]');

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

  const notesListEl = container.querySelector("[data-notes-list]");
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
    container.innerHTML = "<p>Strategy not found.</p>";
    return;
  }

  const fastFactsHtml = strategy.fast_facts
    ? `
    <div>
      <h3>Fast Facts</h3>
      <ul>
        <li><b>Outcome:</b> ${strategy.fast_facts.outcome || "N/A"}</li>
        <li><b>Time to Launch:</b> ${strategy.fast_facts.ttl || "N/A"}</li>
        <li><b>Cost:</b> ${strategy.fast_facts.cost || "N/A"}</li>
        <li><b>Complexity:</b> ${strategy.fast_facts.complexity || "N/A"}</li>
        <li><b>Staffing:</b> ${strategy.fast_facts.staffing || "N/A"}</li>
      </ul>
    </div>
  `
    : "";

  const whyItWorksHtml = Array.isArray(strategy.why_it_works)
    ? `
    <h3>Why it Works</h3>
    <ul>
      ${strategy.why_it_works.map((item) => `<li>${item}</li>`).join("")}
    </ul>
  `
    : "";

  container.innerHTML = `
    <div>
      <h1>${strategy.title}</h1>
      ${strategy.subtitle ? `<p>${strategy.subtitle}</p>` : ""}
    </div>

    <div>
      ${
        strategy.image
          ? `<img src="${baseurl}${strategy.image}" alt="${strategy.image_alt || ""}">`
          : ""
      }
      
      <div>
        ${strategy.description || ""}
      </div>

      ${fastFactsHtml}

      <div>
        <h3>What is this strategy?</h3>
        <p>${strategy.what_is_this_strategy || ""}</p>
      </div>

      <div>
        <h3>When to use</h3>
        <p>${strategy.when_to_use || ""}</p>
      </div>

      ${whyItWorksHtml}
      
      ${
        strategy.sop_link
          ? `
        <div>
          <a href="${baseurl}${strategy.sop_link}" target="_blank">Download SOP (PDF)</a>
        </div>
      `
          : ""
      }
    </div>
  `;

  const stepsContainer = document.getElementById("strategy-steps");
  if (stepsContainer && apiData?.strategy_steps) {
    stepsContainer.innerHTML = `<h3>Strategy Steps</h3>`;
    apiData.strategy_steps.forEach((step) => {
      const stepEl = document.createElement("div");
      stepEl.innerHTML = `
        <div>
          <p>${step.description}</p>
          <div id="step-notes-${step.id}"></div>
        </div>
      `;
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
    testimonialsContainer.innerHTML = `
      <h3>Testimonials</h3>
      <div>
        ${apiData.testimonials
          .map(
            (t) => `
          <div>
            <blockquote>${t.body}</blockquote>
            <cite>- Organization ${t.organization_id}</cite>
          </div>
        `
          )
          .join("")}
      </div>
    `;
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
  const id = parseInt(params.get("id"));

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
