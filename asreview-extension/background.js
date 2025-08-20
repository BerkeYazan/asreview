class ASReviewExtensionBackground {
  constructor() {
    this.currentRecordData = null;
    this.init();
  }

  init() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) =>
      this.handleMessage(request, sender, sendResponse)
    );
    chrome.runtime.onMessageExternal.addListener(
      (request, sender, sendResponse) =>
        this.handleMessage(request, sender, sendResponse)
    );

    if (chrome.action && chrome.action.setBadgeText) {
      chrome.action.setBadgeText({ text: "" });
    }
  }

  async handleMessage(request, sender, sendResponse) {
    switch (request.type) {
      case "RECORD_DATA":
        this.currentRecordData = request.data;
        this.notifyContentScripts("RECORD_UPDATED", request.data);
        break;

      case "TAGS_UPDATED":
        if (this.currentRecordData) {
          this.currentRecordData.tagValues = request.tags;
          this.currentRecordData.note = request.note;
        }
        this.notifyContentScripts("TAGS_UPDATED", {
          tags: request.tags,
          note: request.note,
        });
        break;

      case "GET_CURRENT_RECORD":
        sendResponse(this.currentRecordData);
        break;

      case "SAVE_TAGS":
        (async () => {
          try {
            await this.saveTagsToWebapp(request.tags, request.note);
            sendResponse({ success: true });
          } catch (error) {
            console.error(
              "ASReview Extension Background: Failed to save tags",
              error
            );
            sendResponse({ success: false, error: error.message });
          }
        })();
        return true;
    }
  }

  notifyContentScripts(type, data) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { type, data }).catch(() => {});
      });
    });
  }

  async saveTagsToWebapp(tags, note, retryCount = 0) {
    const maxRetries = 3;

    if (
      !this.currentRecordData?.project_id ||
      !this.currentRecordData?.record_id
    ) {
      throw new Error("No active record data");
    }

    const { project_id, record_id } = this.currentRecordData;

    try {
      await this._performSave(project_id, record_id, tags, note);
      this.notifyWebapp();
    } catch (error) {
      if (retryCount < maxRetries && this._isRetryableError(error)) {
        console.warn(
          `Attempt ${retryCount + 1} failed, retrying...`,
          error.message
        );
        await this._delay(1000 * (retryCount + 1));
        return this.saveTagsToWebapp(tags, note, retryCount + 1);
      }
      throw error;
    }
  }

  _isRetryableError(error) {
    return (
      error.message.includes("Failed to fetch") ||
      error.message.includes("HTTP 500") ||
      error.message.includes("HTTP 502") ||
      error.message.includes("HTTP 503")
    );
  }

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async _performSave(project_id, record_id, tags, note) {
    if (tags !== undefined) {
      const tagsFormData = new FormData();
      tagsFormData.set("tags", JSON.stringify(tags));

      const tagsResponse = await fetch(
        `http://localhost:5000/api/projects/${project_id}/record/${record_id}/state`,
        {
          method: "PUT",
          body: tagsFormData,
          credentials: "include",
        }
      );

      if (!tagsResponse.ok) {
        throw new Error(`Tags save failed: HTTP ${tagsResponse.status}`);
      }
    }

    if (note !== undefined) {
      const noteFormData = new FormData();
      noteFormData.set("record_id", record_id);
      noteFormData.set("note", note);

      const noteResponse = await fetch(
        `http://localhost:5000/api/projects/${project_id}/record/${record_id}/note`,
        {
          method: "PUT",
          body: noteFormData,
          credentials: "include",
        }
      );

      if (!noteResponse.ok) {
        const responseText = await noteResponse.text();
        throw new Error(
          `Note save failed: HTTP ${noteResponse.status}: ${noteResponse.statusText}`
        );
      }

      const noteData = await noteResponse.json();
    }
  }

  notifyWebapp() {
    chrome.tabs.query({ url: "http://localhost:3000/*" }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.scripting
          .executeScript({
            target: { tabId: tab.id },
            func: () => {
              window.dispatchEvent(new Event("extensionDataChanged"));
            },
          })
          .catch(() => {});
      });
    });
  }
}

new ASReviewExtensionBackground();
