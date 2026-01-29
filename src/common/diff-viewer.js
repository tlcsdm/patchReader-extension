// Diff Viewer JavaScript
(function() {
  'use strict';

  // DOM Elements
  const diffInput = document.getElementById('diff-input');
  const diffOutput = document.getElementById('diff-output');
  const fileInput = document.getElementById('file-input');
  const renderBtn = document.getElementById('render-btn');
  const clearBtn = document.getElementById('clear-btn');
  const sideBySideBtn = document.getElementById('side-by-side-btn');
  const lineByLineBtn = document.getElementById('line-by-line-btn');

  // Current layout mode: 'side-by-side' or 'line-by-line'
  let currentLayout = 'side-by-side';

  // Track viewed files
  let viewedFiles = new Set();

  // Initialize
  function init() {
    bindEvents();
    loadSavedState();
  }

  // Bind event listeners
  function bindEvents() {
    renderBtn.addEventListener('click', renderDiff);
    clearBtn.addEventListener('click', clearAll);
    fileInput.addEventListener('change', handleFileUpload);
    sideBySideBtn.addEventListener('click', () => setLayout('side-by-side'));
    lineByLineBtn.addEventListener('click', () => setLayout('line-by-line'));
    
    // Auto-render on input change with debounce
    let debounceTimer;
    diffInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (diffInput.value.trim()) {
          renderDiff();
        }
      }, 500);
    });

    // Handle paste event
    diffInput.addEventListener('paste', () => {
      setTimeout(() => {
        if (diffInput.value.trim()) {
          renderDiff();
        }
      }, 100);
    });

    // Delegate click events for viewed checkboxes
    diffOutput.addEventListener('change', handleViewedCheckboxChange);

    // Drag and drop event listeners for the textarea
    diffInput.addEventListener('dragover', handleDragOver);
    diffInput.addEventListener('dragenter', handleDragEnter);
    diffInput.addEventListener('dragleave', handleDragLeave);
    diffInput.addEventListener('drop', handleDrop);
  }

  // Track drag enter/leave to handle nested elements
  let dragCounter = 0;

  // Handle drag over event
  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // Handle drag enter event
  function handleDragEnter(event) {
    event.preventDefault();
    event.stopPropagation();
    dragCounter++;
    diffInput.classList.add('drag-over');
  }

  // Handle drag leave event
  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    dragCounter--;
    if (dragCounter === 0) {
      diffInput.classList.remove('drag-over');
    }
  }

  // Handle drop event
  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    dragCounter = 0;
    diffInput.classList.remove('drag-over');

    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;

    // Filter for valid file types
    const validFiles = Array.from(files).filter(file => {
      const fileName = file.name.toLowerCase();
      return fileName.endsWith('.patch') || fileName.endsWith('.diff') || fileName.endsWith('.txt');
    });

    if (validFiles.length === 0) {
      const errorMsg = window.i18n ? window.i18n.getMessage('invalidFileType') : 'Please drop .patch, .diff, or .txt files';
      showError(errorMsg);
      return;
    }

    processFiles(validFiles);
  }

  // Process files (shared by drag-drop and file upload)
  function processFiles(files) {
    const readPromises = Array.from(files).map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({
          name: file.name,
          content: e.target.result
        });
        reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
        reader.readAsText(file);
      });
    });

    Promise.all(readPromises)
      .then(results => {
        // Combine all file contents
        const combinedContent = results.map(r => {
          // Add file header comment if multiple files
          if (results.length > 1) {
            return `# File: ${r.name}\n${r.content}`;
          }
          return r.content;
        }).join('\n\n');
        
        diffInput.value = combinedContent;
        // Clear viewed files when new content is loaded
        viewedFiles.clear();
        saveViewedFiles();
        renderDiff();
        saveState();
      })
      .catch(error => {
        const errorMsg = window.i18n ? window.i18n.getMessage('fileReadFailed') : 'File read failed';
        showError(`${errorMsg}: ${error.message}`);
      });
  }

  // Handle viewed checkbox change
  function handleViewedCheckboxChange(event) {
    if (event.target.classList.contains('viewed-checkbox')) {
      const fileHeader = event.target.closest('.d2h-file-header');
      const fileWrapper = event.target.closest('.d2h-file-wrapper');
      const fileId = event.target.dataset.fileId;
      
      if (event.target.checked) {
        viewedFiles.add(fileId);
        if (fileWrapper) {
          fileWrapper.classList.add('file-viewed');
        }
      } else {
        viewedFiles.delete(fileId);
        if (fileWrapper) {
          fileWrapper.classList.remove('file-viewed');
        }
      }
      
      saveViewedFiles();
    }
  }

  // Load saved state from localStorage
  function loadSavedState() {
    try {
      const savedLayout = localStorage.getItem('patchReader_layout');
      if (savedLayout && (savedLayout === 'side-by-side' || savedLayout === 'line-by-line')) {
        setLayout(savedLayout, false);
      }
      
      const savedContent = localStorage.getItem('patchReader_content');
      if (savedContent) {
        diffInput.value = savedContent;
        renderDiff();
      }
      
      // Load viewed files
      const savedViewedFiles = localStorage.getItem('patchReader_viewedFiles');
      if (savedViewedFiles) {
        viewedFiles = new Set(JSON.parse(savedViewedFiles));
      }
    } catch (e) {
      console.warn('Unable to load saved state:', e);
    }
  }

  // Save state to localStorage
  function saveState() {
    try {
      localStorage.setItem('patchReader_layout', currentLayout);
      localStorage.setItem('patchReader_content', diffInput.value);
    } catch (e) {
      console.warn('Unable to save state:', e);
    }
  }

  // Save viewed files to localStorage
  function saveViewedFiles() {
    try {
      localStorage.setItem('patchReader_viewedFiles', JSON.stringify([...viewedFiles]));
    } catch (e) {
      console.warn('Unable to save viewed files:', e);
    }
  }

  // Set layout mode
  function setLayout(layout, rerender = true) {
    currentLayout = layout;
    
    // Update button states
    if (layout === 'side-by-side') {
      sideBySideBtn.classList.add('active');
      lineByLineBtn.classList.remove('active');
    } else {
      sideBySideBtn.classList.remove('active');
      lineByLineBtn.classList.add('active');
    }
    
    saveState();
    
    // Re-render if there's content
    if (rerender && diffInput.value.trim()) {
      renderDiff();
    }
  }

  // Handle file upload
  function handleFileUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    processFiles(files);

    // Reset file input
    fileInput.value = '';
  }

  // Add viewed checkbox to file headers
  function addViewedCheckboxes() {
    const fileHeaders = diffOutput.querySelectorAll('.d2h-file-header');
    const viewedLabel = window.i18n ? window.i18n.getMessage('viewed') : 'Viewed';
    
    fileHeaders.forEach((header, index) => {
      // Check if checkbox already exists
      if (header.querySelector('.viewed-checkbox-wrapper')) return;
      
      // Get file name for identification
      const fileNameElement = header.querySelector('.d2h-file-name');
      const fileName = fileNameElement ? fileNameElement.textContent.trim() : `file-${index}`;
      const fileId = `${fileName}-${index}`;
      
      // Create checkbox wrapper
      const wrapper = document.createElement('label');
      wrapper.className = 'viewed-checkbox-wrapper';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'viewed-checkbox';
      checkbox.dataset.fileId = fileId;
      checkbox.checked = viewedFiles.has(fileId);
      
      const label = document.createElement('span');
      label.className = 'viewed-label';
      label.textContent = viewedLabel;
      
      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      
      // Insert at the end of file header
      header.appendChild(wrapper);
      
      // Apply viewed state
      const fileWrapper = header.closest('.d2h-file-wrapper');
      if (checkbox.checked && fileWrapper) {
        fileWrapper.classList.add('file-viewed');
      }
    });
  }

  // Render diff content
  function renderDiff() {
    const diffString = diffInput.value.trim();
    
    if (!diffString) {
      const placeholderMsg = window.i18n ? window.i18n.getMessage('placeholder') : 'After entering or uploading patch/diff content, the rendered result will be displayed here';
      diffOutput.innerHTML = `<div class="placeholder">${escapeHtml(placeholderMsg)}</div>`;
      return;
    }

    try {
      // Check if diff2html is available
      if (typeof Diff2Html === 'undefined') {
        throw new Error('Diff2Html library not loaded');
      }

      const outputFormat = currentLayout === 'side-by-side' ? 'side-by-side' : 'line-by-line';
      
      const html = Diff2Html.html(diffString, {
        inputFormat: 'diff',
        outputFormat: outputFormat,
        showFiles: true,
        matching: 'lines',
        matchWordsThreshold: 0.25,
        maxLineLengthHighlight: 10000,
        renderNothingWhenEmpty: false,
        fileListToggle: true,
        fileListStartVisible: true,
        fileContentToggle: true,
        stickyFileHeaders: true
      });

      diffOutput.innerHTML = html;
      
      // Add viewed checkboxes after rendering
      addViewedCheckboxes();
      
      saveState();
    } catch (error) {
      const errorMsg = window.i18n ? window.i18n.getMessage('renderFailed') : 'Render failed';
      showError(`${errorMsg}: ${error.message}`);
    }
  }

  // Clear all content
  function clearAll() {
    diffInput.value = '';
    const placeholderMsg = window.i18n ? window.i18n.getMessage('placeholder') : 'After entering or uploading patch/diff content, the rendered result will be displayed here';
    diffOutput.innerHTML = `<div class="placeholder">${escapeHtml(placeholderMsg)}</div>`;
    
    // Clear viewed files
    viewedFiles.clear();
    
    try {
      localStorage.removeItem('patchReader_content');
      localStorage.removeItem('patchReader_viewedFiles');
    } catch (e) {
      console.warn('Unable to clear saved content:', e);
    }
  }

  // Show error message
  function showError(message) {
    diffOutput.innerHTML = `<div class="error-message">${escapeHtml(message)}</div>`;
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
