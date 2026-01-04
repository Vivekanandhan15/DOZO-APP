
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);



const searchInput = $(".search-input");

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const value = searchInput.value.toLowerCase();

    $$(".list-item").forEach(item => {
      const name = item.querySelector(".student-name").textContent.toLowerCase();
      const id = item.querySelector(".student-id").textContent.toLowerCase();

      item.style.display =
        name.includes(value) || id.includes(value) ? "flex" : "none";
    });
  });
}


const statusFilter = $$(".filter-select")[1];

if (statusFilter) {
  statusFilter.addEventListener("change", () => {
    const selected = statusFilter.value.toLowerCase();

    $$(".list-item").forEach(item => {
      const status = item
        .querySelector(".status-col")
        .textContent.toLowerCase();

      if (selected === "filter by status" || status === selected) {
        item.style.display = "flex";
      } else {
        item.style.display = "none";
      }
    });
  });
}



const batchFilter = $$(".filter-select")[0];

if (batchFilter) {
  batchFilter.addEventListener("change", () => {
    const selectedBatch = batchFilter.value.toLowerCase();

    $$(".list-item").forEach(item => {
      const batch = item
        .querySelector(".batch-col")
        .textContent.toLowerCase();

      if (
        selectedBatch === "all batches" ||
        batch.includes(selectedBatch)
      ) {
        item.style.display = "flex";
      } else {
        item.style.display = "none";
      }
    });
  });
}


$$(".icon-btn").forEach(btn => {
  const icon = btn.querySelector("i");

  if (icon && icon.classList.contains("fa-eye")) {
    btn.addEventListener("click", () => {
      alert("👀 Student profile view will open");
    });
  }
});



$$(".icon-btn").forEach(btn => {
  const icon = btn.querySelector("i");

  if (icon && icon.classList.contains("fa-edit")) {
    btn.addEventListener("click", () => {
      alert("✏️ Edit student details feature coming soon");
    });
  }
});


const addStudentBtn = $(".btn-primary");

if (addStudentBtn) {
  addStudentBtn.addEventListener("click", () => {
    alert("➕ Add New Student form will open");
  });
}



$$(".pagination .icon-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    alert("📄 Pagination logic will be added with backend");
  });
});
