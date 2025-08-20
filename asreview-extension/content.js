class ASReviewSidebar {
  constructor() {
    this.recordData = null;
    this.isOpen = false;
    this.eventListeners = new Map();
    this.cleanupTasks = [];
    this.isDestroyed = false;
    this.init();

    window.addEventListener("beforeunload", () => this.destroy());
    window.addEventListener("pagehide", () => this.destroy());
  }

  async init() {
    const isASReviewWebapp =
      window.location.hostname === "localhost" &&
      window.location.port === "3000";

    if (isASReviewWebapp) {
      this.announceToWebapp();

      this.addEventListenerTracked(window, "asreview_webapp_ready", () => {
        this.announceToWebapp();
      });
    }

    try {
      this.recordData = await chrome.runtime.sendMessage({
        type: "GET_CURRENT_RECORD",
      });
    } catch (error) {}

    const messageHandler = (request) => this.handleMessage(request);
    chrome.runtime.onMessage.addListener(messageHandler);
    this.cleanupTasks.push(() => {
      chrome.runtime.onMessage.removeListener(messageHandler);
    });

    this.createLauncher();

    this.renderUI();
  }

  addEventListenerTracked(element, event, handler, options = {}) {
    if (this.isDestroyed) return;

    const wrappedHandler = (...args) => {
      if (!this.isDestroyed) {
        handler(...args);
      }
    };

    element.addEventListener(event, wrappedHandler, options);

    const key = `${element.constructor.name}-${event}-${Date.now()}`;
    this.eventListeners.set(key, {
      element,
      event,
      handler: wrappedHandler,
      options,
    });

    return key;
  }

  removeTrackedEventListener(key) {
    const listener = this.eventListeners.get(key);
    if (listener) {
      listener.element.removeEventListener(
        listener.event,
        listener.handler,
        listener.options
      );
      this.eventListeners.delete(key);
    }
  }

  destroy() {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    for (const [key, listener] of this.eventListeners) {
      try {
        listener.element.removeEventListener(
          listener.event,
          listener.handler,
          listener.options
        );
      } catch (e) {
        console.warn("Error removing event listener:", e);
      }
    }
    this.eventListeners.clear();

    this.cleanupTasks.forEach((task) => {
      try {
        task();
      } catch (e) {
        console.warn("Error in cleanup task:", e);
      }
    });
    this.cleanupTasks = [];

    const sidebar = document.getElementById("asreview-sidebar");
    const launcher = document.getElementById("asreview-launcher");
    if (sidebar) sidebar.remove();
    if (launcher) launcher.remove();
  }

  announceToWebapp() {
    const extensionId = chrome.runtime.id;
    window.dispatchEvent(
      new CustomEvent("asreview_extension_ready", {
        detail: { extensionId: extensionId },
      })
    );
  }

  handleMessage(request) {
    switch (request.type) {
      case "RECORD_UPDATED":
        this.recordData = request.data;
        this.renderUI();
        break;

      case "TAGS_UPDATED":
        if (this.recordData) {
          this.recordData.tagValues = request.data.tags;
          this.recordData.note = request.data.note;
          this.updateUI();
        }
        break;
    }
  }

  createLauncher() {
    // Remove ALL existing launchers (more robust cleanup)
    const existingLaunchers = document.querySelectorAll(
      "#asreview-launcher, [id^='asreview-launcher']"
    );
    existingLaunchers.forEach((launcher) => launcher.remove());

    // Wait a bit to ensure DOM cleanup
    setTimeout(() => {
      // Double-check no launcher exists
      if (document.getElementById("asreview-launcher")) {
        return; // Prevent duplicates
      }

      const launcher = document.createElement("button");
      launcher.id = "asreview-launcher";
      launcher.title = "ASReview Tags";
      launcher.className = "asreview-extension-launcher"; // Add class for additional targeting
      // Create icon safely without innerHTML
      const iconImg = document.createElement("img");
      iconImg.className = "launcher-icon";
      iconImg.src = chrome.runtime.getURL("icon.png");
      iconImg.alt = "ASReview";
      iconImg.onerror = function () {
        this.style.display = "none";
        const textNode = document.createTextNode("AS");
        this.parentNode.appendChild(textNode);
      };
      launcher.appendChild(iconImg);
      this.addEventListenerTracked(launcher, "click", (e) => {
        this.toggleSidebar();
        // Remove focus to prevent blue outline
        e.target.blur();
      });

      // Force append to body with protection
      if (document.body) {
        document.body.appendChild(launcher);
      } else {
        // If body not ready, wait for it
        this.addEventListenerTracked(document, "DOMContentLoaded", () => {
          if (!document.getElementById("asreview-launcher")) {
            document.body.appendChild(launcher);
          }
        });
      }
    }, 10);
  }

  toggleSidebar() {
    this.isOpen = !this.isOpen;
    const sidebar = document.getElementById("asreview-sidebar");
    if (sidebar) {
      sidebar.classList.toggle("asreview-open", this.isOpen);
    }
  }

  renderUI() {
    const existingSidebar = document.getElementById("asreview-sidebar");

    if (existingSidebar && this.recordData) {
      if (this.updateExistingSidebar(existingSidebar)) {
        return;
      }
    }

    this.recreateSidebar();
  }

  updateExistingSidebar(sidebar) {
    try {
      if (sidebar.querySelector(".no-data-message")) {
        return false;
      }

      // Check if tag structure changed - if so, recreate sidebar
      const existingTagGroups = sidebar.querySelectorAll(".tag-group").length;
      const newTagGroupsCount = this.recordData.tagsForm
        ? this.recordData.tagsForm.length
        : 0;

      if (existingTagGroups !== newTagGroupsCount) {
        return false;
      }

      // Update title
      const titleElement = sidebar.querySelector(".record-title");
      if (titleElement) {
        titleElement.textContent =
          this.recordData.title || "No title available";
      }

      // Update note
      const noteInput = sidebar.querySelector("#note-input");
      if (noteInput && noteInput.value !== (this.recordData.note || "")) {
        noteInput.value = this.recordData.note || "";
      }

      // Update checkboxes
      if (this.recordData.tagsForm) {
        this.recordData.tagsForm.forEach((group, groupIndex) => {
          group.values.forEach((value, valueIndex) => {
            const checkbox = sidebar.querySelector(
              `input[data-group="${group.id}"][data-value="${value.id}"]`
            );
            if (checkbox) {
              const shouldBeChecked =
                this.recordData.tagValues?.[groupIndex]?.values[valueIndex]
                  ?.checked || false;
              if (checkbox.checked !== shouldBeChecked) {
                checkbox.checked = shouldBeChecked;
              }
            }
          });
        });
      }

      return true;
    } catch (error) {
      console.warn("Failed to update existing sidebar:", error);
      return false;
    }
  }

  recreateSidebar() {
    // Save scroll position before re-rendering
    const existingSidebar = document.getElementById("asreview-sidebar");
    const mainContent = existingSidebar?.querySelector(".main-content");
    const scrollTop =
      this._preservedScrollTop !== undefined
        ? this._preservedScrollTop
        : mainContent
        ? mainContent.scrollTop
        : 0;

    if (existingSidebar) {
      existingSidebar.remove();
    }

    const isASReviewSite =
      window.location.hostname === "localhost" &&
      window.location.port === "3000";

    if (isASReviewSite) {
      this.createWebappInfoPanel();
      return;
    }

    if (!this.recordData || !this.recordData.title) {
      this.createNoDataUI();
      return;
    }

    this.createSidebar();

    // Restore scroll position immediately after DOM creation
    requestAnimationFrame(() => {
      const newMainContent = document.querySelector(
        "#asreview-sidebar .main-content"
      );
      if (newMainContent && scrollTop > 0) {
        newMainContent.scrollTop = scrollTop;
      }
    });
  }

  createWebappInfoPanel() {
    const sidebar = document.createElement("div");
    sidebar.id = "asreview-sidebar";
    sidebar.className = this.isOpen ? "asreview-open" : "";

    sidebar.innerHTML = `
      <div class="asreview-content">
        <div class="asreview-header">
          <div class="header-content">
            <h4>ASReview Full-Text Companion</h4>
          </div>
        </div>
        <div class="main-content">
          <div class="no-data-message">
            <p style="text-align: left; font-size: 1.0rem; margin-bottom: 24px;">
              This panel enables tagging and note-taking on external websites.
            </p>
            <ol>
              <li>Keep this ASReview LAB page open in <b>Review</b> mode.</li>
              <li>Navigate to the full-text of a record in a new browser tab.</li>
              <li>The tagging interface will appear in the panel on that page.</li>
              <li>All work will be synchronized with your project here.</li>
            </ol>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(sidebar);
  }

  createNoDataUI() {
    const sidebar = document.createElement("div");
    sidebar.id = "asreview-sidebar";
    sidebar.className = this.isOpen ? "asreview-open" : "";

    sidebar.innerHTML = `
      <div class="asreview-content">
        <div class="asreview-header">
          <div class="header-content">
            <h4>ASReview Full-Text Companion</h4>
          </div>
        </div>
        <div class="main-content">
          <div class="no-data-message">
            <ol>
              <li>In your terminal, run the <code>asreview lab</code> command to start ASReview LAB</li>
              <li>Open <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer">ASReview LAB</a> and go to <strong>Review</strong> tab</li>
              <li>Tagging options for that record will appear in this panel</li>
              <li>Take ASReview with you while reading full-text records</li>
            </ol>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(sidebar);
  }

  createSidebar() {
    const sidebar = document.createElement("div");
    sidebar.id = "asreview-sidebar";
    sidebar.className = this.isOpen ? "asreview-open" : "";

    // Check if we're on ASReview LAB
    const isASReviewSite =
      window.location.hostname === "localhost" &&
      window.location.port === "3000";

    let tagsHTML = "";
    if (this.recordData.tagsForm && this.recordData.tagsForm.length > 0) {
      tagsHTML = `<div class="tag-groups">`;
    }

    if (this.recordData.tagsForm && this.recordData.tagsForm.length > 0) {
      this.recordData.tagsForm.forEach((group, groupIndex) => {
        tagsHTML += `
          <div class="tag-group">
            <h4 class="tag-group-label">${group.label}</h4>
            <div class="tag-options">`;

        group.values.forEach((value, valueIndex) => {
          // Match the webapp's checked logic: tagValues?.[i]?.values[j]?.checked
          const isChecked =
            this.recordData.tagValues?.[groupIndex]?.values[valueIndex]
              ?.checked || false;
          tagsHTML += `
            <label class="tag-checkbox">
              <input type="checkbox" class="asreview-checkbox-input" data-group="${
                group.id
              }" data-value="${value.id}" ${isChecked ? "checked" : ""}>
              ${value.label}
            </label>`;
        });

        tagsHTML += `
            </div>
          </div>`;
      });

      tagsHTML += `</div>`;
    }

    sidebar.innerHTML = `
      <div class="asreview-content">
        <div class="asreview-header">
          <div class="header-content">
            <h4 class="record-title">${
              this.recordData.title || "No title available"
            }</h4>
          </div>
        </div>
        <div class="main-content">
          
          ${tagsHTML}
          
          <div class="note-section">
            <div class="note-paper">
              <div class="note-section-title">
                <svg class="note-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m-7-.25c.41 0 .75.34.75.75s-.34.75-.75.75-.75-.34-.75-.75.34-.75.75-.75M19 19H5V5h14z"></path>
                  <path d="m15.08 11.03-2.12-2.12L7 14.86V17h2.1zm1.77-1.76c.2-.2.2-.51 0-.71l-1.41-1.41c-.2-.2-.51-.2-.71 0l-1.06 1.06 2.12 2.12z"></path>
                </svg>
                Note
              </div>
              <textarea id="note-input">${this.recordData.note || ""}</textarea>
              <button id="save-note-btn" class="save-note-btn">Save Note</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(sidebar);
    this.attachEventListeners();

    // Force fix checkboxes after a brief delay to handle problematic websites
    setTimeout(() => this.forceFixCheckboxes(), 100);

    if (
      window.location.hostname === "localhost" &&
      window.location.port === "3000"
    ) {
      setTimeout(() => this.forceFixCheckboxes(), 500);
    }
  }

  forceFixCheckboxes() {
    // Additional defensive measure: force fix any hidden checkboxes
    const checkboxes = document.querySelectorAll(
      '#asreview-sidebar input[type="checkbox"]'
    );
    checkboxes.forEach((checkbox) => {
      // Apply critical styles directly to the element as a last resort
      if (
        window.getComputedStyle(checkbox).display === "none" ||
        window.getComputedStyle(checkbox).visibility === "hidden" ||
        window.getComputedStyle(checkbox).opacity === "0"
      ) {
        checkbox.style.setProperty("display", "inline-block", "important");
        checkbox.style.setProperty("visibility", "visible", "important");
        checkbox.style.setProperty("opacity", "1", "important");
        checkbox.style.setProperty("width", "18px", "important");
        checkbox.style.setProperty("height", "18px", "important");
        checkbox.style.setProperty("appearance", "auto", "important");
        checkbox.style.setProperty(
          "-webkit-appearance",
          "checkbox",
          "important"
        );
        checkbox.style.setProperty("-moz-appearance", "checkbox", "important");
      }

      if (
        window.location.hostname === "localhost" &&
        window.location.port === "3000"
      ) {
        checkbox.style.setProperty("appearance", "auto", "important");
        checkbox.style.setProperty(
          "-webkit-appearance",
          "checkbox",
          "important"
        );
        checkbox.style.setProperty("-moz-appearance", "checkbox", "important");
      }
    });
  }

  attachEventListeners() {
    const checkboxes = document.querySelectorAll(
      '#asreview-sidebar input[type="checkbox"], #asreview-sidebar .asreview-checkbox-input'
    );

    checkboxes.forEach((checkbox) => {
      this.addEventListenerTracked(checkbox, "change", (e) => {
        // Immediately remove focus to prevent blue highlight
        e.target.blur();
        const mainContent = document.querySelector(
          "#asreview-sidebar .main-content"
        );
        const scrollTop = mainContent ? mainContent.scrollTop : 0;

        // Store scroll position for immediate restoration
        this._preservedScrollTop = scrollTop;
        this.onTagChange();
      });

      this.addEventListenerTracked(checkbox, "click", (e) => {
        setTimeout(() => e.target.blur(), 1);
      });

      this.addEventListenerTracked(checkbox, "mousedown", (e) => {
        setTimeout(() => e.target.blur(), 1);
      });
    });

    const saveNoteBtn = document.getElementById("save-note-btn");
    if (saveNoteBtn) {
      this.addEventListenerTracked(saveNoteBtn, "click", () => {
        this.saveNote();
      });
    }
  }

  updateUI() {
    const mainContent = document.querySelector(
      "#asreview-sidebar .main-content"
    );
    const scrollTop =
      this._preservedScrollTop !== undefined
        ? this._preservedScrollTop
        : mainContent
        ? mainContent.scrollTop
        : 0;

    if (this.recordData.tagsForm) {
      this.recordData.tagsForm.forEach((group, groupIndex) => {
        group.values.forEach((value, valueIndex) => {
          const checkbox = document.querySelector(
            `#asreview-sidebar input[data-group="${group.id}"][data-value="${value.id}"]`
          );
          if (checkbox) {
            checkbox.checked =
              this.recordData.tagValues?.[groupIndex]?.values[valueIndex]
                ?.checked || false;
          }
        });
      });
    }

    const noteInput = document.getElementById("note-input");
    if (noteInput) {
      const newNoteValue = this.recordData.note || "";
      noteInput.value = newNoteValue;
    }

    if (mainContent) {
      mainContent.scrollTop = scrollTop;
    }
    this._preservedScrollTop = undefined;
  }

  async saveNote() {
    const note = document.getElementById("note-input")?.value || "";
    const saveButton = document.getElementById("save-note-btn");

    this.recordData.note = note;
    if (saveButton) {
      saveButton.innerHTML = "Saving...";
      saveButton.disabled = true;
    }
    try {
      if (!chrome.runtime?.id) {
        console.warn(
          "ASReview Extension Content: Extension context invalidated, please reload page"
        );
        return;
      }

      const response = await chrome.runtime.sendMessage({
        type: "SAVE_TAGS",
        tags: this.recordData.tagValues,
        note: note,
      });

      if (saveButton) {
        saveButton.innerHTML = "✓ Saved!";
        setTimeout(() => {
          saveButton.innerHTML = "Save Note";
          saveButton.disabled = false;
        }, 2000);
      }
    } catch (error) {
      console.error("ASReview Extension Content: Error saving note:", error);
      if (saveButton) {
        saveButton.innerHTML = "Error!";
        setTimeout(() => {
          saveButton.innerHTML = "Save Note";
          saveButton.disabled = false;
        }, 2000);
      }
    }
  }

  async onTagChange() {
    let tagValuesCopy = structuredClone(this.recordData.tagValues);

    if (this.recordData.tagsForm) {
      this.recordData.tagsForm.forEach((group, groupIndex) => {
        group.values.forEach((value, valueIndex) => {
          const checkbox = document.querySelector(
            `#asreview-sidebar input[data-group="${group.id}"][data-value="${value.id}"]`
          );
          if (checkbox && tagValuesCopy[groupIndex]?.values[valueIndex]) {
            tagValuesCopy[groupIndex].values[valueIndex].checked =
              checkbox.checked;
          }
        });
      });
    }

    const note = document.getElementById("note-input")?.value || "";

    this.recordData.tagValues = tagValuesCopy;
    this.recordData.note = note;
    try {
      if (!chrome.runtime?.id) {
        console.warn(
          "ASReview Extension Content: Extension context invalidated, please reload page"
        );
        return;
      }

      const response = await chrome.runtime.sendMessage({
        type: "SAVE_TAGS",
        tags: tagValuesCopy,
        note: note,
      });
      if (response && response.success === false) {
        throw new Error(response.error || "Unknown error occurred");
      }
    } catch (error) {
      if (error.message.includes("Extension context invalidated")) {
        console.warn(
          "ASReview Extension Content: Extension context invalidated, please reload page"
        );
      } else {
        console.error("ASReview Extension Content: Save failed", error);
      }
    }
  }
}

let asreviewSidebarInstance = null;

function initializeExtension() {
  if (asreviewSidebarInstance) {
    asreviewSidebarInstance.destroy();
  }

  asreviewSidebarInstance = new ASReviewSidebar();
  window.asreviewSidebar = asreviewSidebarInstance;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeExtension);
} else {
  initializeExtension();
}

window.addEventListener("beforeunload", () => {
  if (asreviewSidebarInstance) {
    asreviewSidebarInstance.destroy();
    asreviewSidebarInstance = null;
  }
});
