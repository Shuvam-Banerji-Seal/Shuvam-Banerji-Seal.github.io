import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css                        *//* empty css               *//* empty css                  */import"./navbar-CxcuK0N-.js";class r{constructor(){this.booksBasePath="../books/all_books",this.books=[],this.currentBook=null,this.currentChapterIndex=0,this.init()}async init(){await this.loadBooksMetadata(),this.setupEventListeners(),typeof lucide<"u"&&lucide.createIcons()}async loadBooksMetadata(){this.books=[{id:"Book_1_The_Journey_of_Adi",title:"The Journey of Adi",author:"Shuvam Banerji Seal",description:"A tale of dimensional walking and quantum consciousness",chapters:[{id:"Chapter_01_The_Beginning",title:"The Beginning",number:1,path:"../books/all_books/Book_1_The_Journey_of_Adi/Chapter_01_The_Beginning/content.md"}]}],this.populateBookSelector()}populateBookSelector(){const e=document.getElementById("book-select");this.books.forEach(t=>{if(!e.querySelector(`option[value="${t.id}"]`)){const n=document.createElement("option");n.value=t.id,n.textContent=`${t.title} by ${t.author}`,e.appendChild(n)}})}setupEventListeners(){const e=document.getElementById("book-select"),t=document.getElementById("chapter-select");e&&e.addEventListener("change",n=>{n.target.value!=="sample"&&this.selectBook(n.target.value)}),t&&t.addEventListener("change",n=>{const o=parseInt(n.target.value);isNaN(o)||this.loadChapter(o)})}selectBook(e){if(!e){this.clearContent(),this.disableChapterSelect();return}this.currentBook=this.books.find(t=>t.id===e),this.currentBook&&(this.currentChapterIndex=0,this.populateChapterSelect(),this.loadChapter(0))}populateChapterSelect(){const e=document.getElementById("chapter-select");e.innerHTML='<option value="">Select a chapter...</option>',e.disabled=!1,this.currentBook.chapters.forEach((t,n)=>{const o=document.createElement("option");o.value=n,o.textContent=`Chapter ${t.number}: ${t.title}`,e.appendChild(o)})}disableChapterSelect(){const e=document.getElementById("chapter-select");e.innerHTML='<option value="">Select a chapter...</option>',e.disabled=!0}clearContent(){const e=document.getElementById("reader-content");e.innerHTML=`
            <div class="empty-state">
                <div>
                    <i data-lucide="book-open" class="w-16 h-16 mx-auto mb-4 opacity-30"></i>
                </div>
                <h2>Welcome to E-Reader</h2>
                <p>Select a book from the dropdown above to start reading</p>
            </div>
        `,typeof lucide<"u"&&lucide.createIcons()}async loadChapter(e){if(e<0||e>=this.currentBook.chapters.length)return;this.currentChapterIndex=e;const t=this.currentBook.chapters[e],n=document.getElementById("reader-content");n.innerHTML='<div class="loading" style="text-align:center; padding: 2rem;">Loading chapter...</div>',document.getElementById("chapter-select").value=e;try{let o="";try{const i=await fetch(t.path);if(i.ok)o=await i.text();else throw new Error("File not found")}catch(i){console.warn("Could not load chapter file, using placeholder",i),o=`# ${t.title}

*Content for this chapter is currently being written. Please check back later.*

> The journey continues...`}const a=this.renderMarkdown(o);n.innerHTML=`
                <div class="chapter-content">
                    <div class="chapter-header" style="text-align: center; margin-bottom: 3rem; border-bottom: 1px solid var(--reader-accent); padding-bottom: 2rem;">
                        <p style="text-transform: uppercase; letter-spacing: 2px; font-size: 0.9rem; margin-bottom: 1rem;">${this.currentBook.title}</p>
                        <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem;">Chapter ${t.number}</h1>
                        <h2 style="font-size: 1.5rem; font-weight: 400; font-style: italic;">${t.title}</h2>
                    </div>
                    ${a}
                    
                    <div class="pagination">
                        <button class="pagination-btn" onclick="window.eReader.navigateChapter(-1)" ${e===0?"disabled":""}>
                            <i data-lucide="chevron-left"></i> Previous
                        </button>
                        <button class="pagination-btn" onclick="window.eReader.navigateChapter(1)" ${e===this.currentBook.chapters.length-1?"disabled":""}>
                            Next <i data-lucide="chevron-right"></i>
                        </button>
                    </div>
                </div>
            `,window.renderMathInElement&&renderMathInElement(n,{delimiters:[{left:"$$",right:"$$",display:!0},{left:"$",right:"$",display:!1}]}),typeof lucide<"u"&&lucide.createIcons(),window.scrollTo({top:0,behavior:"smooth"})}catch(o){n.innerHTML=`<div class="error" style="color: red; text-align: center;">Error loading chapter: ${o.message}</div>`}}renderMarkdown(e){return typeof marked<"u"?marked.parse(e):e}navigateChapter(e){const t=this.currentChapterIndex+e;t>=0&&t<this.currentBook.chapters.length&&this.loadChapter(t)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{window.eReader=new r}):window.eReader=new r;
