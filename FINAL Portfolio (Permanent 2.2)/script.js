        // Load previously saved portfolio data, or use data embedded in a permanent HTML copy.
        // DATA AND DEFAULT PROFILE CONTENT
        function readEmbeddedPortfolioData() {
            try {
                let element = document.getElementById('portfolioEmbeddedData');
                return element ? JSON.parse(element.textContent || '{}') : {};
            } catch (error) {
                return {};
            }
        }
        let embeddedPortfolioData = readEmbeddedPortfolioData();
        function loadPortfolioData() {
            try {
                let browserData = JSON.parse(localStorage.getItem('portfolio-saved-data')) || {};
                if (embeddedPortfolioData.permanentSnapshot && !browserData.portfolioEditedAt) return Object.assign({}, browserData, embeddedPortfolioData);
                if (embeddedPortfolioData.permanentSnapshot) return Object.assign({}, embeddedPortfolioData, browserData);
                return browserData || embeddedPortfolioData || {};
            } catch (error) {
                return embeddedPortfolioData || {};
            }
        }
        let savedData = loadPortfolioData();
        let notes = Array.isArray(savedData.notes) ? savedData.notes : [];
        let diaryEntries = Array.isArray(savedData.diaryEntries) ? savedData.diaryEntries : [];
        let flashcards = Array.isArray(savedData.flashcards) ? savedData.flashcards : [];
        let profileName = savedData.profileName || 'Aldrin Pagangpang Yancha';
        let profileTagline = savedData.profileTagline || 'BSIT Student | Web Developer & Video Editor';
        let profileSections = savedData.profileSections && typeof savedData.profileSections === 'object' ? savedData.profileSections : {
            home: [
                { label: 'Introduction', value: 'Hi! I am Aldrin, an aspiring IT professional and web developer who loves building functional applications while exploring digital design and multimedia arts.', photo: '' },
                { label: 'Motto', value: '“Show Yourself Through Code”', photo: '' }
            ],
            about: Array.isArray(savedData.profileDetails) ? savedData.profileDetails : [
                { label: 'About me', value: 'I am a 2nd-year BSIT student at Datamex College of Saint Adeline - Fairview. I am passionate about programming, multimedia arts, and creating digital content.', photo: '' },
                { label: 'Course / Program', value: 'Bachelor of Science in Information Technology (BSIT)', photo: '' },
                { label: 'School', value: 'Datamex College of Saint Adeline - Fairview', photo: '' },
                { label: 'Hobby', value: 'Photography', photo: '' }, { label: 'Hobby', value: 'Music production', photo: '' }, { label: 'Hobby', value: 'Video editing', photo: '' },
                { label: 'Interest', value: 'Programming and web development', photo: '' }, { label: 'Interest', value: 'Multimedia arts', photo: '' }, { label: 'Interest', value: 'Creating digital content', photo: '' }
            ],
            skills: ['Video Editing (Adobe Premiere Pro, CapCut, Filmora)', 'Photo Editing (Adobe Photoshop, Snapseed, Canva)', 'Programming (C++, C#, Python, VB 6.0)', 'Web Development (HTML, CSS, JavaScript)', 'Music Production (FL Studio)', 'Photography'].map(value => ({ label: 'Skill', value: value, photo: '' })),
            projects: [],
            achievements: ["Replace this with one of your achievements (example: Dean's Lister, 1st Year)", 'Replace this with a certificate or award', 'Completed three web projects: Sticky Notes, Journal, and Reviewer'].map(value => ({ label: 'Achievement', value: value, photo: '' })),
            goals: ['Become a professional web developer', 'Learn advanced JavaScript and database development', 'Build websites for clients'].map(value => ({ label: 'Goal', value: value, photo: '' })),
            contact: [{ label: 'Email', value: 'youremail@gmail.com', photo: '' }]
        };
        ['home','about','skills','projects','achievements','goals','contact'].forEach(section => { if (!Array.isArray(profileSections[section])) profileSections[section] = []; });
        // Translate known sample text saved by older versions without changing user-written content.
        const legacySampleTranslations = {
            'Palitan mo ito ng achievement mo (halimbawa: Dean\'s Lister, 1st Year)': 'Add an achievement (example: Dean\'s List, First Year)',
            'Palitan mo ito ng certificate o award': 'Add a certificate or award',
            'Natapos ang tatlong web projects: Sticky Notes, Journal, at Reviewer': 'Completed three web projects: Sticky Notes, Journal, and Reviewer',
            'Maging professional web developer': 'Become a professional web developer',
            'Matutunan ang mas advanced na JavaScript at database': 'Learn advanced JavaScript and database development',
            'Makagawa ng sarili kong website para sa mga kliyente': 'Build websites for clients'
        };
        Object.values(profileSections).forEach(items => items.forEach(item => {
            if (legacySampleTranslations[item.value]) item.value = legacySampleTranslations[item.value];
        }));
        let activeProfileSection = 'home';
        let currentCard = 0;
        let profilePhotoData = '';
        let coverPhotoData = '';

        // State variables used by the photo editor.
        let photoType = '';
        let photoTargetSection = '';
        let photoTargetIndex = -1;
        let selectedImage = new Image();
        let photoZoom = 1;
        let photoX = 0;
        let photoY = 0;
        let isDragging = false;
        let lastMouseX = 0;
        let lastMouseY = 0;

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

        // Save portfolio content and profile details in browser storage.
        function savePortfolioData() {
            try {
                let data = { notes: notes, diaryEntries: diaryEntries, flashcards: flashcards, profileName: profileName, profileTagline: profileTagline, profileSections: profileSections, portfolioEditedAt: Date.now() };
                localStorage.setItem('portfolio-saved-data', JSON.stringify(data));
            } catch (error) {
                alert('Could not save data in browser storage. Export a backup file.');
            }
        }

        // MENU AND PROFILE/COVER PHOTO CONTROLS
        // Open or close the settings menu.
        function toggleMenu() {
            let panel = document.getElementById('menuPanel');
            let button = document.getElementById('menuToggle');
            panel.hidden = !panel.hidden;
            button.setAttribute('aria-expanded', !panel.hidden);
        }
        function closeMenu() {
            document.getElementById('menuPanel').hidden = true;
            document.getElementById('menuToggle').setAttribute('aria-expanded', 'false');
        }
        document.addEventListener('click', function (event) {
            if (!event.target.closest('.workspace-menu')) closeMenu();
        });

        // Open the file picker for a profile or cover photo.
        function choosePhoto(type) {
            closeMenu();
            photoType = type;
            photoTargetSection = '';
            photoTargetIndex = -1;
            let fileInput = document.getElementById('photoFile');
            fileInput.value = '';
            fileInput.click();
        }

        function loadImageForPhotoEditor(source) {
            selectedImage = new Image();
            selectedImage.onload = openPhotoEditor;
            selectedImage.onerror = function () { alert('Hindi mabuksan ang larawang ito. Subukan ang ibang image file.'); };
            selectedImage.src = source;
        }

        // Read the selected image and prepare it for editing.
        document.getElementById('photoFile').addEventListener('change', function () {
            let file = this.files[0];
            if (!file) return;

            let reader = new FileReader();
            reader.onload = function (event) { loadImageForPhotoEditor(event.target.result); };
            reader.readAsDataURL(file);
        });

        // Set the preview shape: square for the profile and wide for the cover.
        function openPhotoEditor() {
            let canvas = document.getElementById('photoCanvas');
            if (photoType === 'profile') {
                canvas.width = 700;
                canvas.height = 700;
                document.getElementById('editorTitle').textContent = 'Change profile picture';
                document.getElementById('savePhotoButton').textContent = 'Save profile picture';
            } else if (photoType === 'cover') {
                canvas.width = 900;
                canvas.height = 160;
                document.getElementById('editorTitle').textContent = 'Change cover photo';
                document.getElementById('savePhotoButton').textContent = 'Save cover photo';
            } else {
                let target = profileSections[photoTargetSection] && profileSections[photoTargetSection][photoTargetIndex];
                let shape = target && target.photoShape || 'original';
                if (shape === 'square') { canvas.width = 900; canvas.height = 900; }
                else if (shape === 'landscape') { canvas.width = 900; canvas.height = 600; }
                else if (shape === 'portrait') { canvas.width = 600; canvas.height = 900; }
                else if (selectedImage.width >= selectedImage.height) {
                    canvas.width = 900;
                    canvas.height = Math.max(1, Math.round(900 * selectedImage.height / selectedImage.width));
                } else {
                    canvas.height = 900;
                    canvas.width = Math.max(1, Math.round(900 * selectedImage.width / selectedImage.height));
                }
                document.getElementById('editorTitle').textContent = 'Adjust tab photo';
                document.getElementById('savePhotoButton').textContent = 'Save tab photo';
            }
            photoZoom = 1;
            photoX = canvas.width / 2;
            photoY = canvas.height / 2;
            document.getElementById('zoomSlider').value = 100;
            document.getElementById('zoomValue').textContent = '100%';
            document.getElementById('photoEditor').style.display = 'flex';
            drawPhoto();
        }

        // Draw the zoomed and positioned image in the preview.
        function drawPhoto() {
            let canvas = document.getElementById('photoCanvas');
            let context = canvas.getContext('2d');
            let fillScale = Math.max(canvas.width / selectedImage.width, canvas.height / selectedImage.height);
            let scale = fillScale * photoZoom;
            let imageWidth = selectedImage.width * scale;
            let imageHeight = selectedImage.height * scale;

            // Allow the image to move through its full valid range while keeping the crop covered.
            photoX = Math.max(canvas.width - imageWidth / 2, Math.min(imageWidth / 2, photoX));
            photoY = Math.max(canvas.height - imageHeight / 2, Math.min(imageHeight / 2, photoY));

            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(selectedImage, photoX - imageWidth / 2, photoY - imageHeight / 2, imageWidth, imageHeight);
        }

        // Update the image zoom when the slider moves.
        document.getElementById('zoomSlider').addEventListener('input', function () {
            photoZoom = Number(this.value) / 100;
            document.getElementById('zoomValue').textContent = this.value + '%';
            drawPhoto();
        });
        function changePhotoZoom(amount) {
            let slider = document.getElementById('zoomSlider');
            slider.value = Math.max(Number(slider.min), Math.min(Number(slider.max), Number(slider.value) + amount));
            slider.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Allow the image to be dragged with a mouse or touch input.
        let canvas = document.getElementById('photoCanvas');
        canvas.addEventListener('pointerdown', function (event) {
            isDragging = true;
            lastMouseX = event.clientX;
            lastMouseY = event.clientY;
            canvas.setPointerCapture(event.pointerId);
        });
        canvas.addEventListener('pointermove', function (event) {
            if (!isDragging) return;
            let bounds = canvas.getBoundingClientRect();
            photoX += (event.clientX - lastMouseX) * (canvas.width / bounds.width);
            photoY += (event.clientY - lastMouseY) * (canvas.height / bounds.height);
            lastMouseX = event.clientX;
            lastMouseY = event.clientY;
            drawPhoto();
        });
        canvas.addEventListener('pointerup', function () { isDragging = false; });
        canvas.addEventListener('pointercancel', function () { isDragging = false; });

        // Save the crop and display it in the profile or cover area.
        function savePhoto() {
            let canvas = document.getElementById('photoCanvas');
            let imageData = canvas.toDataURL('image/jpeg', 0.9);
            let storageKey = 'portfolio-' + photoType + '-photo';

            if (photoType === 'profile') {
                profilePhotoData = imageData;
                document.getElementById('profileImage').src = imageData;
                document.getElementById('profileImage').style.display = 'block';
                document.getElementById('profilePlaceholder').style.display = 'none';
            } else if (photoType === 'cover') {
                document.getElementById('coverPhoto').style.backgroundImage = 'url("' + imageData + '")';
                document.getElementById('coverPhoto').style.backgroundSize = 'cover';
                document.getElementById('coverPlaceholder').style.display = 'none';
                coverPhotoData = imageData;
                try {
                    localStorage.setItem(storageKey, imageData);
                    localStorage.setItem('portfolio-photo-edited', '1');
                } catch (error) {
                    alert('Na-apply ang larawan pero hindi ito na-save sa browser storage. Maaaring masyadong malaki ang file.');
                }
            } else {
                let section = profileSections[photoTargetSection];
                if (!section || !section[photoTargetIndex]) return;
                section[photoTargetIndex].photo = imageData;
                savePortfolioData();
                renderProfileEditorRows();
                renderAllProfilePreviews();
            }

            // Save the image in browser storage so it remains after a refresh.
            if (photoType === 'profile') {
                try {
                    localStorage.setItem(storageKey, imageData);
                    localStorage.setItem('portfolio-photo-edited', '1');
                } catch (error) {
                    alert('Na-apply ang larawan pero hindi ito na-save sa browser storage. Maaaring masyadong malaki ang file.');
                }
            }
            closePhotoEditor();
        }

        // Close the editor without applying unsaved changes.
        function closePhotoEditor() {
            document.getElementById('photoEditor').style.display = 'none';
            isDragging = false;
        }

        // Remove the selected image and restore its placeholder.
        function removePhoto(type) {
            let storageKey = 'portfolio-' + type + '-photo';
            try { localStorage.removeItem(storageKey); } catch (error) { }

            if (type === 'profile') {
                profilePhotoData = '';
                document.getElementById('profileImage').removeAttribute('src');
                document.getElementById('profileImage').style.display = 'none';
                document.getElementById('profilePlaceholder').style.display = 'block';
            } else {
                coverPhotoData = '';
                document.getElementById('coverPhoto').style.backgroundImage = '';
                document.getElementById('coverPlaceholder').style.display = 'block';
            }
            try { localStorage.setItem('portfolio-photo-edited', '1'); } catch (error) { }
        }

        // Restore images previously saved in browser storage.
        function loadSavedPhotos() {
            try {
                let useBrowserPhotos = !embeddedPortfolioData.permanentSnapshot || localStorage.getItem('portfolio-photo-edited') === '1';
                let savedProfile = useBrowserPhotos
                    ? (localStorage.getItem('portfolio-profile-photo') || '')
                    : (embeddedPortfolioData.profilePhoto || '');
                let savedCover = useBrowserPhotos
                    ? (localStorage.getItem('portfolio-cover-photo') || '')
                    : (embeddedPortfolioData.coverPhoto || '');
                profilePhotoData = savedProfile || '';
                coverPhotoData = savedCover || '';
                if (savedProfile) {
                    document.getElementById('profileImage').src = savedProfile;
                    document.getElementById('profileImage').style.display = 'block';
                    document.getElementById('profilePlaceholder').style.display = 'none';
                }
                if (savedCover) {
                    document.getElementById('coverPhoto').style.backgroundImage = 'url("' + savedCover + '")';
                    document.getElementById('coverPhoto').style.backgroundSize = 'cover';
                    document.getElementById('coverPlaceholder').style.display = 'none';
                }
            } catch (error) {
                // Use blank placeholders when browser storage is unavailable.
            }
        }

        // BACKUP EXPORT AND IMPORT
        // Download notes, diary entries, flashcards, profile details, and photos as a JSON backup.
        function exportFiles() {
            let backup = {
                format: 'simple-portfolio-backup',
                notes: notes,
                diaryEntries: diaryEntries,
                flashcards: flashcards,
                profilePhoto: profilePhotoData,
                coverPhoto: coverPhotoData,
                profileName: profileName,
                profileTagline: profileTagline,
                profileSections: profileSections
            };
            let file = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            let link = document.createElement('a');
            let downloadUrl = URL.createObjectURL(file);
            link.href = downloadUrl;
            link.download = 'portfolio-backup.json';
            link.click();
            setTimeout(function () { URL.revokeObjectURL(downloadUrl); }, 1000);
            closeMenu();
        }

        // Select a JSON backup file to restore to the portfolio.
        function chooseImportFile() {
            closeMenu();
            let input = document.getElementById('importFile');
            input.value = '';
            input.click();
        }

        document.getElementById('importFile').addEventListener('change', function () {
            let file = this.files[0];
            if (!file) return;

            let reader = new FileReader();
            reader.onload = function (event) {
                let backup;
                try {
                    backup = JSON.parse(event.target.result);
                } catch (error) {
                    alert('The file could not be read. Choose a valid portfolio backup JSON file.');
                    return;
                }

                // Validate the backup before replacing the current data.
                let validBackup = backup && Array.isArray(backup.notes)
                    && Array.isArray(backup.diaryEntries) && Array.isArray(backup.flashcards);
                if (validBackup) {
                    validBackup = backup.notes.every(note => typeof note === 'string')
                        && backup.diaryEntries.every(entry => entry && typeof entry.title === 'string' && typeof entry.text === 'string')
                        && backup.flashcards.every(card => card && typeof card.question === 'string' && typeof card.answer === 'string');
                }
                if (validBackup) {
                    let profileIsValid = !backup.profilePhoto || (typeof backup.profilePhoto === 'string' && backup.profilePhoto.startsWith('data:image/'));
                    let coverIsValid = !backup.coverPhoto || (typeof backup.coverPhoto === 'string' && backup.coverPhoto.startsWith('data:image/'));
                    let detailsValid = !backup.profileSections || (typeof backup.profileSections === 'object' && !Array.isArray(backup.profileSections) && Object.values(backup.profileSections).every(list => Array.isArray(list) && list.every(item => item && typeof item.label === 'string' && typeof item.value === 'string' && (item.technologies === undefined || typeof item.technologies === 'string') && (!item.photo || (typeof item.photo === 'string' && item.photo.startsWith('data:image/'))))));
                    validBackup = profileIsValid && coverIsValid && detailsValid;
                }
                if (!validBackup) {
                    alert('This does not appear to be a valid portfolio backup file.');
                    return;
                }
                if (!confirm('The backup will replace the current profile details, notes, diary entries, flashcards, and photos. Continue?')) return;

                notes = backup.notes;
                diaryEntries = backup.diaryEntries;
                flashcards = backup.flashcards;
                profilePhotoData = typeof backup.profilePhoto === 'string' ? backup.profilePhoto : '';
                coverPhotoData = typeof backup.coverPhoto === 'string' ? backup.coverPhoto : '';
                profileName = typeof backup.profileName === 'string' ? backup.profileName : profileName;
                profileTagline = typeof backup.profileTagline === 'string' ? backup.profileTagline : profileTagline;
                if (backup.profileSections && typeof backup.profileSections === 'object') profileSections = backup.profileSections;
                currentCard = 0;

                savePortfolioData();
                try {
                    if (profilePhotoData) localStorage.setItem('portfolio-profile-photo', profilePhotoData);
                    else localStorage.removeItem('portfolio-profile-photo');
                    if (coverPhotoData) localStorage.setItem('portfolio-cover-photo', coverPhotoData);
                    else localStorage.removeItem('portfolio-cover-photo');
                    localStorage.setItem('portfolio-photo-edited', '1');
                } catch (error) {
                    alert('The data was imported, but some photos could not be saved in browser storage.');
                }

                loadSavedPhotos();
                renderAllProfilePreviews();
                document.getElementById('profileName').textContent = profileName;
                document.getElementById('profileTagline').textContent = profileTagline;
                showNotes();
                showDiaryEntries();
                showFlashcard();
                showFlashcardList();
                alert('The portfolio backup has been imported.');
            };
            reader.readAsText(file);
        });

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

        // PROFILE SECTION EDITOR AND PREVIEW
        // One menu editor manages content for every main navigation section.
        function editProfileSection(section) {
            activeProfileSection = section;
            closeMenu();
            openProfileEditor();
        }
        function openProfileEditor() {
            document.getElementById('profileNameInput').value = profileName;
            document.getElementById('profileTaglineInput').value = profileTagline;
            renderProfileEditorRows();
            let modal = document.getElementById('profileEditor'); modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
        }
        function closeProfileEditor() {
            let modal = document.getElementById('profileEditor'); modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
        }
        function renderProfileEditorRows() {
            let titles = {home:'Home',about:'About Me',skills:'My Skills',projects:'My Projects',achievements:'Achievements',goals:'Future Goals',contact:'Contact Me'};
            document.getElementById('profileSectionHeading').textContent = titles[activeProfileSection] + ' information';
            let container = document.getElementById('profileDetailRows'); container.innerHTML = '';
            profileSections[activeProfileSection].forEach(function (detail, index) {
                let row = document.createElement('div'); row.className = 'profile-detail-row';
                let fields = document.createElement('div'); fields.className = 'profile-detail-fields';
                let isProject = activeProfileSection === 'projects';
                if (isProject) fields.classList.add('project-detail-fields');
                let label = document.createElement('label'); label.textContent = isProject ? 'Project name' : 'Label';
                let labelInput = document.createElement('input'); labelInput.type = 'text'; labelInput.value = detail.label || ''; labelInput.placeholder = isProject ? 'Example: Portfolio Website' : 'Example: Hobby, Skill, Goal'; labelInput.className = 'detail-label'; label.appendChild(labelInput);
                let value = document.createElement('label'); value.textContent = isProject ? 'Description' : 'Detail';
                let valueInput = document.createElement('textarea'); valueInput.rows = 4; valueInput.value = detail.value || ''; valueInput.placeholder = isProject ? 'Describe the project. Press Enter for a new line; use a blank line between paragraphs.' : 'Enter the information. Press Enter for a new line; use a blank line between paragraphs.'; valueInput.className = 'detail-value'; value.appendChild(valueInput);
                fields.append(label, value); row.appendChild(fields);
                let displayOptions = document.createElement('div'); displayOptions.className = 'detail-display-options';
                let shapeField = document.createElement('label'); shapeField.textContent = 'Photo shape';
                let shapeSelect = document.createElement('select'); shapeSelect.className = 'detail-photo-shape';
                [['original','Original (fit full photo)'],['square','Square (1:1)'],['landscape','Landscape (3:2)'],['portrait','Portrait (2:3)']].forEach(function (option) {
                    let item = document.createElement('option'); item.value = option[0]; item.textContent = option[1]; shapeSelect.appendChild(item);
                });
                shapeSelect.value = ['original','square','landscape','portrait'].includes(detail.photoShape) ? detail.photoShape : 'original';
                shapeSelect.onchange = function () {
                    collectProfileEditorRows();
                    if (profileSections[activeProfileSection][index] && profileSections[activeProfileSection][index].photo) editDetailPhoto(index);
                };
                shapeField.appendChild(shapeSelect);
                let layoutField = document.createElement('label'); layoutField.textContent = 'Card layout';
                let layoutSelect = document.createElement('select'); layoutSelect.className = 'detail-card-layout';
                [['auto','Auto (recommended)'],['grid','Square card (1 column)'],['onehalf','1.5 columns (half row)'],['banner','Full-row banner']].forEach(function (option) {
                    let item = document.createElement('option'); item.value = option[0]; item.textContent = option[1]; layoutSelect.appendChild(item);
                });
                let savedBannerChoice = detail.cardLayout === 'banner' && detail.cardLayoutManual !== false;
                layoutSelect.value = detail.cardLayoutManual === true || savedBannerChoice ? detail.cardLayout : 'auto';
                layoutSelect.dataset.manual = detail.cardLayoutManual === true || savedBannerChoice ? 'true' : 'false';
                layoutSelect.onchange = function () { layoutSelect.dataset.manual = 'true'; };
                layoutField.appendChild(layoutSelect);
                let positionField = document.createElement('label'); positionField.textContent = 'Banner photo position';
                let positionSelect = document.createElement('select'); positionSelect.className = 'detail-banner-position';
                [['top','Top'],['center','Center'],['bottom','Bottom']].forEach(function (option) {
                    let item = document.createElement('option'); item.value = option[0]; item.textContent = option[1]; positionSelect.appendChild(item);
                });
                positionSelect.value = ['top','center','bottom'].includes(detail.bannerPhotoPosition) ? detail.bannerPhotoPosition : 'center';
                positionField.appendChild(positionSelect);
                displayOptions.append(shapeField, layoutField, positionField); row.appendChild(displayOptions);
                if (isProject) {
                    let technology = document.createElement('label'); technology.className = 'project-technology-field'; technology.textContent = 'Technologies used (separate with commas)';
                    let technologyInput = document.createElement('input'); technologyInput.type = 'text'; technologyInput.value = detail.technologies || ''; technologyInput.placeholder = 'Example: HTML, CSS, JavaScript'; technologyInput.className = 'detail-technologies'; technology.appendChild(technologyInput); row.appendChild(technology);
                }
                let tools = document.createElement('div'); tools.className = 'profile-detail-tools';
                let file = document.createElement('input'); file.type = 'file'; file.accept = 'image/*'; file.setAttribute('aria-label', 'Add or change photo for ' + (detail.label || 'detail'));
                if (detail.photo) {
                    let adjustPhoto = document.createElement('button'); adjustPhoto.type = 'button'; adjustPhoto.className = 'info-photo-button'; adjustPhoto.textContent = 'Reposition / zoom';
                    adjustPhoto.setAttribute('aria-label', 'Reposition or zoom photo for ' + (detail.label || 'detail'));
                    adjustPhoto.onclick = function () { editDetailPhoto(index); };
                    let deletePhoto = document.createElement('button'); deletePhoto.type = 'button'; deletePhoto.className = 'info-photo-remove'; deletePhoto.textContent = 'Remove photo';
                    deletePhoto.onclick = function () { removeDetailPhoto(index); };
                    tools.append(file, adjustPhoto, deletePhoto);
                } else {
                    tools.appendChild(file);
                }
                let moveUp = document.createElement('button'); moveUp.type = 'button'; moveUp.className = 'info-photo-button detail-order-button'; moveUp.textContent = '↑ Move up'; moveUp.disabled = index === 0; moveUp.setAttribute('aria-label', 'Move ' + (detail.label || 'detail') + ' up');
                moveUp.onclick = function () { moveProfileDetail(index, -1); };
                let moveDown = document.createElement('button'); moveDown.type = 'button'; moveDown.className = 'info-photo-button detail-order-button'; moveDown.textContent = '↓ Move down'; moveDown.disabled = index === profileSections[activeProfileSection].length - 1; moveDown.setAttribute('aria-label', 'Move ' + (detail.label || 'detail') + ' down');
                moveDown.onclick = function () { moveProfileDetail(index, 1); };
                tools.append(moveUp, moveDown);
                let remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-detail'; remove.textContent = 'Remove detail';
                remove.onclick = function () { collectProfileEditorRows(); profileSections[activeProfileSection].splice(index, 1); renderProfileEditorRows(); };
                tools.appendChild(remove); row.appendChild(tools);
                if (detail.photo) { let img = document.createElement('img'); img.className = 'profile-detail-photo'; img.src = detail.photo; img.alt = 'Preview of the photo attached to ' + (detail.label || 'detail'); row.appendChild(img); }
                file.onchange = function () {
                    let selected = file.files[0]; if (!selected) return;
                    let reader = new FileReader(); reader.onload = function (event) {
                        collectProfileEditorRows();
                        photoType = 'detail';
                        photoTargetSection = activeProfileSection;
                        photoTargetIndex = index;
                        loadImageForPhotoEditor(event.target.result);
                    }; reader.readAsDataURL(selected);
                };
                container.appendChild(row);
            });
        }
        function moveProfileDetail(index, direction) {
            collectProfileEditorRows();
            let details = profileSections[activeProfileSection];
            let nextIndex = index + direction;
            if (nextIndex < 0 || nextIndex >= details.length) return;
            let moved = details.splice(index, 1)[0];
            details.splice(nextIndex, 0, moved);
            renderProfileEditorRows();
        }
        function editDetailPhoto(index) {
            collectProfileEditorRows();
            let detail = profileSections[activeProfileSection][index];
            if (!detail || !detail.photo) return;
            photoType = 'detail';
            photoTargetSection = activeProfileSection;
            photoTargetIndex = index;
            loadImageForPhotoEditor(detail.photo);
        }
        function removeDetailPhoto(index) {
            collectProfileEditorRows();
            if (!profileSections[activeProfileSection][index]) return;
            profileSections[activeProfileSection][index].photo = '';
            savePortfolioData();
            renderProfileEditorRows();
            renderAllProfilePreviews();
        }
        function collectProfileEditorRows() {
            let rows = Array.from(document.querySelectorAll('.profile-detail-row'));
            profileSections[activeProfileSection] = rows.map(function (row, index) {
                let layoutSelect = row.querySelector('.detail-card-layout');
                let detail = { label: row.querySelector('.detail-label').value.trim(), value: row.querySelector('.detail-value').value.trim(), photo: profileSections[activeProfileSection][index] ? profileSections[activeProfileSection][index].photo || '' : '', photoShape: row.querySelector('.detail-photo-shape').value, cardLayout: layoutSelect.value, cardLayoutManual: layoutSelect.dataset.manual === 'true', bannerPhotoPosition: row.querySelector('.detail-banner-position').value };
                if (activeProfileSection === 'projects') detail.technologies = row.querySelector('.detail-technologies').value.trim();
                return detail;
            });
        }
        function addProfileDetail() {
            collectProfileEditorRows(); profileSections[activeProfileSection].push({ label: '', value: '', photo: '', photoShape: 'original', cardLayout: 'auto', cardLayoutManual: false, bannerPhotoPosition: 'center' }); renderProfileEditorRows();
            let fields = document.querySelectorAll('.detail-label'); if (fields.length) fields[fields.length - 1].focus();
        }
        function saveProfileEditor() {
            collectProfileEditorRows();
            profileName = document.getElementById('profileNameInput').value.trim() || 'Your Name';
            profileTagline = document.getElementById('profileTaglineInput').value.trim();
            Object.keys(profileSections).forEach(section => { profileSections[section] = profileSections[section].filter(item => item.label || item.value || item.photo); });
            document.getElementById('profileName').textContent = profileName; document.getElementById('profileTagline').textContent = profileTagline;
            renderAllProfilePreviews(); savePortfolioData(); closeProfileEditor();
        }
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
                        let empty = document.createElement('p'); empty.className = 'profile-preview-hint'; empty.textContent = 'No projects yet. Open Menu → Edit My Projects to add one.'; container.appendChild(empty);
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

        // Create an uncompressed ZIP archive using the standard ZIP file format.
        function createStoredZip(files) {
            let encoder = new TextEncoder();
            let localParts = [];
            let centralParts = [];
            let localOffset = 0;
            let centralSize = 0;
            function crc32(bytes) {
                let crc = 0xffffffff;
                for (let i = 0; i < bytes.length; i++) {
                    crc ^= bytes[i];
                    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
                }
                return (crc ^ 0xffffffff) >>> 0;
            }
            function putName(target, offset, name) { target.set(name, offset); }
            files.forEach(function (file) {
                let name = encoder.encode(file.name);
                let data = file.bytes;
                let checksum = crc32(data);
                let local = new Uint8Array(30 + name.length);
                let localView = new DataView(local.buffer);
                localView.setUint32(0, 0x04034b50, true);
                localView.setUint16(4, 20, true);
                localView.setUint16(6, 0x0800, true);
                localView.setUint16(8, 0, true);
                localView.setUint16(10, 0, true);
                localView.setUint16(12, 0x0021, true);
                localView.setUint32(14, checksum, true);
                localView.setUint32(18, data.length, true);
                localView.setUint32(22, data.length, true);
                localView.setUint16(26, name.length, true);
                localView.setUint16(28, 0, true);
                putName(local, 30, name);
                localParts.push(local, data);

                let central = new Uint8Array(46 + name.length);
                let centralView = new DataView(central.buffer);
                centralView.setUint32(0, 0x02014b50, true);
                centralView.setUint16(4, 20, true);
                centralView.setUint16(6, 20, true);
                centralView.setUint16(8, 0x0800, true);
                centralView.setUint16(10, 0, true);
                centralView.setUint16(12, 0, true);
                centralView.setUint16(14, 0x0021, true);
                centralView.setUint32(16, checksum, true);
                centralView.setUint32(20, data.length, true);
                centralView.setUint32(24, data.length, true);
                centralView.setUint16(28, name.length, true);
                centralView.setUint16(30, 0, true);
                centralView.setUint16(32, 0, true);
                centralView.setUint16(34, 0, true);
                centralView.setUint16(36, 0, true);
                centralView.setUint32(38, 0, true);
                centralView.setUint32(42, localOffset, true);
                putName(central, 46, name);
                centralParts.push(central);
                centralSize += central.length;
                localOffset += local.length + data.length;
            });
            let end = new Uint8Array(22);
            let endView = new DataView(end.buffer);
            endView.setUint32(0, 0x06054b50, true);
            endView.setUint16(4, 0, true);
            endView.setUint16(6, 0, true);
            endView.setUint16(8, files.length, true);
            endView.setUint16(10, files.length, true);
            endView.setUint32(12, centralSize, true);
            endView.setUint32(16, localOffset, true);
            endView.setUint16(20, 0, true);
            return new Blob([...localParts, ...centralParts, end], { type: 'application/zip' });
        }

        function decodeBase64File(encoded) {
            let binary = atob(encoded);
            let bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            return bytes;
        }

        // Download a ZIP with source files plus the current profile data embedded and readable as JSON.
        function downloadPermanentCopy() {
            savePortfolioData();
            let embeddedData = {
                permanentSnapshot: true,
                profileName: profileName,
                profileTagline: profileTagline,
                profileSections: profileSections,
                theme: document.body.classList.contains('dark-mode') ? 'dark' : 'light',
                profilePhoto: profilePhotoData || '',
                coverPhoto: coverPhotoData || ''
            };
            let safeJson = JSON.stringify(embeddedData, null, 2).replace(/</g, '\\u003c');
            let html = document.documentElement.outerHTML;
            let embeddedTag = '<script id="portfolioEmbeddedData" type="application/json">' + safeJson + '</script>';
            html = html.replace(/<script id="portfolioEmbeddedData" type="application\/json">[\s\S]*?<\/script>/, embeddedTag);
            let packageElement = document.getElementById('portfolioPackageAssets');
            let packageAssets = JSON.parse(packageElement ? packageElement.textContent || '{}' : '{}');
            let files = Object.keys(packageAssets).map(name => ({ name: name, bytes: decodeBase64File(packageAssets[name]) }));
            let encoder = new TextEncoder();
            files.push({ name: 'index.html', bytes: encoder.encode('<!DOCTYPE html>\n' + html) });
            files.push({ name: 'portfolio-data.json', bytes: encoder.encode(JSON.stringify(embeddedData, null, 2)) });
            files.push({ name: 'README.txt', bytes: encoder.encode('Portfolio source package\n\nOpen index.html in a browser to view the portfolio.\nYour saved profile, project details, and uploaded photos are in portfolio-data.json and are embedded in index.html inside the portfolioEmbeddedData block. The photos are embedded as image data, so no separate upload files are required.\nThe permanent snapshot takes priority over older browser-saved profile data. New edits are saved in the browser and restored after refresh.\nThe “Want more experience? Click Here” link at the bottom of Sticky Notes, Journal, and Reviewer opens personal-project/index.html, the page reserved for the personal HTML project. Replace that placeholder with your own project files.\nThe source files are included: style.css, script.js, the images folder, and personal-project/.\nTo add or adjust a photo in Home, About Me, My Skills, My Projects, Achievements, Future Goals, or Contact Me, open Menu and choose the matching Edit section. Choose an image, drag it in the crop window to reposition it, then use the Zoom slider or + / - buttons. Use Reposition / zoom beside an existing photo to adjust it again. Save profile changes in the browser; for a permanent ZIP, open Menu → Permanent copy → Make permanent (download ZIP). Detail/Description fields are multiline: press Enter for a new line and leave one blank line between paragraphs. The tab previews preserve line breaks and paragraph spacing. For each row, choose Original, Square (1:1), Landscape (3:2), or Portrait (2:3) for its photo. Automatic layout is applied to every profile section. A section with one card uses a full-row banner, and a section with two cards uses two equal columns. With three or more cards, short cards use three columns per row; long or multiline cards become full-row banners. After each banner, the remaining short cards continue in three-column rows, and the last row expands evenly when only one or two cards remain. On smaller screens the grid becomes narrower for readability. Banners put details on the left and a larger photo on the right; choose Top, Center, or Bottom for the image position. In the Card layout menu, choose Auto, Square card (1 column), 1.5 columns (half row), or Full-row banner for any individual detail. Move up / Move down can position a favorite banner between grid rows. Tab-photo frames follow the original portrait or landscape shape and show the full image at 100%. If an old saved crop already cut off part of the original, upload the uncropped original again.\n') });
            let file = createStoredZip(files);
            let url = URL.createObjectURL(file);
            let link = document.createElement('a'); link.href = url; link.download = 'portfolio-permanent.zip'; link.click();
            setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
            alert('Na-download ang portfolio-permanent.zip. I-unzip ito para makita ang index.html, style.css, script.js, images, at portfolio-data.json.');
        }

        initializeTheme();
        initializeHeaderScroll();
        loadSavedPhotos();
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
