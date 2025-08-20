# ASReview Full-Text Companion (Browser Extension)

This extension connects ASReview LAB to publisher websites, allowing you to screen and tag records while viewing the full text.

### Prerequisites

- ASReview LAB (`pip install asreview`)
- A Chromium-based browser (Chrome, Edge, Brave).

---

### 1. Get the Code

- **Option A: Clone the Repository (Recommended)**
  ```bash
  git clone https://github.com/asreview/asreview.git
  ```
- **Option B: Download ZIP**
  - Go to the [repository page](https://github.com/asreview/asreview).
  - Click `Code` -> `Download ZIP`.
  - Unzip the file.

The extension files are located in the `asreview-extension` folder.

### 2. Install the Extension

1.  Open your browser and navigate to `chrome://extensions`.
2.  Enable **Developer mode** (toggle is usually in the top-right).
3.  Click **Load unpacked**.
4.  Select the `asreview-extension` folder you downloaded or cloned.
5.  The ASReview icon will appear in your extensions list.

### 3. Start ASReview LAB

In your terminal, run:

```bash
asreview lab
```

### 4. How to Use

1.  Open a project in ASReview LAB and go to the **Review** screen.
2.  In a **new browser tab**, navigate to an article's webpage (e.g., on PubMed, ScienceDirect, etc.).
3.  The ASReview Companion panel will appear on the right.
4.  Use the panel to apply tags or add notes. Changes are synced back to your project instantly.

---

### Troubleshooting

- **Panel shows "No ASReview data":**

  - Ensure ASReview LAB is running.
  - Make sure you are on the **Review** screen in an active project.

- **Panel doesn't appear on a website:**

  - The website may not be supported yet.
  - Try refreshing the page.

- **Tagging/Notes not syncing:**
  - Ensure the ASReview LAB backend is running and accessible.
  - Refresh the ASReview LAB tab in your browser.
