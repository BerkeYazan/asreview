/* global chrome */

class ASReviewExtensionSync {
  constructor() {
    this.extensionId = null;
    this.init();
  }

  init() {
    // Make this available globally so RecordCard can use it
    window.asreviewExtensionSync = this;
    window.refreshFromExtension = () => {
      if (window.currentRecordRefetch) {
        window.currentRecordRefetch();
      } else {
        console.error("No refetch function available!");
      }
    };

    // Listen for extension announcing itself
    window.addEventListener("asreview_extension_ready", (event) => {
      this.extensionId = event.detail.extensionId;
    });

    // Request extension to announce itself
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("asreview_webapp_ready"));
    }, 100);
  }

  // Send current record and tag data to extension
  sendRecordData(recordData) {
    if (!this.extensionId) {
      return;
    }
    if (typeof chrome !== "undefined" && chrome.runtime) {
      try {
        chrome.runtime.sendMessage(this.extensionId, {
          type: "RECORD_DATA",
          data: recordData,
        });
      } catch (e) {
        console.log(
          "ASReview Extension: Failed to send to extension:",
          e.message,
        );
      }
    }
  }

  // Send tag updates to extension
  sendTagUpdate(tags, note) {
    if (!this.extensionId) {
      return;
    }
    if (typeof chrome !== "undefined" && chrome.runtime) {
      try {
        chrome.runtime.sendMessage(this.extensionId, {
          type: "TAGS_UPDATED",
          tags: tags,
          note: note,
        });
      } catch (e) {
        console.log(
          "ASReview Extension: Failed to send to extension:",
          e.message,
        );
      }
    }
  }
}

new ASReviewExtensionSync();
