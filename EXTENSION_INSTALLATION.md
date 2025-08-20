# ASReview Full-Text Companion Extension - Installation Guide

## Quick Setup (5 minutes)

### Prerequisites

- ASReview LAB installed: `pip install asreview`
- Chromium-based browser (Chrome, Edge, Brave, etc.)

### Step 1: Download Extension Files

1. Download or clone this repository
2. Locate the `asreview-extension/` folder

### Step 2: Install Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Turn on **"Developer mode"** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select the `asreview-extension/` folder
5. Extension should appear in your extensions list ✅

### Step 3: Start ASReview LAB

```bash
asreview lab
```

This opens ASReview LAB at `http://localhost:3000`

### Step 4: Test the Extension

1. Create or open a project in ASReview LAB
2. Go to **Review** mode (start screening records)
3. Open any publisher website (e.g., pubmed.ncbi.nlm.nih.gov, nature.com)
4. Click the ASReview extension icon on the right side of the page
5. You should see:
   - ✅ **"Connected to ASReview LAB"** status indicator
   - Current record's title, tags, and notes
   - Working tag checkboxes and note field

## Quick Test Checklist

- [ ] Extension icon appears on publisher websites
- [ ] Connection status shows "Connected" on publisher sites
- [ ] Current record data appears in extension sidebar
- [ ] Tag changes sync between extension and ASReview LAB
- [ ] Note changes save properly

## Troubleshooting

### Extension icon doesn't appear

- Make sure the website is supported (check manifest.json for full list)
- Refresh the page after installing the extension

### "No ASReview data" message

- Ensure ASReview LAB is running on `localhost:3000`
- Make sure you're in Review mode with an active record
- Check browser console for any error messages

### Tags not syncing

- Verify you're reviewing the same record in both ASReview LAB and the extension
- Check that ASReview LAB backend is running on `localhost:5000`

### Connection status shows "Not connected"

- Ensure ASReview LAB is running and accessible at `localhost:3000`
- Refresh the webpage after starting ASReview LAB
- Check if you have multiple ASReview tabs open (close duplicates)

### Extension doesn't work after reloading unpacked extension

- Refresh all open ASReview LAB tabs after reloading the extension
- Clear browser cache if issues persist

## How It Works

1. **ASReview LAB** (localhost:3000) sends current record data to the extension
2. **Extension** displays tags/notes on publisher websites
3. **Changes** made in extension are saved back to ASReview LAB
4. **Real-time sync** keeps everything in sync

## Supported Websites

The extension works on 50+ academic publisher websites including:

- PubMed (pubmed.ncbi.nlm.nih.gov)
- Nature (nature.com)
- ScienceDirect (sciencedirect.com)
- IEEE Xplore (ieeexplore.ieee.org)
- And many more!

## Need Help?

Open an issue in the ASReview repository with:

- Your Chrome version
- ASReview LAB version
- Console error messages (F12 → Console)
