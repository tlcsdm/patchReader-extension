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
        renderDiff();
        saveState();
      })
      .catch(error => {
        showError(`文件读取失败: ${error.message}`);
      });

    // Reset file input
    fileInput.value = '';
  }

  // Render diff content
  function renderDiff() {
    const diffString = diffInput.value.trim();
    
    if (!diffString) {
      diffOutput.innerHTML = '<div class="placeholder">输入或上传 patch/diff 内容后，渲染结果将显示在这里</div>';
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
        renderNothingWhenEmpty: false
      });

      diffOutput.innerHTML = html;
      saveState();
    } catch (error) {
      showError(`渲染失败: ${error.message}`);
    }
  }

  // Clear all content
  function clearAll() {
    diffInput.value = '';
    diffOutput.innerHTML = '<div class="placeholder">输入或上传 patch/diff 内容后，渲染结果将显示在这里</div>';
    
    try {
      localStorage.removeItem('patchReader_content');
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
