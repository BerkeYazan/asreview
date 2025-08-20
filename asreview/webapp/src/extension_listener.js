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
      console.log("ASReview Extension Sync: Extension triggered refresh!");
      console.log("Available refetch function:", !!window.currentRecordRefetch);
      if (window.currentRecordRefetch) {
        console.log("Calling refetch now...");
        window.currentRecordRefetch();
      } else {
        console.error("No refetch function available!");
      }
    };

    // Listen for extension announcing itself
    window.addEventListener("asreview_extension_ready", (event) => {
      this.extensionId = event.detail.extensionId;
      console.log(
        "ASReview Extension Sync: Extension detected with ID:",
        this.extensionId,
      );
    });

    // Request extension to announce itself
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("asreview_webapp_ready"));
    }, 100);

    console.log("ASReview Extension Sync: Ready, waiting for extension...");
  }

  // Send current record and tag data to extension
  sendRecordData(recordData) {
    if (!this.extensionId) {
      console.log("ASReview Extension: No extension connected yet");
      return;
    }
    if (typeof chrome !== "undefined" && chrome.runtime) {
      try {
        chrome.runtime.sendMessage(this.extensionId, {
          type: "RECORD_DATA",
          data: recordData,
        });
        console.log("ASReview Extension: Sent record data to extension");
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
      console.log("ASReview Extension: No extension connected yet");
      return;
    }
    if (typeof chrome !== "undefined" && chrome.runtime) {
      try {
        chrome.runtime.sendMessage(this.extensionId, {
          type: "TAGS_UPDATED",
          tags: tags,
          note: note,
        });
        console.log("ASReview Extension: Sent tag update to extension");
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
