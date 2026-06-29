import { requireChampion, showBannerAlert } from "../../shared.js";
import { apiFetch, handleApiResult } from "../../api_helpers.js";

const baseurl = document.body.dataset.baseurl;
const apiUrl = document.body.dataset.apiUrl;
const params = new URLSearchParams(window.location.search);
const orgId = params.get("organization_id");

const addUserButton = document.getElementById("add-user-button");
const userModal = document.getElementById("user-modal");
const userModalTitle = document.getElementById("user-modal-title");
const userModalForm = document.getElementById("user-form");
const userModalClose = document.getElementById("user-modal-close");
const userModalCancel = document.getElementById("user-modal-cancel");
const modalUserIdInput = userModalForm?.querySelector("#user-id");
const modalUserNameInput = userModalForm?.querySelector("#name");
const modalUserEmailInput = userModalForm?.querySelector("#email");
const modalUserChampionInput = userModalForm?.querySelector("#champion");
const modalChampionWrapper = modalUserChampionInput?.closest(".superuser-only");
const usersPagination = document.getElementById("users-pagination");
const usersPaginationPrev = document.getElementById("users-pagination-prev");
const usersPaginationNext = document.getElementById("users-pagination-next");
const usersPaginationStatus = document.getElementById(
  "users-pagination-status"
);

let canManageChampionStatus = false;
let modalMode = "create";
let allUsers = [];
let currentPage = 1;
let paginationInitialized = false;

const PAGE_SIZE = 8;

const closeUserModal = () => {
  if (!userModal) return;
  if (typeof userModal.close === "function") {
    userModal.close();
  } else {
    userModal.removeAttribute("open");
  }
};

const openUserModal = () => {
  if (!userModal) return;
  if (typeof userModal.showModal === "function") {
    userModal.showModal();
  } else {
    userModal.setAttribute("open", "open");
  }

  requestAnimationFrame(() => {
    modalUserNameInput?.focus();
  });
};

const resetModalForm = () => {
  if (!userModalForm) return;
  userModalForm.reset();
  if (modalUserIdInput) {
    modalUserIdInput.value = "";
  }
};

const setModalMode = ({ mode, user = null }) => {
  modalMode = mode;

  if (mode === "edit" && user) {
    userModalTitle.textContent = "Edit User";
    if (modalUserIdInput) modalUserIdInput.value = user.id;
    if (modalUserNameInput) modalUserNameInput.value = user.name || "";
    if (modalUserEmailInput) modalUserEmailInput.value = user.email || "";
    if (canManageChampionStatus && modalUserChampionInput) {
      modalUserChampionInput.checked = Boolean(user.champion);
    }
    return;
  }

  userModalTitle.textContent = "Add New User";
  resetModalForm();
};

const setupAddUserButton = () => {
  if (!orgId) {
    showBannerAlert("Missing organization context.");
    if (addUserButton) addUserButton.hidden = true;
    return;
  }

  if (addUserButton) {
    addUserButton.addEventListener("click", () => {
      setModalMode({ mode: "create" });
      openUserModal();
    });
  }
};

const createUser = async () => {
  const userPayload = {
    name: modalUserNameInput?.value || "",
    email: modalUserEmailInput?.value || ""
  };

  if (canManageChampionStatus && modalUserChampionInput) {
    userPayload.champion = modalUserChampionInput.checked;
  }

  const res = await apiFetch(`${apiUrl}/organizations/${orgId}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: userPayload })
  });

  const shouldContinue = handleApiResult(res, {
    baseurl,
    fallback: "Failed to create user.",
    onError: showBannerAlert
  });
  if (!shouldContinue) return;

  closeUserModal();
  await loadUsers();

  return res.message || "User created.";
};

const updateUser = async () => {
  const userId = modalUserIdInput?.value;
  if (!userId) {
    showBannerAlert("Missing user context.");
    return;
  }

  const userPayload = {
    name: modalUserNameInput?.value || "",
    email: modalUserEmailInput?.value || ""
  };

  if (canManageChampionStatus && modalUserChampionInput) {
    userPayload.champion = modalUserChampionInput.checked;
  }

  const res = await apiFetch(
    `${apiUrl}/organizations/${orgId}/users/${userId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: userPayload })
    }
  );

  const shouldContinue = handleApiResult(res, {
    baseurl,
    fallback: "Failed to update user.",
    onError: showBannerAlert
  });
  if (!shouldContinue) return;

  closeUserModal();
  await loadUsers();

  return res.message || "User updated.";
};

const onModalSubmit = async (e) => {
  e.preventDefault();

  try {
    let successMessage = "";

    if (modalMode === "edit") {
      successMessage = await updateUser();
    } else {
      successMessage = await createUser();
    }

    if (successMessage) {
      showBannerAlert(successMessage);
    }
  } catch (_error) {
    showBannerAlert("An error occurred. Please try again later.");
  }
};

const setupModal = () => {
  if (!userModalForm) return;

  if (userModalClose) {
    userModalClose.addEventListener("click", closeUserModal);
  }

  if (userModalCancel) {
    userModalCancel.addEventListener("click", closeUserModal);
  }

  if (userModal) {
    userModal.addEventListener("click", (e) => {
      if (e.target === userModal) {
        closeUserModal();
      }
    });
  }

  userModalForm.addEventListener("submit", onModalSubmit);
};

const renderUserRow = (user, tbody, template) => {
  const row = template.content.cloneNode(true);
  row.querySelector(".user-name").textContent = user.name;
  row.querySelector(".user-email").textContent = user.email;
  row.querySelector(".user-edit").addEventListener("click", () => {
    setModalMode({ mode: "edit", user });
    openUserModal();
  });

  const deleteButton = row.querySelector(".user-delete");
  if (user.champion) {
    deleteButton.remove();
  } else {
    deleteButton.addEventListener("click", (e) => {
      const confirmMsg = e.currentTarget.dataset.confirm;
      if (!confirm(confirmMsg)) return;
      deleteUser(user.id);
    });
  }

  tbody.appendChild(row);
};

const updatePaginationControls = ({ totalPages, start, end, totalUsers }) => {
  if (!usersPaginationStatus || !usersPaginationPrev || !usersPaginationNext)
    return;

  usersPaginationStatus.textContent = `Showing ${start}-${end} of ${totalUsers}`;
  usersPaginationPrev.disabled = currentPage <= 1;
  usersPaginationNext.disabled = currentPage >= totalPages;
};

const renderUsersPage = (pageNumber) => {
  const userTable = document.getElementById("users-table");
  const tbody = document.getElementById("users-body");
  const template = document.getElementById("user-row-template");
  if (!userTable || !tbody || !template) return;

  tbody.innerHTML = "";

  if (allUsers.length === 0) {
    userTable.style.display = "none";
    if (usersPagination) usersPagination.style.display = "none";
    return;
  }

  const totalPages = Math.max(1, Math.ceil(allUsers.length / PAGE_SIZE));
  currentPage = Math.min(Math.max(1, pageNumber), totalPages);

  const pageStartIndex = (currentPage - 1) * PAGE_SIZE;
  const pageUsers = allUsers.slice(pageStartIndex, pageStartIndex + PAGE_SIZE);
  const start = pageStartIndex + 1;
  const end = pageStartIndex + pageUsers.length;

  userTable.style.display = "table";
  pageUsers.forEach((user) => renderUserRow(user, tbody, template));

  if (usersPagination) {
    usersPagination.style.display = "grid";
  }
  updatePaginationControls({
    totalPages,
    start,
    end,
    totalUsers: allUsers.length
  });
};

const setupPaginationControls = () => {
  if (paginationInitialized || !usersPaginationPrev || !usersPaginationNext) {
    return;
  }

  usersPaginationPrev.addEventListener("click", () => {
    renderUsersPage(currentPage - 1);
  });

  usersPaginationNext.addEventListener("click", () => {
    renderUsersPage(currentPage + 1);
  });

  paginationInitialized = true;
};

const loadUsers = async () => {
  if (!orgId) return;

  try {
    const res = await apiFetch(`${apiUrl}/organizations/${orgId}/users`);

    const shouldContinue = handleApiResult(res, {
      baseurl,
      fallback: "An error occurred. Please try again later.",
      onError: showBannerAlert
    });
    if (!shouldContinue) {
      return;
    }

    allUsers = (res.items || []).slice().sort((a, b) => {
      const championDelta =
        Number(Boolean(b.champion)) - Number(Boolean(a.champion));
      if (championDelta !== 0) return championDelta;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });

    renderUsersPage(currentPage);
  } catch (_error) {
    showBannerAlert("An error occurred. Please try again later.");
  }
};

const deleteUser = async (id) => {
  try {
    const res = await apiFetch(`${apiUrl}/organizations/${orgId}/users/${id}`, {
      method: "DELETE"
    });

    const shouldContinue = handleApiResult(res, {
      baseurl,
      fallback: "Failed to delete user.",
      onError: showBannerAlert
    });
    if (!shouldContinue) {
      return;
    }

    await loadUsers();
  } catch (_error) {
    showBannerAlert("An error occurred. Please try again later.");
  }
};

const init = async () => {
  const currentUser = await requireChampion();
  if (!currentUser) return;

  canManageChampionStatus = currentUser.role === "superuser";
  if (modalChampionWrapper) {
    modalChampionWrapper.style.display = canManageChampionStatus
      ? "block"
      : "none";
  }

  setupAddUserButton();
  setupModal();
  setupPaginationControls();
  await loadUsers();
};

document.addEventListener("DOMContentLoaded", init);
