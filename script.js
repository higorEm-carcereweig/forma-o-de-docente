// ---------------------------------------------------------------
// Ponto de Partida — front-end apenas.
// Os dados abaixo são simulados em memória (nada é persistido).
// Quando o back-end existir, troque STATE/seed por chamadas de API
// e as funções send()/saveDraft() por requisições reais.
// ---------------------------------------------------------------

const TEACHER = { name: "Ana Beatriz", initial: "A" };

const STUDENTS = [
  { id: "s1", name: "Bruno Alves", turma: "6º Ano A" },
  { id: "s2", name: "Carla Nogueira", turma: "6º Ano A" },
  { id: "s3", name: "Diego Farias", turma: "6º Ano A" },
  { id: "s4", name: "Elisa Prado", turma: "6º Ano A" },
  { id: "s5", name: "Fábio Ramos", turma: "7º Ano B" },
  { id: "s6", name: "Giovana Melo", turma: "7º Ano B" },
  { id: "s7", name: "Heitor Souza", turma: "7º Ano B" },
  { id: "s8", name: "Isabela Cruz", turma: "9º Ano C" },
  { id: "s9", name: "João Pedro Lima", turma: "9º Ano C" },
];

let activities = [
  {
    id: "a1",
    title: "Leitura compartilhada — cap. 3",
    description: "Ler o capítulo 3 e trazer duas perguntas para discutir em roda na próxima aula.",
    recipients: ["s1", "s2", "s3", "s4"],
    link: "",
    status: "enviada",
    date: "2026-09-05T14:20:00",
  },
  {
    id: "a2",
    title: "Mapa mental — Revolução Industrial",
    description: "Montar um mapa mental com as causas e consequências vistas em sala, em folha A4.",
    recipients: ["s5", "s6", "s7"],
    link: "https://exemplo.edu/revolucao-industrial",
    status: "enviada",
    date: "2026-09-04T09:05:00",
  },
  {
    id: "a3",
    title: "Redação — carta ao meu eu do futuro",
    description: "Rascunho de uma carta pessoal, sem necessidade de revisão ainda.",
    recipients: ["s8", "s9"],
    link: "",
    status: "rascunho",
    date: "2026-09-03T18:40:00",
  },
];

const state = {
  filterStudentId: null,
  selectedRecipients: new Set(),
  allSelected: false,
};

// ---------- helpers ----------

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function studentName(id) {
  const s = STUDENTS.find((st) => st.id === id);
  return s ? s.name : id;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) +
    " · " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function groupByTurma() {
  const groups = {};
  STUDENTS.forEach((s) => {
    if (!groups[s.turma]) groups[s.turma] = [];
    groups[s.turma].push(s);
  });
  return groups;
}

// ---------- rendering: header ----------

function renderHeader() {
  $("#teacherName").textContent = TEACHER.name;
  $("#teacherInitial").textContent = TEACHER.initial;

  const turmasCount = new Set(STUDENTS.map((s) => s.turma)).size;
  const enviadasCount = activities.filter((a) => a.status === "enviada").length;
  const alunosAlcancados = new Set(
    activities.filter((a) => a.status === "enviada").flatMap((a) =>
      a.recipients[0] === "all" ? STUDENTS.map((s) => s.id) : a.recipients
    )
  ).size;

  $("#statTurmas").textContent = turmasCount;
  $("#statEnviadas").textContent = enviadasCount;
  $("#statAlunos").textContent = alunosAlcancados;
}

// ---------- rendering: sidebar ----------

function renderSidebar(filterText = "") {
  const list = $("#turmaList");
  list.innerHTML = "";
  const groups = groupByTurma();
  const q = filterText.trim().toLowerCase();

  Object.entries(groups).forEach(([turma, students]) => {
    const matchesTurma = turma.toLowerCase().includes(q);
    const filtered = q === "" || matchesTurma
      ? students
      : students.filter((s) => s.name.toLowerCase().includes(q));

    if (filtered.length === 0) return;

    const group = document.createElement("div");
    group.className = "turma-group";

    const title = document.createElement("p");
    title.className = "turma-group__title";
    title.textContent = turma;
    group.appendChild(title);

    filtered.forEach((s) => {
      const btn = document.createElement("button");
      btn.className = "student-btn";
      btn.type = "button";
      btn.dataset.studentId = s.id;
      if (state.filterStudentId === s.id) btn.classList.add("is-active");
      btn.innerHTML = `<span class="student-dot" aria-hidden="true"></span>${s.name}`;
      btn.addEventListener("click", () => {
        state.filterStudentId = state.filterStudentId === s.id ? null : s.id;
        renderSidebar($("#studentSearch").value);
        renderFeed();
      });
      group.appendChild(btn);
    });

    list.appendChild(group);
  });
}

// ---------- rendering: composer recipient chips ----------

function renderRecipientChips() {
  const wrap = $("#recipientChips");
  wrap.innerHTML = "";
  STUDENTS.forEach((s) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = s.name;
    chip.dataset.studentId = s.id;
    if (state.selectedRecipients.has(s.id)) chip.classList.add("is-selected");
    chip.addEventListener("click", () => toggleRecipient(s.id));
    wrap.appendChild(chip);
  });
}

function toggleRecipient(id) {
  state.allSelected = false;
  $(".chip--all").classList.remove("is-selected");
  if (state.selectedRecipients.has(id)) {
    state.selectedRecipients.delete(id);
  } else {
    state.selectedRecipients.add(id);
  }
  renderRecipientChips();
}

function toggleAllRecipients() {
  state.allSelected = !state.allSelected;
  $(".chip--all").classList.toggle("is-selected", state.allSelected);
  state.selectedRecipients.clear();
  renderRecipientChips();
}

// ---------- rendering: feed ----------

function renderFeed() {
  const feed = $("#feed");
  const empty = $("#feedEmpty");
  const filterBadge = $("#activeFilter");
  const filterLabel = $("#activeFilterLabel");

  let visible = [...activities];

  if (state.filterStudentId) {
    visible = visible.filter(
      (a) => a.recipients[0] === "all" || a.recipients.includes(state.filterStudentId)
    );
    filterBadge.hidden = false;
    filterLabel.textContent = "Filtrando por " + studentName(state.filterStudentId);
  } else {
    filterBadge.hidden = true;
  }

  visible.sort((a, b) => new Date(b.date) - new Date(a.date));

  feed.innerHTML = "";

  if (visible.length === 0) {
    empty.hidden = false;
    feed.hidden = true;
    return;
  }

  empty.hidden = true;
  feed.hidden = false;

  visible.forEach((a) => {
    const li = document.createElement("li");
    li.className = "entry";

    const recipientsLabel = a.recipients[0] === "all"
      ? [{ label: "Turma toda" }]
      : a.recipients.map((id) => ({ label: studentName(id) }));

    li.innerHTML = `
      <div class="entry__meta">
        <span class="status status--${a.status}">${a.status === "enviada" ? "Enviada" : "Rascunho"}</span>
        <span>${formatDate(a.date)}</span>
      </div>
      <h3 class="entry__title">${escapeHTML(a.title)}</h3>
      <p class="entry__desc">${escapeHTML(a.description)}</p>
      <div class="entry__footer">
        <div class="entry__recipients">
          ${recipientsLabel.map((r) => `<span class="recipient-tag">${escapeHTML(r.label)}</span>`).join("")}
        </div>
        ${a.link ? `<a class="entry__link" href="${escapeAttr(a.link)}" target="_blank" rel="noopener">Ver material ↗</a>` : ""}
      </div>
    `;
    feed.appendChild(li);
  });
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/"/g, "&quot;");
}

// ---------- toast ----------

let toastTimer = null;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

// ---------- composer behaviour ----------

function setComposerOpen(open) {
  const form = $("#composerForm");
  const toggle = $("#composerToggle");
  form.hidden = !open;
  toggle.setAttribute("aria-expanded", String(open));
}

function resetComposer() {
  $("#composerForm").reset();
  state.selectedRecipients.clear();
  state.allSelected = false;
  $(".chip--all").classList.remove("is-selected");
  renderRecipientChips();
}

function collectRecipients() {
  if (state.allSelected) return ["all"];
  return Array.from(state.selectedRecipients);
}

function submitActivity(status) {
  const title = $("#fieldTitle").value.trim();
  const description = $("#fieldDescription").value.trim();
  const link = $("#fieldLink").value.trim();
  const recipients = collectRecipients();

  if (!title || !description) {
    showToast("Escreva um título e uma descrição antes de continuar.");
    return;
  }
  if (recipients.length === 0) {
    showToast("Escolha ao menos um aluno ou a turma toda.");
    return;
  }

  activities.push({
    id: "a" + (activities.length + 1) + "-" + Date.now(),
    title,
    description,
    recipients,
    link,
    status,
    date: new Date().toISOString(),
  });

  resetComposer();
  setComposerOpen(false);
  renderHeader();
  renderFeed();
  showToast(status === "enviada" ? "Atividade enviada aos alunos." : "Rascunho salvo.");
}

// ---------- wiring ----------

function init() {
  renderHeader();
  renderSidebar();
  renderRecipientChips();
  renderFeed();

  $("#composerToggle").addEventListener("click", () => {
    const isOpen = $("#composerForm").hidden;
    setComposerOpen(isOpen);
  });

  $(".chip--all").addEventListener("click", toggleAllRecipients);

  $("#composerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    submitActivity("enviada");
  });

  $("#btnDraft").addEventListener("click", () => submitActivity("rascunho"));

  $("#studentSearch").addEventListener("input", (e) => {
    renderSidebar(e.target.value);
  });

  $("#clearFilter").addEventListener("click", () => {
    state.filterStudentId = null;
    renderSidebar($("#studentSearch").value);
    renderFeed();
  });
}

document.addEventListener("DOMContentLoaded", init);
