// Tools Main JavaScript

// Tool Modal Management
function openTool(toolId) {
    const modal = document.createElement('div');
    modal.className = 'tool-modal';
    modal.id = `modal-${toolId}`;
    
    let content = '';
    
    switch(toolId) {
        case 'llm-chat':
            content = createLLMChatTool();
            break;
        case 'paper-finder':
            content = createPaperFinderTool();
            break;
        case 'pdf-to-jpg':
            content = createPDFToJPGTool();
            break;
        case 'pdf-reducer':
            content = createPDFReducerTool();
            break;
        case 'molecule-viz':
            content = createMoleculeVisualizerTool();
            break;
        case 'games':
            content = createGamesTool();
            break;
        case 'unit-converter':
            content = createUnitConverterTool();
            break;
        case 'mol-weight':
            content = createMolWeightTool();
            break;
        case 'periodic-table':
            content = createPeriodicTableTool();
            break;
        case 'equation-balancer':
            content = createEquationBalancerTool();
            break;
        case 'ph-calculator':
            content = createPHCalculatorTool();
            break;
    }
    
    modal.innerHTML = `
        <div class="tool-modal-content">
            ${content}
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animate in
    setTimeout(() => modal.classList.add('active'), 10);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
    
    // Initialize tool-specific functionality
    initializeTool(toolId);
}

function closeModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
}

// LLM Chat Tool
function createLLMChatTool() {
    return `
        <div class="tool-modal-header">
            <h2><i data-lucide="message-circle"></i> Chat with LLMs</h2>
            <button class="close-modal" onclick="closeModal(this.closest('.tool-modal'))">
                <i data-lucide="x"></i>
            </button>
        </div>
        <div class="llm-config">
            <div class="form-group">
                <label for="llm-provider">AI Provider</label>
                <select id="llm-provider" onchange="updateModelOptions()">
                    <option value="openai">OpenAI</option>
                    <option value="groq">Groq</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="gemini">Google Gemini</option>
                </select>
            </div>
            <div class="form-group">
                <label for="llm-api-key">API Key</label>
                <input type="password" id="llm-api-key" placeholder="Enter your API key">
                <small style="color: var(--text-secondary);">Your API key is stored locally and never sent to our servers</small>
            </div>
            <div class="form-group">
                <label for="llm-model">Model</label>
                <select id="llm-model">
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
            </div>
        </div>
        <div class="chat-container" id="chat-container">
            <div class="text-center" style="color: var(--text-secondary);">
                Enter your API key and start chatting!
            </div>
        </div>
        <div class="chat-input-group">
            <input type="text" id="chat-input" placeholder="Type your message...">
            <button class="btn btn-primary" onclick="sendChatMessage()">
                <i data-lucide="send"></i>
            </button>
        </div>
    `;
}

function updateModelOptions() {
    const provider = document.getElementById('llm-provider').value;
    const modelSelect = document.getElementById('llm-model');
    
    const modelsByProvider = {
        openai: [
            { value: 'gpt-4', label: 'GPT-4' },
            { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
            { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
        ],
        groq: [
            { value: 'llama3-70b-8192', label: 'Llama 3 70B' },
            { value: 'llama3-8b-8192', label: 'Llama 3 8B' },
            { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
            { value: 'gemma-7b-it', label: 'Gemma 7B' }
        ],
        anthropic: [
            { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
            { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
            { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
        ],
        gemini: [
            { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
            { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
            { value: 'gemini-pro', label: 'Gemini Pro' }
        ],
        openrouter: [
            { value: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo' },
            { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus' },
            { value: 'google/gemini-pro', label: 'Gemini Pro' },
            { value: 'meta-llama/llama-3-70b', label: 'Llama 3 70B' }
        ]
    };
    
    modelSelect.innerHTML = '';
    const models = modelsByProvider[provider] || [];
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.value;
        option.textContent = model.label;
        modelSelect.appendChild(option);
    });
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;
    
    const chatContainer = document.getElementById('chat-container');
    const apiKey = document.getElementById('llm-api-key').value;
    const provider = document.getElementById('llm-provider').value;
    const model = document.getElementById('llm-model').value;
    
    if (!apiKey) {
        alert('Please enter your API key first');
        return;
    }
    
    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.textContent = message;
    chatContainer.appendChild(userMsg);
    
    input.value = '';
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Add loading message
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'chat-message assistant';
    loadingMsg.innerHTML = '<span class="loading-spinner"></span> Thinking...';
    chatContainer.appendChild(loadingMsg);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    try {
        const response = await callLLMAPI(provider, apiKey, model, message);
        loadingMsg.innerHTML = response;
    } catch (error) {
        loadingMsg.innerHTML = `Error: ${error.message}`;
        loadingMsg.style.color = 'red';
    }
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
    lucide.createIcons();
}

async function callLLMAPI(provider, apiKey, model, message) {
    const endpoints = {
        openai: 'https://api.openai.com/v1/chat/completions',
        groq: 'https://api.groq.com/openai/v1/chat/completions',
        anthropic: 'https://api.anthropic.com/v1/messages',
        openrouter: 'https://openrouter.ai/api/v1/chat/completions',
        // Note: Gemini API requires API key in URL per Google's official documentation
        gemini: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    };
    
    const headers = {
        'Content-Type': 'application/json',
    };
    
    let body;
    
    if (provider === 'anthropic') {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        body = {
            model: model || 'claude-3-sonnet-20240229',
            messages: [{ role: 'user', content: message }],
            max_tokens: 1024
        };
    } else if (provider === 'gemini') {
        // Gemini API - API key in URL
        body = {
            contents: [{
                parts: [{ text: message }]
            }]
        };
    } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
        body = {
            model: model,
            messages: [{ role: 'user', content: message }]
        };
    }
    
    const response = await fetch(endpoints[provider], {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (provider === 'anthropic') {
        return data.content[0].text;
    } else if (provider === 'gemini') {
        return data.candidates[0].content.parts[0].text;
    } else {
        return data.choices[0].message.content;
    }
}

// Research Paper Finder Tool
function createPaperFinderTool() {
    return `
        <div class="tool-modal-header">
            <h2><i data-lucide="search"></i> Research Paper Finder</h2>
            <button class="close-modal" onclick="closeModal(this.closest('.tool-modal'))">
                <i data-lucide="x"></i>
            </button>
        </div>
        <div class="search-container">
            <div class="form-group">
                <label for="paper-query">Search Query</label>
                <input type="text" id="paper-query" placeholder="Enter keywords, authors, or topics...">
            </div>
            <div class="search-filters">
                <div class="form-group">
                    <label for="paper-source">Source</label>
                    <select id="paper-source">
                        <option value="semantic">Semantic Scholar</option>
                        <option value="arxiv">arXiv</option>
                        <option value="both">Both</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="paper-year">Year</label>
                    <select id="paper-year">
                        <option value="">All Years</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2021">2021</option>
                    </select>
                </div>
            </div>
            <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="searchPapers()">
                <i data-lucide="search"></i> Search Papers
            </button>
        </div>
        <div class="paper-results" id="paper-results">
            <div class="text-center" style="color: var(--text-secondary);">
                Enter a search query to find research papers
            </div>
        </div>
    `;
}

async function searchPapers() {
    const query = document.getElementById('paper-query').value.trim();
    const source = document.getElementById('paper-source').value;
    const year = document.getElementById('paper-year').value;
    const resultsContainer = document.getElementById('paper-results');
    
    if (!query) {
        alert('Please enter a search query');
        return;
    }
    
    resultsContainer.innerHTML = '<div class="text-center"><span class="loading-spinner"></span> Searching...</div>';
    
    try {
        let papers = [];
        
        if (source === 'semantic' || source === 'both') {
            const semanticPapers = await searchSemanticScholar(query, year);
            papers = papers.concat(semanticPapers);
        }
        
        if (source === 'arxiv' || source === 'both') {
            const arxivPapers = await searchArXiv(query, year);
            papers = papers.concat(arxivPapers);
        }
        
        displayPapers(papers);
    } catch (error) {
        resultsContainer.innerHTML = `<div style="color: red;">Error: ${error.message}</div>`;
    }
}

async function searchSemanticScholar(query, year) {
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=10&fields=title,authors,abstract,year,url,citationCount`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Semantic Scholar API error');
    
    const data = await response.json();
    return data.data.map(paper => ({
        title: paper.title,
        authors: paper.authors?.map(a => a.name).join(', ') || 'Unknown',
        abstract: paper.abstract || 'No abstract available',
        year: paper.year,
        url: paper.url,
        citations: paper.citationCount,
        source: 'Semantic Scholar'
    })).filter(paper => !year || paper.year === parseInt(year));
}

async function searchArXiv(query, year) {
    const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=10`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('arXiv API error');
    
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const entries = xml.querySelectorAll('entry');
    
    return Array.from(entries).map(entry => {
        const published = entry.querySelector('published')?.textContent || '';
        const paperYear = new Date(published).getFullYear();
        
        return {
            title: entry.querySelector('title')?.textContent.trim() || 'No title',
            authors: Array.from(entry.querySelectorAll('author name')).map(a => a.textContent).join(', '),
            abstract: entry.querySelector('summary')?.textContent.trim() || 'No abstract',
            year: paperYear,
            url: entry.querySelector('id')?.textContent || '',
            source: 'arXiv'
        };
    }).filter(paper => !year || paper.year === parseInt(year));
}

function displayPapers(papers) {
    const resultsContainer = document.getElementById('paper-results');
    
    if (papers.length === 0) {
        resultsContainer.innerHTML = '<div class="text-center" style="color: var(--text-secondary);">No papers found</div>';
        return;
    }
    
    resultsContainer.innerHTML = papers.map(paper => `
        <div class="paper-card">
            <div class="paper-title">${paper.title}</div>
            <div class="paper-authors">${paper.authors} • ${paper.year || 'N/A'} • ${paper.source}</div>
            <div class="paper-abstract">${paper.abstract.substring(0, 300)}${paper.abstract.length > 300 ? '...' : ''}</div>
            <div class="paper-links">
                <a href="${paper.url}" target="_blank" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="external-link"></i> View Paper
                </a>
                ${paper.citations ? `<span style="color: var(--text-secondary);">Citations: ${paper.citations}</span>` : ''}
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

// PDF to JPG Tool
function createPDFToJPGTool() {
    return `
        <div class="tool-modal-header">
            <h2><i data-lucide="image"></i> PDF to JPG Converter</h2>
            <button class="close-modal" onclick="closeModal(this.closest('.tool-modal'))">
                <i data-lucide="x"></i>
            </button>
        </div>
        <div class="pdf-upload-area" id="pdf-upload-jpg" onclick="document.getElementById('pdf-file-jpg').click()">
            <i data-lucide="upload" style="width: 48px; height: 48px; margin: 0 auto 1rem; display: block;"></i>
            <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">Drop PDF file here or click to browse</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Converts PDF pages to JPG images</p>
            <input type="file" id="pdf-file-jpg" accept=".pdf" style="display: none;" onchange="convertPDFToJPG(this.files[0])">
        </div>
        <div class="pdf-preview" id="jpg-preview"></div>
    `;
}

async function convertPDFToJPG(file) {
    if (!file) return;
    
    const preview = document.getElementById('jpg-preview');
    preview.innerHTML = '<div class="text-center"><span class="loading-spinner"></span> Converting PDF...</div>';
    
    try {
        // Load PDF.js from CDN
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        preview.innerHTML = '';
        
        // Store images for bulk download
        window.pdfImages = [];
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2 });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            window.pdfImages.push({ dataUrl, filename: `page-${i}.jpg` });
            
            const pageDiv = document.createElement('div');
            pageDiv.className = 'pdf-page-preview';
            pageDiv.innerHTML = `
                <img src="${dataUrl}" alt="Page ${i}">
                <button class="btn btn-secondary" style="width: 100%; margin-top: 0.5rem;" onclick="downloadImage(this, 'page-${i}.jpg')">
                    <i data-lucide="download"></i> Download Page ${i}
                </button>
            `;
            preview.appendChild(pageDiv);
        }
        
        // Add bulk download button
        const bulkDownloadBtn = document.createElement('div');
        bulkDownloadBtn.style.cssText = 'grid-column: 1 / -1; margin-top: 1rem;';
        bulkDownloadBtn.innerHTML = `
            <button class="btn btn-primary" style="width: 100%;" onclick="downloadAllAsZip()">
                <i data-lucide="download"></i> Download All as ZIP
            </button>
        `;
        preview.appendChild(bulkDownloadBtn);
        
        lucide.createIcons();
    } catch (error) {
        preview.innerHTML = `<div style="color: red;">Error: ${error.message}</div>`;
    }
}

function downloadImage(button, filename) {
    const img = button.parentElement.querySelector('img');
    const link = document.createElement('a');
    link.href = img.src;
    link.download = filename;
    link.click();
}

// Download all images as ZIP
async function downloadAllAsZip() {
    if (!window.pdfImages || window.pdfImages.length === 0) {
        alert('No images to download');
        return;
    }
    
    try {
        // Load JSZip from CDN if not already loaded
        if (!window.JSZip) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        
        const zip = new JSZip();
        
        // Add each image to the ZIP
        for (const { dataUrl, filename } of window.pdfImages) {
            // Convert data URL to blob
            const base64Data = dataUrl.split(',')[1];
            const blob = await fetch(dataUrl).then(r => r.blob());
            zip.file(filename, blob);
        }
        
        // Generate ZIP and trigger download
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'pdf-images.zip';
        link.click();
    } catch (error) {
        alert('Error creating ZIP file: ' + error.message);
    }
}


// PDF Size Reducer Tool
function createPDFReducerTool() {
    return `
        <div class="tool-modal-header">
            <h2><i data-lucide="minimize-2"></i> PDF Size Reducer</h2>
            <button class="close-modal" onclick="closeModal(this.closest('.tool-modal'))">
                <i data-lucide="x"></i>
            </button>
        </div>
        <div class="form-group">
            <label for="compression-level">Compression Level</label>
            <select id="compression-level">
                <option value="0.5">High (50% quality)</option>
                <option value="0.7" selected>Medium (70% quality)</option>
                <option value="0.9">Low (90% quality)</option>
            </select>
        </div>
        <div class="pdf-upload-area" id="pdf-upload-reduce" onclick="document.getElementById('pdf-file-reduce').click()">
            <i data-lucide="upload" style="width: 48px; height: 48px; margin: 0 auto 1rem; display: block;"></i>
            <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">Drop PDF file here or click to browse</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Compress PDF to reduce file size</p>
            <input type="file" id="pdf-file-reduce" accept=".pdf" style="display: none;" onchange="reducePDFSize(this.files[0])">
        </div>
        <div id="reduce-result"></div>
    `;
}

async function reducePDFSize(file) {
    if (!file) return;
    
    const result = document.getElementById('reduce-result');
    const quality = parseFloat(document.getElementById('compression-level').value);
    
    result.innerHTML = '<div class="text-center"><span class="loading-spinner"></span> Compressing PDF...</div>';
    
    try {
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        // Create new PDF with compressed images
        const { jsPDF } = window.jspdf;
        const newPdf = new jsPDF();
        
        for (let i = 1; i <= pdf.numPages; i++) {
            if (i > 1) newPdf.addPage();
            
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            
            const imgData = canvas.toDataURL('image/jpeg', quality);
            newPdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        }
        
        const compressedBlob = newPdf.output('blob');
        const originalSize = (file.size / 1024 / 1024).toFixed(2);
        const compressedSize = (compressedBlob.size / 1024 / 1024).toFixed(2);
        const savings = ((1 - compressedBlob.size / file.size) * 100).toFixed(1);
        
        result.innerHTML = `
            <div class="paper-card">
                <h3>Compression Complete!</h3>
                <p>Original Size: ${originalSize} MB</p>
                <p>Compressed Size: ${compressedSize} MB</p>
                <p>Savings: ${savings}%</p>
                <button class="btn btn-primary" onclick="downloadCompressedPDF()" style="margin-top: 1rem;">
                    <i data-lucide="download"></i> Download Compressed PDF
                </button>
            </div>
        `;
        
        window.compressedPDF = compressedBlob;
        lucide.createIcons();
    } catch (error) {
        result.innerHTML = `<div style="color: red;">Error: ${error.message}</div>`;
    }
}

function downloadCompressedPDF() {
    if (window.compressedPDF) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(window.compressedPDF);
        link.download = 'compressed.pdf';
        link.click();
    }
}

// Molecule Visualizer Tool
function createMoleculeVisualizerTool() {
    return `
        <div class="tool-modal-header">
            <h2><i data-lucide="atom"></i> Molecule Visualizer</h2>
            <button class="close-modal" onclick="closeModal(this.closest('.tool-modal'))">
                <i data-lucide="x"></i>
            </button>
        </div>
        <div class="molecule-controls">
            <div class="form-group">
                <label for="molecule-select">Select Molecule</label>
                <select id="molecule-select" onchange="changeMolecule(this.value)">
                    <option value="water">Water (H₂O)</option>
                    <option value="methane">Methane (CH₄)</option>
                    <option value="benzene">Benzene (C₆H₆)</option>
                    <option value="caffeine">Caffeine</option>
                    <option value="dna">DNA Helix</option>
                </select>
            </div>
            <button class="btn btn-secondary" onclick="rotateMolecule()">
                <i data-lucide="rotate-cw"></i> Rotate
            </button>
        </div>
        <canvas id="molecule-canvas"></canvas>
    `;
}

// Games Tool
function createGamesTool() {
    return `
        <div class="tool-modal-header">
            <h2><i data-lucide="gamepad-2"></i> Chemistry Games</h2>
            <button class="close-modal" onclick="closeModal(this.closest('.tool-modal'))">
                <i data-lucide="x"></i>
            </button>
        </div>
        <div class="games-grid">
            <div class="game-card" onclick="startGame('periodic-table')">
                <div class="game-icon">🧪</div>
                <h3>Periodic Table Quiz</h3>
                <p>Test your knowledge of chemical elements</p>
            </div>
            <div class="game-card" onclick="startGame('molecule-builder')">
                <div class="game-icon">⚛️</div>
                <h3>Molecule Builder</h3>
                <p>Build molecules from atoms</p>
            </div>
            <div class="game-card" onclick="startGame('balance-equations')">
                <div class="game-icon">⚖️</div>
                <h3>Balance Equations</h3>
                <p>Balance chemical equations</p>
            </div>
            <div class="game-card" onclick="startGame('memory-elements')">
                <div class="game-icon">🎴</div>
                <h3>Element Memory</h3>
                <p>Match element symbols with names</p>
            </div>
        </div>
        <canvas id="game-canvas" style="display: none;"></canvas>
        <div id="game-content"></div>
    `;
}

function startGame(gameType) {
    const gameContent = document.getElementById('game-content');
    const canvas = document.getElementById('game-canvas');
    
    switch(gameType) {
        case 'periodic-table':
            startPeriodicTableQuiz(gameContent);
            break;
        case 'molecule-builder':
            canvas.style.display = 'block';
            startMoleculeBuilder(canvas);
            break;
        case 'balance-equations':
            startBalanceEquations(gameContent);
            break;
        case 'memory-elements':
            startMemoryGame(gameContent);
            break;
    }
}

function startPeriodicTableQuiz(container) {
    const elements = [
        { symbol: 'H', name: 'Hydrogen', number: 1 },
        { symbol: 'He', name: 'Helium', number: 2 },
        { symbol: 'C', name: 'Carbon', number: 6 },
        { symbol: 'N', name: 'Nitrogen', number: 7 },
        { symbol: 'O', name: 'Oxygen', number: 8 },
        { symbol: 'Fe', name: 'Iron', number: 26 },
        { symbol: 'Au', name: 'Gold', number: 79 },
        { symbol: 'Ag', name: 'Silver', number: 47 },
    ];
    
    let score = 0;
    let currentQuestion = 0;
    
    function showQuestion() {
        if (currentQuestion >= elements.length) {
            container.innerHTML = `
                <div class="paper-card text-center">
                    <h2>Quiz Complete!</h2>
                    <p style="font-size: 2rem; margin: 2rem 0;">Score: ${score}/${elements.length}</p>
                    <button class="btn btn-primary" onclick="startGame('periodic-table')">Play Again</button>
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        const element = elements[currentQuestion];
        const options = [...elements].sort(() => Math.random() - 0.5).slice(0, 4);
        if (!options.includes(element)) options[0] = element;
        options.sort(() => Math.random() - 0.5);
        
        container.innerHTML = `
            <div class="paper-card">
                <h3>Question ${currentQuestion + 1}/${elements.length}</h3>
                <p style="font-size: 1.5rem; margin: 2rem 0;">What is the name of element <strong>${element.symbol}</strong>?</p>
                <div style="display: grid; gap: 1rem;">
                    ${options.map(opt => `
                        <button class="btn btn-secondary" onclick="checkAnswer('${opt.name}', '${element.name}')" style="font-size: 1.1rem;">
                            ${opt.name}
                        </button>
                    `).join('')}
                </div>
                <p style="margin-top: 1rem; color: var(--text-secondary);">Score: ${score}</p>
            </div>
        `;
        lucide.createIcons();
    }
    
    window.checkAnswer = function(answer, correct) {
        if (answer === correct) {
            score++;
        }
        currentQuestion++;
        showQuestion();
    };
    
    showQuestion();
}

function startBalanceEquations(container) {
    container.innerHTML = `
        <div class="paper-card">
            <h3>Balance this equation:</h3>
            <p style="font-size: 1.5rem; margin: 2rem 0; text-align: center;">
                H₂ + O₂ → H₂O
            </p>
            <p>Enter coefficients:</p>
            <div style="display: flex; gap: 1rem; align-items: center; justify-content: center; margin: 2rem 0;">
                <input type="number" id="coef1" min="1" max="10" value="1" style="width: 60px; padding: 0.5rem; text-align: center;">
                <span>H₂ +</span>
                <input type="number" id="coef2" min="1" max="10" value="1" style="width: 60px; padding: 0.5rem; text-align: center;">
                <span>O₂ →</span>
                <input type="number" id="coef3" min="1" max="10" value="1" style="width: 60px; padding: 0.5rem; text-align: center;">
                <span>H₂O</span>
            </div>
            <button class="btn btn-primary" onclick="checkBalance()">Check Answer</button>
            <div id="balance-result" style="margin-top: 1rem;"></div>
        </div>
    `;
    
    window.checkBalance = function() {
        const c1 = parseInt(document.getElementById('coef1').value);
        const c2 = parseInt(document.getElementById('coef2').value);
        const c3 = parseInt(document.getElementById('coef3').value);
        
        const result = document.getElementById('balance-result');
        
        if (c1 === 2 && c2 === 1 && c3 === 2) {
            result.innerHTML = '<p style="color: green; font-weight: bold;">✓ Correct! 2H₂ + O₂ → 2H₂O</p>';
        } else {
            result.innerHTML = '<p style="color: red; font-weight: bold;">✗ Try again!</p>';
        }
    };
    
    lucide.createIcons();
}

function startMemoryGame(container) {
    const pairs = [
        { symbol: 'H', name: 'Hydrogen' },
        { symbol: 'He', name: 'Helium' },
        { symbol: 'C', name: 'Carbon' },
        { symbol: 'O', name: 'Oxygen' },
    ];
    
    const cards = [...pairs.map(p => ({ type: 'symbol', value: p.symbol, pair: p.name })),
                   ...pairs.map(p => ({ type: 'name', value: p.name, pair: p.symbol }))];
    
    cards.sort(() => Math.random() - 0.5);
    
    let flipped = [];
    let matched = [];
    
    container.innerHTML = `
        <div class="paper-card">
            <h3>Element Memory Game</h3>
            <p>Match element symbols with their names</p>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 2rem;">
                ${cards.map((card, i) => `
                    <button class="btn btn-secondary memory-card" data-index="${i}" onclick="flipCard(${i})" style="height: 100px; font-size: 1.2rem;">
                        ?
                    </button>
                `).join('')}
            </div>
            <div id="memory-result" style="margin-top: 1rem;"></div>
        </div>
    `;
    
    window.memoryCards = cards;
    window.memoryFlipped = flipped;
    window.memoryMatched = matched;
    
    window.flipCard = function(index) {
        if (flipped.length >= 2 || flipped.includes(index) || matched.includes(index)) return;
        
        const cardEl = document.querySelector(`[data-index="${index}"]`);
        cardEl.textContent = cards[index].value;
        flipped.push(index);
        
        if (flipped.length === 2) {
            const [i1, i2] = flipped;
            const card1 = cards[i1];
            const card2 = cards[i2];
            
            setTimeout(() => {
                if ((card1.type === 'symbol' && card2.value === card1.pair) ||
                    (card1.type === 'name' && card2.value === card1.pair)) {
                    matched.push(i1, i2);
                    document.querySelector(`[data-index="${i1}"]`).disabled = true;
                    document.querySelector(`[data-index="${i2}"]`).disabled = true;
                    
                    if (matched.length === cards.length) {
                        document.getElementById('memory-result').innerHTML = '<p style="color: green; font-weight: bold;">🎉 You won!</p>';
                    }
                } else {
                    document.querySelector(`[data-index="${i1}"]`).textContent = '?';
                    document.querySelector(`[data-index="${i2}"]`).textContent = '?';
                }
                flipped = [];
            }, 1000);
        }
    };
    
    lucide.createIcons();
}

function startMoleculeBuilder(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    ctx.fillStyle = 'var(--text-primary)';
    ctx.font = '20px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Click to add atoms and build molecules!', canvas.width / 2, canvas.height / 2);
}

// Initialize tool-specific functionality
function initializeTool(toolId) {
    lucide.createIcons();
    
    if (toolId === 'llm-chat') {
        // Load saved API key if exists
        const savedKey = localStorage.getItem('llm-api-key');
        if (savedKey) {
            document.getElementById('llm-api-key').value = savedKey;
        }
        
        // Save API key on change
        document.getElementById('llm-api-key').addEventListener('change', (e) => {
            localStorage.setItem('llm-api-key', e.target.value);
        });
        
        // Update model options based on provider
        document.getElementById('llm-provider').addEventListener('change', (e) => {
            const modelSelect = document.getElementById('llm-model');
            const models = {
                openai: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo', 'gpt-4o'],
                groq: ['llama3-70b-8192', 'mixtral-8x7b-32768', 'llama-3.1-70b-versatile'],
                anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
                openrouter: ['openai/gpt-4', 'anthropic/claude-3', 'meta-llama/llama-3-70b'],
                gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro']
            };
            
            modelSelect.innerHTML = models[e.target.value].map(m => 
                `<option value="${m}">${m}</option>`
            ).join('');
        });
        
        // Allow Enter key to send messages
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChatMessage();
        });
    }
    
    if (toolId === 'molecule-viz') {
        initMoleculeVisualizer();
    }
    
    if (toolId === 'unit-converter') {
        updateUnitOptions();
    }
    
    if (toolId === 'periodic-table') {
        initializePeriodicTable();
    }
}


function initMoleculeVisualizer() {
    const canvas = document.getElementById('molecule-canvas');
    if (!canvas) return;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    camera.position.z = 5;
    
    window.moleculeScene = { scene, camera, renderer };
    changeMolecule('water');
}

function changeMolecule(type) {
    if (!window.moleculeScene) return;
    
    const { scene, camera, renderer } = window.moleculeScene;
    
    // Clear previous molecule
    while(scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
    
    // Add lighting
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(10, 10, 10);
    scene.add(light);
    
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    // Create molecule based on type
    if (type === 'water') {
        // Oxygen (red)
        const oGeom = new THREE.SphereGeometry(0.3, 32, 32);
        const oMat = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const oxygen = new THREE.Mesh(oGeom, oMat);
        scene.add(oxygen);
        
        // Hydrogen atoms (white)
        const hGeom = new THREE.SphereGeometry(0.2, 32, 32);
        const hMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
        
        const h1 = new THREE.Mesh(hGeom, hMat);
        h1.position.set(-0.8, 0.6, 0);
        scene.add(h1);
        
        const h2 = new THREE.Mesh(hGeom, hMat);
        h2.position.set(0.8, 0.6, 0);
        scene.add(h2);
        
        // Bonds
        const bondMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
        const bond1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1), bondMat);
        bond1.position.set(-0.4, 0.3, 0);
        bond1.rotation.z = Math.PI / 4;
        scene.add(bond1);
        
        const bond2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1), bondMat);
        bond2.position.set(0.4, 0.3, 0);
        bond2.rotation.z = -Math.PI / 4;
        scene.add(bond2);
    }
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        scene.rotation.y += 0.01;
        renderer.render(scene, camera);
    }
    animate();
}

function rotateMolecule() {
    if (window.moleculeScene) {
        window.moleculeScene.scene.rotation.y += Math.PI / 4;
    }
}

// Unit Converter Tool
function createUnitConverterTool() {
    return `
        <div class="tool-modal-header">
            <h2><i data-lucide="ruler"></i> Unit Converter</h2>
            <button class="close-modal" onclick="closeModal(this.closest('.tool-modal'))">
                <i data-lucide="x"></i>
            </button>
        </div>
        <div class="form-group">
            <label for="unit-category">Category</label>
            <select id="unit-category" onchange="updateUnitOptions()">
                <option value="length">Length</option>
                <option value="mass">Mass</option>
                <option value="temperature">Temperature</option>
                <option value="energy">Energy</option>
                <option value="pressure">Pressure</option>
            </select>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
            <div>
                <div class="form-group">
                    <label for="from-unit">From</label>
                    <select id="from-unit"></select>
                </div>
                <div class="form-group">
                    <input type="number" id="from-value" placeholder="Enter value" oninput="convertUnits()">
                </div>
            </div>
            <div>
                <div class="form-group">
                    <label for="to-unit">To</label>
                    <select id="to-unit"></select>
                </div>
                <div class="form-group">
                    <input type="number" id="to-value" placeholder="Result" readonly style="background: var(--hover-bg);">
                </div>
            </div>
        </div>
    `;
}

const unitData = {
    length: {
        meter: 1,
        kilometer: 1000,
        centimeter: 0.01,
        millimeter: 0.001,
        mile: 1609.34,
        yard: 0.9144,
        foot: 0.3048,
        inch: 0.0254,
        angstrom: 1e-10
    },
    mass: {
        kilogram: 1,
        gram: 0.001,
        milligram: 1e-6,
        pound: 0.453592,
        ounce: 0.0283495,
        ton: 1000
    },
    temperature: {
        celsius: 1,
        fahrenheit: 1,
        kelvin: 1
    },
    energy: {
        joule: 1,
        kilojoule: 1000,
        calorie: 4.184,
        kilocalorie: 4184,
        electronvolt: 1.60218e-19,
        hartree: 4.3597e-18
    },
    pressure: {
        pascal: 1,
        bar: 100000,
        atmosphere: 101325,
        torr: 133.322,
        psi: 6894.76
    }
};

function updateUnitOptions() {
    const category = document.getElementById('unit-category').value;
    const fromSelect = document.getElementById('from-unit');
    const toSelect = document.getElementById('to-unit');
    
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    
    const units = Object.keys(unitData[category]);
    units.forEach(unit => {
        fromSelect.innerHTML += `<option value="${unit}">${unit}</option>`;
        toSelect.innerHTML += `<option value="${unit}">${unit}</option>`;
    });
    
    lucide.createIcons();
}

function convertUnits() {
    const category = document.getElementById('unit-category').value;
    const fromUnit = document.getElementById('from-unit').value;
    const toUnit = document.getElementById('to-unit').value;
    const fromValue = parseFloat(document.getElementById('from-value').value);
    
    if (isNaN(fromValue)) {
        document.getElementById('to-value').value = '';
        return;
    }
    
    let result;
    
    if (category === 'temperature') {
        // Special handling for temperature
        // Convert to Celsius first, then to target unit
        let celsius;
        if (fromUnit === 'celsius') {
            celsius = fromValue;
        } else if (fromUnit === 'fahrenheit') {
            celsius = (fromValue - 32) * 5/9;
        } else if (fromUnit === 'kelvin') {
            celsius = fromValue - 273.15;
        }
        
        // Convert from Celsius to target
        if (toUnit === 'celsius') {
            result = celsius;
        } else if (toUnit === 'fahrenheit') {
            result = (celsius * 9/5) + 32;
        } else if (toUnit === 'kelvin') {
            result = celsius + 273.15;
        }
    } else {
        // Standard conversion
        const fromFactor = unitData[category][fromUnit];
        const toFactor = unitData[category][toUnit];
        result = (fromValue * fromFactor) / toFactor;
    }
    
    // Format result appropriately
    if (Math.abs(result) < 0.001 || Math.abs(result) > 1000000) {
        document.getElementById('to-value').value = result.toExponential(6);
    } else {
        document.getElementById('to-value').value = result.toFixed(6);
    }
}

// Molecular Weight Calculator Tool
function createMolWeightTool() {
    return `
        <div class="tool-modal-header">
            <h2><i data-lucide="calculator"></i> Molecular Weight Calculator</h2>
            <button class="close-modal" onclick="closeModal(this.closest('.tool-modal'))">
                <i data-lucide="x"></i>
            </button>
        </div>
        <div class="form-group">
            <label for="chemical-formula">Chemical Formula</label>
            <input type="text" id="chemical-formula" placeholder="e.g., H2O, C6H12O6, NaCl" 
                   style="font-family: 'Source Code Pro', monospace; font-size: 1.2rem;">
            <small style="color: var(--text-secondary); margin-top: 0.5rem; display: block;">
                Use standard chemical notation. Numbers are subscripts.<br>
                Note: Parentheses (e.g., Ca(OH)2) are not yet supported. Use CaH2O2 instead.
            </small>
        </div>
        <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="calculateMolWeight()">
            <i data-lucide="calculator"></i> Calculate
        </button>
        <div id="mol-weight-result" style="margin-top: 2rem;"></div>
    `;
}

const atomicWeights = {
    H: 1.008, He: 4.003, Li: 6.941, Be: 9.012, B: 10.81, C: 12.01, N: 14.01, O: 16.00,
    F: 19.00, Ne: 20.18, Na: 22.99, Mg: 24.31, Al: 26.98, Si: 28.09, P: 30.97, S: 32.07,
    Cl: 35.45, Ar: 39.95, K: 39.10, Ca: 40.08, Sc: 44.96, Ti: 47.87, V: 50.94, Cr: 52.00,
    Mn: 54.94, Fe: 55.85, Co: 58.93, Ni: 58.69, Cu: 63.55, Zn: 65.38, Ga: 69.72, Ge: 72.63,
    As: 74.92, Se: 78.97, Br: 79.90, Kr: 83.80, Rb: 85.47, Sr: 87.62, Y: 88.91, Zr: 91.22,
    Nb: 92.91, Mo: 95.95, Tc: 98.00, Ru: 101.1, Rh: 102.9, Pd: 106.4, Ag: 107.9, Cd: 112.4,
    In: 114.8, Sn: 118.7, Sb: 121.8, Te: 127.6, I: 126.9, Xe: 131.3, Cs: 132.9, Ba: 137.3,
    La: 138.9, Ce: 140.1, Pr: 140.9, Nd: 144.2, Pm: 145.0, Sm: 150.4, Eu: 152.0, Gd: 157.3,
    Tb: 158.9, Dy: 162.5, Ho: 164.9, Er: 167.3, Tm: 168.9, Yb: 173.1, Lu: 175.0, Hf: 178.5,
    Ta: 180.9, W: 183.8, Re: 186.2, Os: 190.2, Ir: 192.2, Pt: 195.1, Au: 197.0, Hg: 200.6,
    Tl: 204.4, Pb: 207.2, Bi: 209.0, Po: 209.0, At: 210.0, Rn: 222.0, Fr: 223.0, Ra: 226.0
};

function calculateMolWeight() {
    const formula = document.getElementById('chemical-formula').value.trim();
    const resultDiv = document.getElementById('mol-weight-result');
    
    if (!formula) {
        resultDiv.innerHTML = '<p style="color: red;">Please enter a chemical formula</p>';
        return;
    }
    
    try {
        const { weight, breakdown } = parseMolecularFormula(formula);
        
        resultDiv.innerHTML = `
            <div class="paper-card">
                <h3 style="margin-bottom: 1rem; color: var(--accent-color);">Results for ${formula}</h3>
                <div style="font-size: 2rem; font-weight: bold; margin: 1rem 0;">
                    ${weight.toFixed(3)} g/mol
                </div>
                <h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem;">Elemental Breakdown:</h4>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 2px solid var(--border-color);">
                        <th style="padding: 0.5rem; text-align: left;">Element</th>
                        <th style="padding: 0.5rem; text-align: center;">Count</th>
                        <th style="padding: 0.5rem; text-align: right;">Contribution (g/mol)</th>
                    </tr>
                    ${breakdown.map(item => `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 0.5rem;">${item.element}</td>
                            <td style="padding: 0.5rem; text-align: center;">${item.count}</td>
                            <td style="padding: 0.5rem; text-align: right;">${item.contribution.toFixed(3)}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        `;
        
        lucide.createIcons();
    } catch (error) {
        resultDiv.innerHTML = `<div class="paper-card" style="color: red;">Error: ${error.message}</div>`;
    }
}

function parseMolecularFormula(formula) {
    const elements = {};
    const regex = /([A-Z][a-z]?)(\d*)/g;
    let match;
    let lastIndex = 0;
    
    // Parse formula
    while ((match = regex.exec(formula)) !== null) {
        // Check if we're consuming the entire string
        if (match.index !== lastIndex && match[1]) {
            throw new Error(`Invalid character at position ${lastIndex}: '${formula[lastIndex]}'`);
        }
        
        if (match[1]) { // Only process if element symbol exists
            const element = match[1];
            const count = match[2] ? parseInt(match[2]) : 1;
            
            if (!atomicWeights[element]) {
                throw new Error(`Unknown element: ${element}`);
            }
            
            elements[element] = (elements[element] || 0) + count;
            lastIndex = match.index + match[0].length;
        }
    }
    
    // Verify we consumed the entire formula
    if (lastIndex !== formula.length) {
        throw new Error(`Invalid formula: could not parse '${formula.substring(lastIndex)}'`);
    }
    
    if (Object.keys(elements).length === 0) {
        throw new Error('No valid elements found in formula');
    }
    
    let totalWeight = 0;
    const breakdown = [];
    
    for (const [element, count] of Object.entries(elements)) {
        const contribution = atomicWeights[element] * count;
        totalWeight += contribution;
        breakdown.push({ element, count, contribution });
    }
    
    return { weight: totalWeight, breakdown };
}

// Load external libraries
function loadExternalLibraries() {
    // Load PDF.js
    const pdfScript = document.createElement('script');
    pdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    document.head.appendChild(pdfScript);
    
    // Load jsPDF
    const jspdfScript = document.createElement('script');
    jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    document.head.appendChild(jspdfScript);
}

// Periodic Table Tool
function createPeriodicTableTool() {
    return `
        <div class="tool-modal-header">
            <h2><i data-lucide="table-2"></i> Interactive Periodic Table</h2>
            <button class="close-modal" onclick="closeModal(this.closest('.tool-modal'))">
                <i data-lucide="x"></i>
            </button>
        </div>
        <div class="periodic-table-container" id="periodic-table-container">
            <p style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                Click on any element to view detailed information including atomic mass, electron configuration, 
                oxidation states, and more. This interactive periodic table helps you explore the properties of all 118 elements.
            </p>
            <div id="element-grid" style="display: grid; grid-template-columns: repeat(18, 1fr); gap: 4px; font-size: 0.8rem;">
                <!-- Elements will be generated here -->
            </div>
            <div id="element-details" style="margin-top: 2rem; padding: 1.5rem; background: var(--card-bg); border-radius: 12px; display: none;">
                <!-- Element details will appear here -->
            </div>
        </div>
    `;
}

function initializePeriodicTable() {
    const elements = [
        { symbol: 'H', name: 'Hydrogen', number: 1, mass: 1.008, category: 'nonmetal' },
        { symbol: 'He', name: 'Helium', number: 2, mass: 4.003, category: 'noble-gas' },
        // Add more elements as needed - this is a simplified version
        { symbol: 'Li', name: 'Lithium', number: 3, mass: 6.941, category: 'alkali-metal' },
        { symbol: 'Be', name: 'Beryllium', number: 4, mass: 9.012, category: 'alkaline-earth' },
        { symbol: 'C', name: 'Carbon', number: 6, mass: 12.011, category: 'nonmetal' },
        { symbol: 'N', name: 'Nitrogen', number: 7, mass: 14.007, category: 'nonmetal' },
        { symbol: 'O', name: 'Oxygen', number: 8, mass: 15.999, category: 'nonmetal' },
        { symbol: 'F', name: 'Fluorine', number: 9, mass: 18.998, category: 'halogen' },
        { symbol: 'Ne', name: 'Neon', number: 10, mass: 20.180, category: 'noble-gas' },
    ];

    const grid = document.getElementById('element-grid');
    elements.forEach(element => {
        const elementDiv = document.createElement('div');
        elementDiv.style.cssText = `
            padding: 0.5rem;
            background: var(--accent-color-alpha);
            border: 2px solid var(--border-color);
            border-radius: 4px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        elementDiv.innerHTML = `
            <div style="font-size: 0.7rem;">${element.number}</div>
            <div style="font-size: 1.2rem; font-weight: bold;">${element.symbol}</div>
            <div style="font-size: 0.65rem;">${element.mass.toFixed(3)}</div>
        `;
        elementDiv.onclick = () => showElementDetails(element);
        elementDiv.onmouseover = () => {
            elementDiv.style.transform = 'scale(1.1)';
            elementDiv.style.background = 'var(--accent-color)';
            elementDiv.style.color = 'white';
        };
        elementDiv.onmouseout = () => {
            elementDiv.style.transform = 'scale(1)';
            elementDiv.style.background = 'var(--accent-color-alpha)';
            elementDiv.style.color = 'var(--text-primary)';
        };
        grid.appendChild(elementDiv);
    });
}

function showElementDetails(element) {
    const details = document.getElementById('element-details');
    details.style.display = 'block';
    details.innerHTML = `
        <h3 style="color: var(--accent-color); font-size: 2rem; margin-bottom: 1rem;">
            ${element.name} (${element.symbol})
        </h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
            <div><strong>Atomic Number:</strong> ${element.number}</div>
            <div><strong>Atomic Mass:</strong> ${element.mass} u</div>
            <div><strong>Category:</strong> ${element.category.replace('-', ' ')}</div>
            <div><strong>Group:</strong> Varies</div>
        </div>
    `;
}

// Equation Balancer Tool
function createEquationBalancerTool() {
    return `
        <div class="tool-modal-header">
            <h2><i data-lucide="scale"></i> Chemical Equation Balancer</h2>
            <button class="close-modal" onclick="closeModal(this.closest('.tool-modal'))">
                <i data-lucide="x"></i>
            </button>
        </div>
        <div class="equation-balancer-container">
            <div class="form-group">
                <label for="reactants-input">Reactants (separated by +)</label>
                <input type="text" id="reactants-input" placeholder="e.g., H2 + O2" class="form-group" style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 2px solid var(--border-color); background: var(--input-bg); color: var(--text-primary);">
            </div>
            <div class="form-group">
                <label for="products-input">Products (separated by +)</label>
                <input type="text" id="products-input" placeholder="e.g., H2O" class="form-group" style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 2px solid var(--border-color); background: var(--input-bg); color: var(--text-primary);">
            </div>
            <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="balanceEquation()">
                <i data-lucide="check"></i> Balance Equation
            </button>
            <div id="balanced-equation-result" style="margin-top: 2rem; padding: 1.5rem; background: var(--card-bg); border-radius: 12px; display: none;">
                <!-- Result will appear here -->
            </div>
        </div>
    `;
}

function balanceEquation() {
    const reactants = document.getElementById('reactants-input').value.trim();
    const products = document.getElementById('products-input').value.trim();
    const result = document.getElementById('balanced-equation-result');

    if (!reactants || !products) {
        result.style.display = 'block';
        result.innerHTML = '<p style="color: red;">Please enter both reactants and products.</p>';
        return;
    }

    // Note: This is a simplified demonstration. A complete implementation would:
    // 1. Parse the chemical formulas
    // 2. Set up a system of linear equations for atom conservation
    // 3. Solve using matrix methods (Gaussian elimination)
    // For educational purposes, showing the concept with placeholder
    result.style.display = 'block';
    result.innerHTML = `
        <div style="padding: 1rem; background: rgba(255, 193, 7, 0.1); border-left: 4px solid #ffc107; border-radius: 8px; margin-bottom: 1rem;">
            <strong>⚠️ Educational Tool:</strong> This is a demonstration interface. 
            For accurate chemical equation balancing, please use dedicated tools or manual calculation.
        </div>
        <h3 style="color: var(--accent-color); margin-bottom: 1rem;">Input Equation:</h3>
        <div style="font-size: 1.5rem; text-align: center; padding: 1rem; background: var(--accent-color-alpha); border-radius: 8px; margin-bottom: 1rem;">
            ${reactants} → ${products}
        </div>
        <p style="color: var(--text-secondary);">
            <strong>How to balance equations:</strong><br>
            1. Count atoms of each element on both sides<br>
            2. Adjust coefficients to equalize atom counts<br>
            3. Ensure smallest whole number ratios<br>
            4. Verify conservation of mass and charge
        </p>
    `;
    lucide.createIcons();
}

// pH Calculator Tool
function createPHCalculatorTool() {
    return `
        <div class="tool-modal-header">
            <h2><i data-lucide="droplet"></i> pH Calculator</h2>
            <button class="close-modal" onclick="closeModal(this.closest('.tool-modal'))">
                <i data-lucide="x"></i>
            </button>
        </div>
        <div class="ph-calculator-container">
            <div class="form-group">
                <label for="solution-type">Solution Type</label>
                <select id="solution-type" onchange="updatePHFields()" style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 2px solid var(--border-color); background: var(--input-bg); color: var(--text-primary);">
                    <option value="acid">Strong Acid</option>
                    <option value="base">Strong Base</option>
                    <option value="buffer">Buffer Solution</option>
                </select>
            </div>
            <div class="form-group">
                <label for="concentration-input">Concentration (M)</label>
                <input type="number" id="concentration-input" step="0.001" placeholder="e.g., 0.1" style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 2px solid var(--border-color); background: var(--input-bg); color: var(--text-primary);">
            </div>
            <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="calculatePH()">
                <i data-lucide="calculator"></i> Calculate pH
            </button>
            <div id="ph-result" style="margin-top: 2rem; padding: 1.5rem; background: var(--card-bg); border-radius: 12px; display: none;">
                <!-- Result will appear here -->
            </div>
        </div>
    `;
}

function calculatePH() {
    const solutionType = document.getElementById('solution-type').value;
    const concentration = parseFloat(document.getElementById('concentration-input').value);
    const result = document.getElementById('ph-result');

    if (isNaN(concentration) || concentration <= 0) {
        result.style.display = 'block';
        result.innerHTML = '<p style="color: red;">Please enter a valid concentration.</p>';
        return;
    }

    let pH;
    let note = '';
    if (solutionType === 'acid') {
        pH = -Math.log10(concentration);
    } else if (solutionType === 'base') {
        const pOH = -Math.log10(concentration);
        pH = 14 - pOH;
    } else {
        // Buffer calculation is simplified - would need pKa and Henderson-Hasselbalch
        pH = 7;
        note = '<div style="padding: 1rem; background: rgba(255, 193, 7, 0.1); border-left: 4px solid #ffc107; border-radius: 8px; margin-bottom: 1rem;"><strong>Note:</strong> Buffer pH calculation requires pKa values and concentration ratios (Henderson-Hasselbalch equation). This shows a neutral pH as a placeholder.</div>';
    }

    const pOH = 14 - pH;
    
    result.style.display = 'block';
    result.innerHTML = `
        ${note}
        <div style="text-align: center;">
            <div style="font-size: 3rem; font-weight: bold; color: var(--accent-color); margin-bottom: 1rem;">
                pH = ${pH.toFixed(2)}
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1rem;">
                <div>
                    <strong>pOH:</strong> ${pOH.toFixed(2)}
                </div>
                <div>
                    <strong>[H+]:</strong> ${(Math.pow(10, -pH)).toExponential(2)} M
                </div>
                <div>
                    <strong>[OH-]:</strong> ${(Math.pow(10, -pOH)).toExponential(2)} M
                </div>
                <div>
                    <strong>Solution:</strong> ${pH < 7 ? 'Acidic' : pH > 7 ? 'Basic' : 'Neutral'}
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function updatePHFields() {
    // Can be extended to show different fields based on solution type
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadExternalLibraries);
} else {
    loadExternalLibraries();
}
