import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css                        *//* empty css               *//* empty css                  */import"./navbar-CxcuK0N-.js";import"./enhanced-rJVzSnir.js";import"./molecule-background-DIGW-Qyj.js";function T(e){const o={"llm-chat":"tools/llm-chat.html","paper-finder":"tools/paper-finder.html","pdf-to-jpg":"tools/pdf-to-jpg.html","pdf-reducer":"tools/pdf-reducer.html","molecule-viz":"tools/molecule-viz.html",games:"tools/games.html","unit-converter":"tools/unit-converter.html","mol-weight":"tools/mol-weight.html","periodic-table":"tools/periodic-table.html","equation-balancer":"tools/equation-balancer.html","ph-calculator":"tools/ph-calculator.html","mermaid-editor":"mermaid-tool.html","audio-studio":"tools/audio-studio.html"}[e];o&&(window.location.href=o)}function C(e){const t=document.createElement("div");t.className="tool-modal",t.id=`modal-${e}`;let o="";switch(e){case"llm-chat":o=P();break;case"paper-finder":o=B();break;case"pdf-to-jpg":o=z();break;case"pdf-reducer":o=D();break;case"molecule-viz":o=R();break;case"games":o=N();break;case"unit-converter":o=_();break;case"mol-weight":o=ee();break;case"periodic-table":o=ae();break;case"equation-balancer":o=le();break;case"ph-calculator":o=ue();break}t.innerHTML=`
        <div class="tool-modal-content">
            ${o}
        </div>
    `,document.body.appendChild(t),setTimeout(()=>t.classList.add("active"),10),t.addEventListener("click",a=>{a.target===t&&w(t)}),Y(e)}function w(e){e.classList.remove("active"),setTimeout(()=>e.remove(),300)}function P(){return`
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
    `}function H(){const e=document.getElementById("llm-provider").value,t=document.getElementById("llm-model"),o={openai:[{value:"gpt-4",label:"GPT-4"},{value:"gpt-4-turbo",label:"GPT-4 Turbo"},{value:"gpt-3.5-turbo",label:"GPT-3.5 Turbo"}],groq:[{value:"llama3-70b-8192",label:"Llama 3 70B"},{value:"llama3-8b-8192",label:"Llama 3 8B"},{value:"mixtral-8x7b-32768",label:"Mixtral 8x7B"},{value:"gemma-7b-it",label:"Gemma 7B"}],anthropic:[{value:"claude-3-opus-20240229",label:"Claude 3 Opus"},{value:"claude-3-sonnet-20240229",label:"Claude 3 Sonnet"},{value:"claude-3-haiku-20240307",label:"Claude 3 Haiku"}],gemini:[{value:"gemini-1.5-pro",label:"Gemini 1.5 Pro"},{value:"gemini-1.5-flash",label:"Gemini 1.5 Flash"},{value:"gemini-pro",label:"Gemini Pro"}],openrouter:[{value:"openai/gpt-4-turbo",label:"GPT-4 Turbo"},{value:"anthropic/claude-3-opus",label:"Claude 3 Opus"},{value:"google/gemini-pro",label:"Gemini Pro"},{value:"meta-llama/llama-3-70b",label:"Llama 3 70B"}]};t.innerHTML="",(o[e]||[]).forEach(i=>{const n=document.createElement("option");n.value=i.value,n.textContent=i.label,t.appendChild(n)})}async function x(){const e=document.getElementById("chat-input"),t=e.value.trim();if(!t)return;const o=document.getElementById("chat-container"),a=document.getElementById("llm-api-key").value,i=document.getElementById("llm-provider").value,n=document.getElementById("llm-model").value;if(!a){alert("Please enter your API key first");return}const l=document.createElement("div");l.className="chat-message user",l.textContent=t,o.appendChild(l),e.value="",o.scrollTop=o.scrollHeight;const r=document.createElement("div");r.className="chat-message assistant",r.innerHTML='<span class="loading-spinner"></span> Thinking...',o.appendChild(r),o.scrollTop=o.scrollHeight;try{const s=await I(i,a,n,t);r.innerHTML=s}catch(s){r.innerHTML=`Error: ${s.message}`,r.style.color="red"}o.scrollTop=o.scrollHeight,lucide.createIcons()}async function I(e,t,o,a){const i={openai:"https://api.openai.com/v1/chat/completions",groq:"https://api.groq.com/openai/v1/chat/completions",anthropic:"https://api.anthropic.com/v1/messages",openrouter:"https://openrouter.ai/api/v1/chat/completions",gemini:`https://generativelanguage.googleapis.com/v1beta/models/${o}:generateContent?key=${t}`},n={"Content-Type":"application/json"};let l;e==="anthropic"?(n["x-api-key"]=t,n["anthropic-version"]="2023-06-01",l={model:o||"claude-3-sonnet-20240229",messages:[{role:"user",content:a}],max_tokens:1024}):e==="gemini"?l={contents:[{parts:[{text:a}]}]}:(n.Authorization=`Bearer ${t}`,l={model:o,messages:[{role:"user",content:a}]});const r=await fetch(i[e],{method:"POST",headers:n,body:JSON.stringify(l)});if(!r.ok){const c=await r.text();throw new Error(`API Error: ${r.statusText} - ${c}`)}const s=await r.json();return e==="anthropic"?s.content[0].text:e==="gemini"?s.candidates[0].content.parts[0].text:s.choices[0].message.content}function B(){return`
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
    `}async function L(){const e=document.getElementById("paper-query").value.trim(),t=document.getElementById("paper-source").value,o=document.getElementById("paper-year").value,a=document.getElementById("paper-results");if(!e){alert("Please enter a search query");return}a.innerHTML='<div class="text-center"><span class="loading-spinner"></span> Searching...</div>';try{let i=[];if(t==="semantic"||t==="both"){const n=await S(e,o);i=i.concat(n)}if(t==="arxiv"||t==="both"){const n=await $(e,o);i=i.concat(n)}j(i)}catch(i){a.innerHTML=`<div style="color: red;">Error: ${i.message}</div>`}}async function S(e,t){const o=`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(e)}&limit=10&fields=title,authors,abstract,year,url,citationCount`,a=await fetch(o);if(!a.ok)throw new Error("Semantic Scholar API error");return(await a.json()).data.map(n=>{var l;return{title:n.title,authors:((l=n.authors)==null?void 0:l.map(r=>r.name).join(", "))||"Unknown",abstract:n.abstract||"No abstract available",year:n.year,url:n.url,citations:n.citationCount,source:"Semantic Scholar"}}).filter(n=>!t||n.year===parseInt(t))}async function $(e,t){const o=`https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(e)}&start=0&max_results=10`,a=await fetch(o);if(!a.ok)throw new Error("arXiv API error");const i=await a.text(),r=new DOMParser().parseFromString(i,"text/xml").querySelectorAll("entry");return Array.from(r).map(s=>{var u,d,g,p;const c=((u=s.querySelector("published"))==null?void 0:u.textContent)||"",m=new Date(c).getFullYear();return{title:((d=s.querySelector("title"))==null?void 0:d.textContent.trim())||"No title",authors:Array.from(s.querySelectorAll("author name")).map(h=>h.textContent).join(", "),abstract:((g=s.querySelector("summary"))==null?void 0:g.textContent.trim())||"No abstract",year:m,url:((p=s.querySelector("id"))==null?void 0:p.textContent)||"",source:"arXiv"}}).filter(s=>!t||s.year===parseInt(t))}function j(e){const t=document.getElementById("paper-results");if(e.length===0){t.innerHTML='<div class="text-center" style="color: var(--text-secondary);">No papers found</div>';return}t.innerHTML=e.map(o=>`
        <div class="paper-card">
            <div class="paper-title">${o.title}</div>
            <div class="paper-authors">${o.authors} • ${o.year||"N/A"} • ${o.source}</div>
            <div class="paper-abstract">${o.abstract.substring(0,300)}${o.abstract.length>300?"...":""}</div>
            <div class="paper-links">
                <a href="${o.url}" target="_blank" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="external-link"></i> View Paper
                </a>
                ${o.citations?`<span style="color: var(--text-secondary);">Citations: ${o.citations}</span>`:""}
            </div>
        </div>
    `).join(""),lucide.createIcons()}function z(){return`
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
    `}async function F(e){if(!e)return;const t=document.getElementById("jpg-preview");t.innerHTML='<div class="text-center"><span class="loading-spinner"></span> Converting PDF...</div>';try{const o=window.pdfjsLib,a=await e.arrayBuffer(),i=await o.getDocument(a).promise;t.innerHTML="",window.pdfImages=[];for(let l=1;l<=i.numPages;l++){const r=await i.getPage(l),s=r.getViewport({scale:2}),c=document.createElement("canvas"),m=c.getContext("2d");c.height=s.height,c.width=s.width,await r.render({canvasContext:m,viewport:s}).promise;const u=c.toDataURL("image/jpeg",.95);window.pdfImages.push({dataUrl:u,filename:`page-${l}.jpg`});const d=document.createElement("div");d.className="pdf-page-preview",d.innerHTML=`
                <img src="${u}" alt="Page ${l}">
                <button class="btn btn-secondary" style="width: 100%; margin-top: 0.5rem;" onclick="downloadImage(this, 'page-${l}.jpg')">
                    <i data-lucide="download"></i> Download Page ${l}
                </button>
            `,t.appendChild(d)}const n=document.createElement("div");n.style.cssText="grid-column: 1 / -1; margin-top: 1rem;",n.innerHTML=`
            <button class="btn btn-primary" style="width: 100%;" onclick="downloadAllAsZip()">
                <i data-lucide="download"></i> Download All as ZIP
            </button>
        `,t.appendChild(n),lucide.createIcons()}catch(o){t.innerHTML=`<div style="color: red;">Error: ${o.message}</div>`}}function q(e,t){const o=e.parentElement.querySelector("img"),a=document.createElement("a");a.href=o.src,a.download=t,a.click()}async function A(){if(!window.pdfImages||window.pdfImages.length===0){alert("No images to download");return}try{if(!window.JSZip){const a=document.createElement("script");a.src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",await new Promise((i,n)=>{a.onload=i,a.onerror=n,document.head.appendChild(a)})}const e=new JSZip;for(const{dataUrl:a,filename:i}of window.pdfImages){const n=a.split(",")[1],l=await fetch(a).then(r=>r.blob());e.file(i,l)}const t=await e.generateAsync({type:"blob"}),o=document.createElement("a");o.href=URL.createObjectURL(t),o.download="pdf-images.zip",o.click()}catch(e){alert("Error creating ZIP file: "+e.message)}}function D(){return`
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
    `}async function G(e){if(!e)return;const t=document.getElementById("reduce-result"),o=parseFloat(document.getElementById("compression-level").value);t.innerHTML='<div class="text-center"><span class="loading-spinner"></span> Compressing PDF...</div>';try{const a=window.pdfjsLib,i=await e.arrayBuffer(),n=await a.getDocument(i).promise,{jsPDF:l}=window.jspdf,r=new l;for(let d=1;d<=n.numPages;d++){d>1&&r.addPage();const g=await n.getPage(d),p=g.getViewport({scale:1.5}),h=document.createElement("canvas"),v=h.getContext("2d");h.height=p.height,h.width=p.width,await g.render({canvasContext:v,viewport:p}).promise;const M=h.toDataURL("image/jpeg",o);r.addImage(M,"JPEG",0,0,210,297)}const s=r.output("blob"),c=(e.size/1024/1024).toFixed(2),m=(s.size/1024/1024).toFixed(2),u=((1-s.size/e.size)*100).toFixed(1);t.innerHTML=`
            <div class="paper-card">
                <h3>Compression Complete!</h3>
                <p>Original Size: ${c} MB</p>
                <p>Compressed Size: ${m} MB</p>
                <p>Savings: ${u}%</p>
                <button class="btn btn-primary" onclick="downloadCompressedPDF()" style="margin-top: 1rem;">
                    <i data-lucide="download"></i> Download Compressed PDF
                </button>
            </div>
        `,window.compressedPDF=s,lucide.createIcons()}catch(a){t.innerHTML=`<div style="color: red;">Error: ${a.message}</div>`}}function O(){if(window.compressedPDF){const e=document.createElement("a");e.href=URL.createObjectURL(window.compressedPDF),e.download="compressed.pdf",e.click()}}function R(){return`
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
    `}function N(){return`
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
    `}function U(e){const t=document.getElementById("game-content"),o=document.getElementById("game-canvas");switch(e){case"periodic-table":W(t);break;case"molecule-builder":o.style.display="block",V(o);break;case"balance-equations":Z(t);break;case"memory-elements":J(t);break}}function W(e){const t=[{symbol:"H",name:"Hydrogen",number:1},{symbol:"He",name:"Helium",number:2},{symbol:"C",name:"Carbon",number:6},{symbol:"N",name:"Nitrogen",number:7},{symbol:"O",name:"Oxygen",number:8},{symbol:"Fe",name:"Iron",number:26},{symbol:"Au",name:"Gold",number:79},{symbol:"Ag",name:"Silver",number:47}];let o=0,a=0;function i(){if(a>=t.length){e.innerHTML=`
                <div class="paper-card text-center">
                    <h2>Quiz Complete!</h2>
                    <p style="font-size: 2rem; margin: 2rem 0;">Score: ${o}/${t.length}</p>
                    <button class="btn btn-primary" onclick="startGame('periodic-table')">Play Again</button>
                </div>
            `,lucide.createIcons();return}const n=t[a],l=[...t].sort(()=>Math.random()-.5).slice(0,4);l.includes(n)||(l[0]=n),l.sort(()=>Math.random()-.5),e.innerHTML=`
            <div class="paper-card">
                <h3>Question ${a+1}/${t.length}</h3>
                <p style="font-size: 1.5rem; margin: 2rem 0;">What is the name of element <strong>${n.symbol}</strong>?</p>
                <div style="display: grid; gap: 1rem;">
                    ${l.map(r=>`
                        <button class="btn btn-secondary" onclick="checkAnswer('${r.name}', '${n.name}')" style="font-size: 1.1rem;">
                            ${r.name}
                        </button>
                    `).join("")}
                </div>
                <p style="margin-top: 1rem; color: var(--text-secondary);">Score: ${o}</p>
            </div>
        `,lucide.createIcons()}window.checkAnswer=function(n,l){n===l&&o++,a++,i()},i()}function Z(e){e.innerHTML=`
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
    `,window.checkBalance=function(){const t=parseInt(document.getElementById("coef1").value),o=parseInt(document.getElementById("coef2").value),a=parseInt(document.getElementById("coef3").value),i=document.getElementById("balance-result");t===2&&o===1&&a===2?i.innerHTML='<p style="color: green; font-weight: bold;">✓ Correct! 2H₂ + O₂ → 2H₂O</p>':i.innerHTML='<p style="color: red; font-weight: bold;">✗ Try again!</p>'},lucide.createIcons()}function J(e){const t=[{symbol:"H",name:"Hydrogen"},{symbol:"He",name:"Helium"},{symbol:"C",name:"Carbon"},{symbol:"O",name:"Oxygen"}],o=[...t.map(n=>({type:"symbol",value:n.symbol,pair:n.name})),...t.map(n=>({type:"name",value:n.name,pair:n.symbol}))];o.sort(()=>Math.random()-.5);let a=[],i=[];e.innerHTML=`
        <div class="paper-card">
            <h3>Element Memory Game</h3>
            <p>Match element symbols with their names</p>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 2rem;">
                ${o.map((n,l)=>`
                    <button class="btn btn-secondary memory-card" data-index="${l}" onclick="flipCard(${l})" style="height: 100px; font-size: 1.2rem;">
                        ?
                    </button>
                `).join("")}
            </div>
            <div id="memory-result" style="margin-top: 1rem;"></div>
        </div>
    `,window.memoryCards=o,window.memoryFlipped=a,window.memoryMatched=i,window.flipCard=function(n){if(a.length>=2||a.includes(n)||i.includes(n))return;const l=document.querySelector(`[data-index="${n}"]`);if(l.textContent=o[n].value,a.push(n),a.length===2){const[r,s]=a,c=o[r],m=o[s];setTimeout(()=>{c.type==="symbol"&&m.value===c.pair||c.type==="name"&&m.value===c.pair?(i.push(r,s),document.querySelector(`[data-index="${r}"]`).disabled=!0,document.querySelector(`[data-index="${s}"]`).disabled=!0,i.length===o.length&&(document.getElementById("memory-result").innerHTML='<p style="color: green; font-weight: bold;">🎉 You won!</p>')):(document.querySelector(`[data-index="${r}"]`).textContent="?",document.querySelector(`[data-index="${s}"]`).textContent="?"),a=[]},1e3)}},lucide.createIcons()}function V(e){const t=e.getContext("2d");e.width=e.offsetWidth,e.height=e.offsetHeight,t.fillStyle="var(--text-primary)",t.font="20px Inter",t.textAlign="center",t.fillText("Click to add atoms and build molecules!",e.width/2,e.height/2)}function Y(e){if(lucide.createIcons(),e==="llm-chat"){const t=localStorage.getItem("llm-api-key");t&&(document.getElementById("llm-api-key").value=t),document.getElementById("llm-api-key").addEventListener("change",o=>{localStorage.setItem("llm-api-key",o.target.value)}),document.getElementById("llm-provider").addEventListener("change",o=>{const a=document.getElementById("llm-model"),i={openai:["gpt-4","gpt-3.5-turbo","gpt-4-turbo","gpt-4o"],groq:["llama3-70b-8192","mixtral-8x7b-32768","llama-3.1-70b-versatile"],anthropic:["claude-3-opus-20240229","claude-3-sonnet-20240229","claude-3-haiku-20240307"],openrouter:["openai/gpt-4","anthropic/claude-3","meta-llama/llama-3-70b"],gemini:["gemini-1.5-pro","gemini-1.5-flash","gemini-1.0-pro"]};a.innerHTML=i[o.target.value].map(n=>`<option value="${n}">${n}</option>`).join("")}),document.getElementById("chat-input").addEventListener("keypress",o=>{o.key==="Enter"&&x()})}e==="molecule-viz"&&Q(),e==="unit-converter"&&k(),e==="periodic-table"&&ne()}function Q(){const e=document.getElementById("molecule-canvas");if(!e)return;const t=new THREE.Scene,o=new THREE.PerspectiveCamera(75,e.offsetWidth/e.offsetHeight,.1,1e3),a=new THREE.WebGLRenderer({canvas:e,antialias:!0});a.setSize(e.offsetWidth,e.offsetHeight),o.position.z=5,window.moleculeScene={scene:t,camera:o,renderer:a},E("water")}function E(e){if(!window.moleculeScene)return;const{scene:t,camera:o,renderer:a}=window.moleculeScene;for(;t.children.length>0;)t.remove(t.children[0]);const i=new THREE.PointLight(16777215,1,100);i.position.set(10,10,10),t.add(i);const n=new THREE.AmbientLight(4210752);if(t.add(n),e==="water"){const r=new THREE.SphereGeometry(.3,32,32),s=new THREE.MeshPhongMaterial({color:16711680}),c=new THREE.Mesh(r,s);t.add(c);const m=new THREE.SphereGeometry(.2,32,32),u=new THREE.MeshPhongMaterial({color:16777215}),d=new THREE.Mesh(m,u);d.position.set(-.8,.6,0),t.add(d);const g=new THREE.Mesh(m,u);g.position.set(.8,.6,0),t.add(g);const p=new THREE.MeshBasicMaterial({color:8947848}),h=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1),p);h.position.set(-.4,.3,0),h.rotation.z=Math.PI/4,t.add(h);const v=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1),p);v.position.set(.4,.3,0),v.rotation.z=-Math.PI/4,t.add(v)}function l(){requestAnimationFrame(l),t.rotation.y+=.01,a.render(t,o)}l()}function X(){window.moleculeScene&&(window.moleculeScene.scene.rotation.y+=Math.PI/4)}function _(){return`
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
    `}const b={length:{meter:1,kilometer:1e3,centimeter:.01,millimeter:.001,mile:1609.34,yard:.9144,foot:.3048,inch:.0254,angstrom:1e-10},mass:{kilogram:1,gram:.001,milligram:1e-6,pound:.453592,ounce:.0283495,ton:1e3},temperature:{celsius:1,fahrenheit:1,kelvin:1},energy:{joule:1,kilojoule:1e3,calorie:4.184,kilocalorie:4184,electronvolt:160218e-24,hartree:43597e-22},pressure:{pascal:1,bar:1e5,atmosphere:101325,torr:133.322,psi:6894.76}};function k(){const e=document.getElementById("unit-category").value,t=document.getElementById("from-unit"),o=document.getElementById("to-unit");t.innerHTML="",o.innerHTML="",Object.keys(b[e]).forEach(i=>{t.innerHTML+=`<option value="${i}">${i}</option>`,o.innerHTML+=`<option value="${i}">${i}</option>`}),lucide.createIcons()}function K(){const e=document.getElementById("unit-category").value,t=document.getElementById("from-unit").value,o=document.getElementById("to-unit").value,a=parseFloat(document.getElementById("from-value").value);if(isNaN(a)){document.getElementById("to-value").value="";return}let i;if(e==="temperature"){let n;t==="celsius"?n=a:t==="fahrenheit"?n=(a-32)*5/9:t==="kelvin"&&(n=a-273.15),o==="celsius"?i=n:o==="fahrenheit"?i=n*9/5+32:o==="kelvin"&&(i=n+273.15)}else{const n=b[e][t],l=b[e][o];i=a*n/l}Math.abs(i)<.001||Math.abs(i)>1e6?document.getElementById("to-value").value=i.toExponential(6):document.getElementById("to-value").value=i.toFixed(6)}function ee(){return`
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
    `}const f={H:1.008,He:4.003,Li:6.941,Be:9.012,B:10.81,C:12.01,N:14.01,O:16,F:19,Ne:20.18,Na:22.99,Mg:24.31,Al:26.98,Si:28.09,P:30.97,S:32.07,Cl:35.45,Ar:39.95,K:39.1,Ca:40.08,Sc:44.96,Ti:47.87,V:50.94,Cr:52,Mn:54.94,Fe:55.85,Co:58.93,Ni:58.69,Cu:63.55,Zn:65.38,Ga:69.72,Ge:72.63,As:74.92,Se:78.97,Br:79.9,Kr:83.8,Rb:85.47,Sr:87.62,Y:88.91,Zr:91.22,Nb:92.91,Mo:95.95,Tc:98,Ru:101.1,Rh:102.9,Pd:106.4,Ag:107.9,Cd:112.4,In:114.8,Sn:118.7,Sb:121.8,Te:127.6,I:126.9,Xe:131.3,Cs:132.9,Ba:137.3,La:138.9,Ce:140.1,Pr:140.9,Nd:144.2,Pm:145,Sm:150.4,Eu:152,Gd:157.3,Tb:158.9,Dy:162.5,Ho:164.9,Er:167.3,Tm:168.9,Yb:173.1,Lu:175,Hf:178.5,Ta:180.9,W:183.8,Re:186.2,Os:190.2,Ir:192.2,Pt:195.1,Au:197,Hg:200.6,Tl:204.4,Pb:207.2,Bi:209,Po:209,At:210,Rn:222,Fr:223,Ra:226};function te(){const e=document.getElementById("chemical-formula").value.trim(),t=document.getElementById("mol-weight-result");if(!e){t.innerHTML='<p style="color: red;">Please enter a chemical formula</p>';return}try{const{weight:o,breakdown:a}=oe(e);t.innerHTML=`
            <div class="paper-card">
                <h3 style="margin-bottom: 1rem; color: var(--accent-color);">Results for ${e}</h3>
                <div style="font-size: 2rem; font-weight: bold; margin: 1rem 0;">
                    ${o.toFixed(3)} g/mol
                </div>
                <h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem;">Elemental Breakdown:</h4>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 2px solid var(--border-color);">
                        <th style="padding: 0.5rem; text-align: left;">Element</th>
                        <th style="padding: 0.5rem; text-align: center;">Count</th>
                        <th style="padding: 0.5rem; text-align: right;">Contribution (g/mol)</th>
                    </tr>
                    ${a.map(i=>`
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 0.5rem;">${i.element}</td>
                            <td style="padding: 0.5rem; text-align: center;">${i.count}</td>
                            <td style="padding: 0.5rem; text-align: right;">${i.contribution.toFixed(3)}</td>
                        </tr>
                    `).join("")}
                </table>
            </div>
        `,lucide.createIcons()}catch(o){t.innerHTML=`<div class="paper-card" style="color: red;">Error: ${o.message}</div>`}}function oe(e){const t={},o=/([A-Z][a-z]?)(\d*)/g;let a,i=0;for(;(a=o.exec(e))!==null;){if(a.index!==i&&a[1])throw new Error(`Invalid character at position ${i}: '${e[i]}'`);if(a[1]){const r=a[1],s=a[2]?parseInt(a[2]):1;if(!f[r])throw new Error(`Unknown element: ${r}`);t[r]=(t[r]||0)+s,i=a.index+a[0].length}}if(i!==e.length)throw new Error(`Invalid formula: could not parse '${e.substring(i)}'`);if(Object.keys(t).length===0)throw new Error("No valid elements found in formula");let n=0;const l=[];for(const[r,s]of Object.entries(t)){const c=f[r]*s;n+=c,l.push({element:r,count:s,contribution:c})}return{weight:n,breakdown:l}}function y(){if(!window.pdfjsLib){const e=document.createElement("script");e.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",e.onload=()=>{window.pdfjsLib=window["pdfjs-dist/build/pdf"],window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"},document.head.appendChild(e)}if(!window.jspdf){const e=document.createElement("script");e.src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",document.head.appendChild(e)}if(!window.THREE){const e=document.createElement("script");e.src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",document.head.appendChild(e)}if(!window.math){const e=document.createElement("script");e.src="https://cdnjs.cloudflare.com/ajax/libs/mathjs/12.4.0/math.js",document.head.appendChild(e)}}function ae(){return`
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
    `}function ne(){const e=[{symbol:"H",name:"Hydrogen",number:1,mass:1.008,category:"nonmetal"},{symbol:"He",name:"Helium",number:2,mass:4.003,category:"noble-gas"},{symbol:"Li",name:"Lithium",number:3,mass:6.941,category:"alkali-metal"},{symbol:"Be",name:"Beryllium",number:4,mass:9.012,category:"alkaline-earth"},{symbol:"C",name:"Carbon",number:6,mass:12.011,category:"nonmetal"},{symbol:"N",name:"Nitrogen",number:7,mass:14.007,category:"nonmetal"},{symbol:"O",name:"Oxygen",number:8,mass:15.999,category:"nonmetal"},{symbol:"F",name:"Fluorine",number:9,mass:18.998,category:"halogen"},{symbol:"Ne",name:"Neon",number:10,mass:20.18,category:"noble-gas"}],t=document.getElementById("element-grid");e.forEach(o=>{const a=document.createElement("div");a.style.cssText=`
            padding: 0.5rem;
            background: var(--accent-color-alpha);
            border: 2px solid var(--border-color);
            border-radius: 4px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
        `,a.innerHTML=`
            <div style="font-size: 0.7rem;">${o.number}</div>
            <div style="font-size: 1.2rem; font-weight: bold;">${o.symbol}</div>
            <div style="font-size: 0.65rem;">${o.mass.toFixed(3)}</div>
        `,a.onclick=()=>ie(o),a.onmouseover=()=>{a.style.transform="scale(1.1)",a.style.background="var(--accent-color)",a.style.color="white"},a.onmouseout=()=>{a.style.transform="scale(1)",a.style.background="var(--accent-color-alpha)",a.style.color="var(--text-primary)"},t.appendChild(a)})}function ie(e){const t=document.getElementById("element-details");t.style.display="block",t.innerHTML=`
        <h3 style="color: var(--accent-color); font-size: 2rem; margin-bottom: 1rem;">
            ${e.name} (${e.symbol})
        </h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
            <div><strong>Atomic Number:</strong> ${e.number}</div>
            <div><strong>Atomic Mass:</strong> ${e.mass} u</div>
            <div><strong>Category:</strong> ${e.category.replace("-"," ")}</div>
            <div><strong>Group:</strong> Varies</div>
        </div>
    `}function le(){return`
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
    `}async function re(){const e=document.getElementById("reactants-input").value.trim(),t=document.getElementById("products-input").value.trim(),o=document.getElementById("balanced-equation-result");if(!e||!t){o.style.display="block",o.innerHTML='<p style="color: red;">Please enter both reactants and products.</p>';return}o.style.display="block",o.innerHTML='<div class="text-center"><span class="loading-spinner"></span> Balancing...</div>';try{window.math||await new Promise(l=>setTimeout(l,500));const a=e.split("+").map(l=>l.trim()),i=t.split("+").map(l=>l.trim()),n=ce(a,i);if(n){const l=(m,u)=>m.map((d,g)=>{const p=u[g];return(p===1?"":p)+se(d)}).join(" + "),r=n.slice(0,a.length),s=n.slice(a.length),c=`${l(a,r)} → ${l(i,s)}`;o.innerHTML=`
                <div class="paper-card" style="border-left: 4px solid var(--accent-color);">
                    <h3 style="color: var(--accent-color); margin-bottom: 1rem;">Balanced Equation:</h3>
                    <div style="font-size: 1.5rem; text-align: center; padding: 1rem; background: var(--accent-color-alpha); border-radius: 8px; font-family: 'Source Code Pro', monospace;">
                        ${c}
                    </div>
                </div>
            `}else throw new Error("Could not balance equation. Check if it's chemically valid.")}catch(a){o.innerHTML=`<div style="color: red;">Error: ${a.message}</div>`}}function se(e){return e.replace(/(\d+)/g,"<sub>$1</sub>")}function ce(e,t){const o=[...e,...t],a=new Set,i=o.map(r=>{const s=de(r);return Object.keys(s).forEach(c=>a.add(c)),s}),n=Array.from(a),l=[];return n.forEach(r=>{const s=[];i.forEach((c,m)=>{const u=c[r]||0;s.push(m<e.length?u:-u)}),l.push(s)}),me(l,o.length)}function de(e){const t={},o=/([A-Z][a-z]?)(\d*)/g;let a;for(;(a=o.exec(e))!==null;){const i=a[1],n=a[2]?parseInt(a[2]):1;t[i]=(t[i]||0)+n}return t}function me(e,t){function*a(i,n){const l=new Array(i).fill(1);for(;;){yield l;let r=0;for(;r<i&&(l[r]++,!(l[r]<=n));)l[r]=1,r++;if(r===i)return}}for(const i of a(t,12)){let n=!0;for(const l of e){let r=0;for(let s=0;s<t;s++)r+=l[s]*i[s];if(r!==0){n=!1;break}}if(n)return i}return null}function ue(){return`
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
    `}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",y):y();window.openTool=T;window.openToolModal=C;window.closeModal=w;window.updateModelOptions=H;window.sendChatMessage=x;window.searchPapers=L;window.convertPDFToJPG=F;window.downloadImage=q;window.downloadAllAsZip=A;window.reducePDFSize=G;window.downloadCompressedPDF=O;window.changeMolecule=E;window.rotateMolecule=X;window.startGame=U;window.updateUnitOptions=k;window.convertUnits=K;window.calculateMolWeight=te;window.balanceEquation=re;document.addEventListener("DOMContentLoaded",()=>{y(),lucide.createIcons()});
