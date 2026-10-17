        // Published profile content is read only from the embedded site snapshot.
        function readEmbeddedPortfolioData() {
            try {
                let element = document.getElementById('portfolioEmbeddedData');
                return element ? JSON.parse(element.textContent || '{}') : {};
            } catch (error) {
                return {};
            }
        }
        const embeddedPortfolioData = readEmbeddedPortfolioData();
        function loadPortfolioData() {
            try {
                let stored = JSON.parse(localStorage.getItem('portfolio-saved-data') || '{}');
                return stored && typeof stored === 'object' ? stored : {};
            } catch (error) {
                return {};
            }
        }
        const savedData = loadPortfolioData();
        let notes = Array.isArray(savedData.notes) ? savedData.notes : [];
        let diaryEntries = Array.isArray(savedData.diaryEntries) ? savedData.diaryEntries : [];
        let flashcards = Array.isArray(savedData.flashcards) ? savedData.flashcards : [];
        const profileName = embeddedPortfolioData.profileName || 'Aldrin Pagangpang Yancha';
        const profileTagline = embeddedPortfolioData.profileTagline || '';
        const profileSections = embeddedPortfolioData.profileSections && typeof embeddedPortfolioData.profileSections === 'object'
            ? embeddedPortfolioData.profileSections
            : {};
        ['home','about','skills','projects','achievements','goals','contact'].forEach(section => {
            if (!Array.isArray(profileSections[section])) profileSections[section] = [];
        });
        let currentCard = 0;
        // Switch between light and dark themes and remember the choice in this browser.
        function applyTheme(theme) {
            let isDark = theme === 'dark';
            document.body.classList.toggle('dark-mode', isDark);
            let button = document.getElementById('themeToggle');
            if (button) {
                button.textContent = isDark ? 'Light mode' : 'Dark mode';
                button.setAttribute('aria-label', 'Switch to ' + (isDark ? 'light' : 'dark') + ' mode');
                button.setAttribute('aria-pressed', String(isDark));
            }
        }
        function initializeTheme() {
            let theme = '';
            try { theme = localStorage.getItem('portfolio-theme') || ''; } catch (error) { }
            if (theme !== 'dark' && theme !== 'light') theme = embeddedPortfolioData.theme === 'dark' ? 'dark' : 'light';
            applyTheme(theme);
        }
        function toggleTheme() {
            let theme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            applyTheme(theme);
            try { localStorage.setItem('portfolio-theme', theme); } catch (error) { }
        }

        // Collapse the cover area while the portfolio content is scrolled; expand it again at the top.
        let headerCollapseDistance = 0;
        function measureHeaderCollapseDistance() {
            let header = document.querySelector('.header-container');
            if (!header) return 0;
            let expandedHeight = header.getBoundingClientRect().height;
            let clone = header.cloneNode(true);
            clone.classList.add('compact');
            clone.style.position = 'absolute';
            clone.style.left = '-10000px';
            clone.style.top = '0';
            clone.style.width = header.getBoundingClientRect().width + 'px';
            clone.style.visibility = 'hidden';
            clone.style.pointerEvents = 'none';
            clone.querySelectorAll('*').forEach(element => { element.style.transition = 'none'; });
            document.body.appendChild(clone);
            let compactHeight = clone.getBoundingClientRect().height;
            clone.remove();
            return Math.max(0, expandedHeight - compactHeight);
        }
        function updateHeaderScrollState() {
            let scrollContainer = document.getElementById('scrollContainer');
            let header = document.querySelector('.header-container');
            if (!scrollContainer || !header) return;
            let isCompact = header.classList.contains('compact');
            let scrollTop = scrollContainer.scrollTop;
            if (isCompact) {
                // A lower reset threshold prevents small wheel/touch movements from flipping the header.
                if (scrollTop <= 10) header.classList.remove('compact');
                return;
            }
            // Do not shrink the header if doing so would consume nearly all available scroll range.
            let maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
            let requiredScrollRoom = headerCollapseDistance + 72;
            if (maxScroll > requiredScrollRoom && scrollTop > 48) header.classList.add('compact');
        }
        function initializeHeaderScroll() {
            let scrollContainer = document.getElementById('scrollContainer');
            if (!scrollContainer) return;
            headerCollapseDistance = measureHeaderCollapseDistance();
            scrollContainer.addEventListener('scroll', updateHeaderScrollState, { passive: true });
            window.addEventListener('resize', function () {
                headerCollapseDistance = measureHeaderCollapseDistance();
                updateHeaderScrollState();
            });
            updateHeaderScrollState();
        }

        // TAB NAVIGATION
        // Switch to the selected portfolio tab.
        function openTab(event, tabName) {
            let tabs = document.getElementsByClassName('tab-content');
            for (let i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
            let buttons = document.getElementsByClassName('nav-btn');
            for (let i = 0; i < buttons.length; i++) buttons[i].classList.remove('active');
            document.getElementById(tabName).classList.add('active');
            event.currentTarget.classList.add('active');
        }

        // Save only local Sticky Notes, Journal, and Reviewer data in this browser.
        function savePortfolioData() {
            try {
                localStorage.setItem('portfolio-saved-data', JSON.stringify({ notes, diaryEntries, flashcards }));
            } catch (error) {
                alert('Could not save this data in browser storage.');
            }
        }

        // STICKY NOTES
        // Add a sticky note.
        function addNote() {
            let input = document.getElementById('noteInput');
            let noteText = input.value.trim();
            if (noteText === '') { alert('Enter a note first.'); return; }
            notes.push(noteText);
            savePortfolioData();
            showNotes();
            input.value = '';
        }
        function showNotes() {
            let list = document.getElementById('notesList');
            list.innerHTML = '';
            for (let i = 0; i < notes.length; i++) {
                let card = document.createElement('div');
                card.className = 'simple-card';
                let text = document.createElement('p');
                text.textContent = notes[i];
                card.appendChild(text);
                let deleteButton = document.createElement('button');
                deleteButton.className = 'small-button';
                deleteButton.textContent = 'Delete';
                deleteButton.onclick = function () { notes.splice(i, 1); savePortfolioData(); showNotes(); };
                card.appendChild(deleteButton);
                list.appendChild(card);
            }
        }

        // JOURNAL ENTRIES
        // Add a diary entry.
        function addDiaryEntry() {
            let titleInput = document.getElementById('diaryTitle');
            let textInput = document.getElementById('diaryText');
            let title = titleInput.value.trim();
            let text = textInput.value.trim();
            if (title === '' || text === '') { alert('Enter both a title and journal entry.'); return; }
            diaryEntries.push({ title: title, text: text });
            savePortfolioData();
            showDiaryEntries();
            titleInput.value = '';
            textInput.value = '';
        }
        function showDiaryEntries() {
            let list = document.getElementById('diaryList');
            list.innerHTML = '';
            for (let i = 0; i < diaryEntries.length; i++) {
                let card = document.createElement('div');
                card.className = 'simple-card';
                let title = document.createElement('h4');
                title.textContent = diaryEntries[i].title;
                card.appendChild(title);
                let text = document.createElement('p');
                text.textContent = diaryEntries[i].text;
                card.appendChild(text);
                let deleteButton = document.createElement('button');
                deleteButton.className = 'small-button';
                deleteButton.textContent = 'Delete';
                deleteButton.onclick = function () { diaryEntries.splice(i, 1); savePortfolioData(); showDiaryEntries(); };
                card.appendChild(deleteButton);
                list.appendChild(card);
            }
        }

        // FLASHCARD REVIEWER
        // Add a study flashcard and display it.
        function addFlashcard() {
            let questionInput = document.getElementById('questionInput');
            let answerInput = document.getElementById('answerInput');
            let question = questionInput.value.trim();
            let answer = answerInput.value.trim();
            if (question === '' || answer === '') { alert('Enter both a question and an answer.'); return; }
            flashcards.push({ question: question, answer: answer });
            savePortfolioData();
            currentCard = flashcards.length - 1;
            showFlashcard();
            showFlashcardList();
            questionInput.value = '';
            answerInput.value = '';
        }
        function showFlashcard() {
            let question = document.getElementById('cardQuestion');
            let answer = document.getElementById('cardAnswer');
            let number = document.getElementById('cardNumber');
            if (flashcards.length === 0) {
                question.textContent = 'No flashcards yet. Add one using the form above.';
                answer.textContent = '';
                answer.style.display = 'none';
                number.textContent = '0 / 0';
                return;
            }
            question.textContent = flashcards[currentCard].question;
            answer.textContent = flashcards[currentCard].answer;
            answer.style.display = 'none';
            number.textContent = (currentCard + 1) + ' / ' + flashcards.length;
        }
        function showAnswer() {
            if (flashcards.length === 0) { alert('Add a flashcard first.'); return; }
            let answer = document.getElementById('cardAnswer');
            if (answer.style.display === 'none') answer.style.display = 'block';
            else answer.style.display = 'none';
        }
        function nextCard() {
            if (flashcards.length === 0) return;
            currentCard++;
            if (currentCard >= flashcards.length) currentCard = 0;
            showFlashcard();
        }
        function previousCard() {
            if (flashcards.length === 0) return;
            currentCard--;
            if (currentCard < 0) currentCard = flashcards.length - 1;
            showFlashcard();
        }
        function deleteCurrentFlashcard() {
            if (flashcards.length === 0) { alert('There are no flashcards to delete.'); return; }
            flashcards.splice(currentCard, 1);
            if (currentCard >= flashcards.length) currentCard = Math.max(0, flashcards.length - 1);
            savePortfolioData();
            showFlashcard();
            showFlashcardList();
        }
        function deleteFlashcard(index) {
            if (index < 0 || index >= flashcards.length) return;
            flashcards.splice(index, 1);
            if (currentCard >= flashcards.length) currentCard = Math.max(0, flashcards.length - 1);
            savePortfolioData();
            showFlashcard();
            showFlashcardList();
        }
        function showFlashcardList() {
            let list = document.getElementById('flashcardList');
            list.innerHTML = '';
            for (let i = 0; i < flashcards.length; i++) {
                let card = document.createElement('div');
                card.className = 'simple-card';
                let question = document.createElement('p');
                question.textContent = (i + 1) + '. ' + flashcards[i].question;
                card.appendChild(question);
                let deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.className = 'small-button danger-button';
                deleteButton.textContent = 'Delete';
                deleteButton.setAttribute('aria-label', 'Delete flashcard ' + (i + 1));
                deleteButton.onclick = function () { deleteFlashcard(i); };
                card.appendChild(deleteButton);
                list.appendChild(card);
            }
        }

        // Read-only profile preview rendering.
        function getProfilePhotoShape(detail) {
            return ['original','square','landscape','portrait'].includes(detail.photoShape) ? detail.photoShape : 'original';
        }
        function createProfilePreviewImage(detail, alt, isProject) {
            let image = document.createElement('img');
            image.className = (isProject ? 'project-img ' : '') + 'profile-card-image photo-shape-' + getProfilePhotoShape(detail);
            image.src = detail.photo;
            image.alt = alt;
            return image;
        }
        function shouldAutoBanner(detail, itemCount) {
            if (itemCount === 1) return true;
            if (itemCount === 2) return false;
            let text = [detail.value || '', detail.technologies || ''].join('\n').trim();
            let nonemptyLines = text.split('\n').filter(line => line.trim());
            let paragraphs = text.split(/\n\s*\n/).filter(paragraph => paragraph.trim());
            return text.length >= 140 || paragraphs.length >= 2 || nonemptyLines.length >= 3;
        }
        function fitIncompleteGridRows(container) {
            let run = [];
            function fitRun() {
                let remainder = run.length % 3;
                if (remainder === 2) run.slice(-2).forEach(card => card.classList.add('grid-last-half'));
                if (remainder === 1) {
                    let card = run[run.length - 1];
                    card.classList.add('grid-last-full');
                    if (!card.classList.contains('manual-grid-card')) {
                        card.classList.add('banner-card');
                        if (!card.classList.contains('banner-photo-top') && !card.classList.contains('banner-photo-center') && !card.classList.contains('banner-photo-bottom')) card.classList.add('banner-photo-center');
                    }
                }
                run = [];
            }
            Array.from(container.children).forEach(function (card) {
                if (!card.matches('.profile-preview-card, .project-card')) return;
                if (card.classList.contains('banner-card') || card.classList.contains('manual-grid-card')) fitRun();
                else run.push(card);
            });
            fitRun();
        }
        function applyProfileCardLayout(card, detail, itemCount, section) {
            let savedBannerChoice = detail.cardLayout === 'banner' && detail.cardLayoutManual !== false;
            let mode = (detail.cardLayoutManual === true || savedBannerChoice) && ['auto','grid','onehalf','banner'].includes(detail.cardLayout) ? detail.cardLayout : 'auto';
            let isBanner = mode === 'banner' || (mode === 'auto' && shouldAutoBanner(detail, itemCount));
            if (isBanner) {
                card.classList.add('banner-card');
                let position = ['top','center','bottom'].includes(detail.bannerPhotoPosition) ? detail.bannerPhotoPosition : 'center';
                card.classList.add('banner-photo-' + position);
            }
            if (mode === 'grid') card.classList.add('manual-grid-card','grid-size-square');
            if (mode === 'onehalf') card.classList.add('manual-grid-card','grid-size-half');
            if (mode === 'auto' && !isBanner && itemCount === 2) card.classList.add('grid-auto-half');
            if (mode === 'auto' && !isBanner && itemCount >= 3) card.classList.add('grid-auto-third');
            if (detail.photo) card.classList.add('has-photo');
        }
        function renderAllProfilePreviews() {
            Object.keys(profileSections).forEach(function (section) {
                let container = document.getElementById('profilePreview-' + section); if (!container) return;
                container.innerHTML = '';
                let items = Array.isArray(profileSections[section]) ? profileSections[section] : [];
                container.classList.remove('grid-one-item','grid-two-items','grid-three-plus');
                if (items.length === 1) container.classList.add('grid-one-item');
                if (items.length === 2) container.classList.add('grid-two-items');
                if (items.length >= 3) container.classList.add('grid-three-plus');
                if (section === 'projects') {
                    if (items.length === 0) {
                        let empty = document.createElement('p'); empty.className = 'profile-preview-hint'; empty.textContent = 'No projects to display yet.'; container.appendChild(empty);
                    }
                    items.forEach(function (project) {
                        let card = document.createElement('article'); card.className = 'project-card';
                        applyProfileCardLayout(card, project, items.length, section);
                        let content = document.createElement('div'); content.className = 'profile-preview-content';
                        let heading = document.createElement('h4'); heading.textContent = project.label || 'Untitled project'; content.appendChild(heading);
                        if (project.value) { let description = document.createElement('p'); description.textContent = project.value; content.appendChild(description); }
                        if (project.technologies) { let technology = document.createElement('p'); let strong = document.createElement('strong'); strong.textContent = 'Technologies: '; technology.appendChild(strong); technology.appendChild(document.createTextNode(project.technologies)); content.appendChild(technology); }
                        card.appendChild(content);
                        if (project.photo) card.appendChild(createProfilePreviewImage(project, 'Screenshot of ' + (project.label || 'project'), true));
                        container.appendChild(card);
                    });
                    fitIncompleteGridRows(container);
                    return;
                }
                items.forEach(function (detail) {
                    let card = document.createElement('article'); card.className = 'profile-preview-card';
                    applyProfileCardLayout(card, detail, items.length, section);
                    let content = document.createElement('div'); content.className = 'profile-preview-content';
                    let heading = document.createElement('h4'); heading.textContent = detail.label || 'Profile detail'; content.appendChild(heading);
                    if (detail.value) { let text = document.createElement('p'); text.textContent = detail.value; content.appendChild(text); }
                    card.appendChild(content);
                    if (detail.photo) card.appendChild(createProfilePreviewImage(detail, 'Photo related to ' + (detail.label || 'profile detail'), false));
                    container.appendChild(card);
                });
                fitIncompleteGridRows(container);
            });
        }

        initializeTheme();
        initializeHeaderScroll();
        document.getElementById('profileName').textContent = profileName;
        document.getElementById('profileTagline').textContent = profileTagline;
        renderAllProfilePreviews();
        showNotes();
        showDiaryEntries();
        showFlashcard();
        showFlashcardList();

        // Open a project by activating its matching navigation tab.
        function openProject(buttonId) {
            document.getElementById(buttonId).click();
        }

        // Open the separate personal project page bundled with the portfolio.
        function openPersonalProject() {
            window.location.href = 'personal-project/index.html';
        }
