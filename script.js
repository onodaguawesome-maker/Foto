let db;
let currentMedia = [];
let currentIndex = 0;
let currentFilter = 'all';
let albums = [];

const DB_NAME = 'MediaGalleryDB';
const MEDIA_STORE = 'media';
const ALBUM_STORE = 'albums';

// DB Setup
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        request.onupgradeneeded = (e) => {
            db = e.target.result;
            if (!db.objectStoreNames.contains(MEDIA_STORE)) {
                const store = db.createObjectStore(MEDIA_STORE, { keyPath: 'id', autoIncrement: true });
                store.createIndex('type', 'type');
                store.createIndex('favorite', 'favorite');
            }
            if (!db.objectStoreNames.contains(ALBUM_STORE)) {
                db.createObjectStore(ALBUM_STORE, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

// Storage permission request
async function requestStorage() {
    try {
        await initDB();
        if (navigator.storage && navigator.storage.persist) {
            const persisted = await navigator.storage.persist();
            if (!persisted) document.getElementById('permissionBanner').style.display = 'block';
        }
        loadAlbums();
        loadMedia();
    } catch (err) {
        document.getElementById('permissionBanner').style.display = 'block';
    }
}

// Media CRUD
async function addMedia(file) {
    const reader = new FileReader();
    return new Promise((resolve) => {
        reader.onload = (e) => {
            const tx = db.transaction([MEDIA_STORE], 'readwrite');
            tx.objectStore(MEDIA_STORE).add({
                data: e.target.result,
                name: file.name,
                type: file.type.startsWith('video')? 'video' : 'image',
                date: new Date().toISOString(),
                favorite: false,
                albums: []
            }).onsuccess = resolve;
        };
        reader.readAsDataURL(file);
    });
}

async function getAllMedia() {
    return new Promise((resolve) => {
        const tx = db.transaction([MEDIA_STORE], 'readonly');
        tx.objectStore(MEDIA_STORE).getAll().onsuccess = (e) => resolve(e.target.result);
    });
}

async function updateMedia(id, updates) {
    return new Promise((resolve) => {
        const tx = db.transaction([MEDIA_STORE], 'readwrite');
        const store = tx.objectStore(MEDIA_STORE);
        store.get(id).onsuccess = (e) => {
            const data = {...e.target.result,...updates };
            store.put(data).onsuccess = resolve;
        };
    });
}

async function deleteMedia(id) {
    return new Promise((resolve) => {
        const tx = db.transaction([MEDIA_STORE], 'readwrite');
        tx.objectStore(MEDIA_STORE).delete(id).onsuccess = resolve;
    });
}

// Albums
async function createAlbum(name) {
    return new Promise((resolve) => {
        const tx = db.transaction([ALBUM_STORE], 'readwrite');
        tx.objectStore(ALBUM_STORE).add({ name, date: new Date().toISOString() }).onsuccess = resolve;
    });
}

async function getAllAlbums() {
    return new Promise((resolve) => {
        const tx = db.transaction([ALBUM_STORE], 'readonly');
        tx.objectStore(ALBUM_STORE).getAll().onsuccess = (e) => resolve(e.target.result);
    });
}

// UI Elements
const gallery = document.getElementById('gallery');
const fileInput = document.getElementById('fileInput');
const emptyState = document.getElementById('emptyState');
const lightbox = document.getElementById('lightbox');
const mediaContainer = document.getElementById('mediaContainer');
const videoControls = document.getElementById('videoControls');

// Load and render
async function loadMedia() {
    let allMedia = await getAllMedia();

    if (currentFilter === 'favorites') {
        allMedia = allMedia.filter(m => m.favorite);
    } else if (currentFilter === 'images') {
        allMedia = allMedia.filter(m => m.type === 'image');
    } else if (currentFilter === 'videos') {
        allMedia = allMedia.filter(m => m.type === 'video');
    } else if (currentFilter.startsWith('album-')) {
        const albumId = parseInt(currentFilter.split('-')[1]);
        allMedia = allMedia.filter(m => m.albums.includes(albumId));
    }

    currentMedia = allMedia.reverse();
    renderGallery();
}

async function loadAlbums() {
    albums = await getAllAlbums();
    const albumList = document.getElementById('albumList');
    albumList.innerHTML = albums.map(a =>
        `<div class="dropdown-item" data-album="${a.id}">${a.name}</div>`
    ).join('');
}

function renderGallery() {
    gallery.innerHTML = '';

    if (currentMedia.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    emptyState.style.display = 'none';

    currentMedia.forEach((media, idx) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';

        const mediaEl = media.type === 'video'
           ? `<video src="${media.data}" muted></video><div class="video-badge">▶</div>`
            : `<img src="${media.data}" alt="${media.name}">`;

        item.innerHTML = `
            ${mediaEl}
            ${media.favorite? '<div class="favorite-badge">❤</div>' : ''}
            <div class="item-overlay"></div>
        `;

        item.onclick = () => openLightbox(idx);
        gallery.appendChild(item);
    });
}

// Lightbox
function openLightbox(idx) {
    currentIndex = idx;
    updateLightbox();
    lightbox.classList.add('active');
}

function updateLightbox() {
    const media = currentMedia[currentIndex];
    const isVideo = media.type === 'video';

    mediaContainer.innerHTML = isVideo
       ? `<video id="lightboxVideo" src="${media.data}" autoplay></video>`
        : `<img src="${media.data}" alt="${media.name}">`;

    videoControls.classList.toggle('active', isVideo);
    document.getElementById('favoriteBtn').textContent = media.favorite? '❤ Favorited' : '♡ Favorite';

    if (isVideo) setupVideoControls();
}

function setupVideoControls() {
    const video = document.getElementById('lightboxVideo');
    const playBtn = document.getElementById('playPauseBtn');
    const seekBar = document.getElementById('seekBar');
    const timeDisplay = document.getElementById('timeDisplay');
    const brightness = document.getElementById('brightness');

    playBtn.onclick = () => {
        if (video.paused) {
            video.play();
            playBtn.textContent = '⏸';
        } else {
            video.pause();
            playBtn.textContent = '▶';
        }
    };

    video.ontimeupdate = () => {
        seekBar.value = (video.currentTime / video.duration) * 100 || 0;
        timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
    };

    seekBar.oninput = () => {
        video.currentTime = (seekBar.value / 100) * video.duration;
    };

    brightness.oninput = () => {
        video.style.filter = `brightness(${brightness.value}%)`;
    };
}

function formatTime(s) {
    if (isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

function nextMedia() {
    currentIndex = (currentIndex + 1) % currentMedia.length;
    updateLightbox();
}

function prevMedia() {
    currentIndex = (currentIndex - 1 + currentMedia.length) % currentMedia.length;
    updateLightbox();
}

// Share API
async function shareMedia() {
    const media = currentMedia[currentIndex];
    try {
        const res = await fetch(media.data);
        const blob = await res.blob();
        const file = new File([blob], media.name, { type: blob.type });

        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: media.name
            });
        } else {
            // Fallback: download
            const a = document.createElement('a');
            a.href = media.data;
            a.download = media.name;
            a.click();
        }
    } catch (err) {
        alert('Sharing not supported. Image saved to downloads instead.');
    }
}

// Event Listeners
document.getElementById('addBtn').onclick = () => fileInput.click();
fileInput.onchange = async (e) => {
    for (const file of e.target.files) await addMedia(file);
    fileInput.value = '';
    loadMedia();
};

document.getElementById('newAlbumBtn').onclick = () => {
    document.getElementById('albumModal').classList.add('active');
};

document.getElementById('cancelAlbum').onclick = () => {
    document.getElementById('albumModal').classList.remove('active');
};

document.getElementById('saveAlbum').onclick = async () => {
    const name = document.getElementById('albumNameInput').value.trim();
    if (name) {
        await createAlbum(name);
        document.getElementById('albumNameInput').value = '';
        document.getElementById('albumModal').classList.remove('active');
        loadAlbums();
    }
};

document.querySelectorAll('.tab').forEach(tab => {
    tab.onclick = () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        loadMedia();
    };
});

document.getElementById('albumList').onclick = (e) => {
    if (e.target.classList.contains('dropdown-item')) {
        currentFilter = `album-${e.target.dataset.album}`;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.getElementById('albumTab').classList.add('active');
        loadMedia();
    }
};

document.getElementById('lightboxClose').onclick = () => lightbox.classList.remove('active');
document.getElementById('nextBtn').onclick = nextMedia;
document.getElementById('prevBtn').onclick = prevMedia;

document.getElementById('favoriteBtn').onclick = async () => {
    const media = currentMedia[currentIndex];
    await updateMedia(media.id, { favorite:!media.favorite });
    currentMedia[currentIndex].favorite =!media.favorite;
    updateLightbox();
    renderGallery();
};

document.getElementById('deleteBtn').onclick = async () => {
    if (confirm('Delete this media?')) {
        await deleteMedia(currentMedia[currentIndex].id);
        lightbox.classList.remove('active');
        loadMedia();
    }
};

document.getElementById('shareBtn').onclick = shareMedia;

document.getElementById('albumAddBtn').onclick = async () => {
    const albumName = prompt(`Add to which album?\n${albums.map((a,i) => `${i+1}. ${a.name}`).join('\n')}\n\nEnter album number:`);
    const idx = parseInt(albumName) - 1;
    if (albums[idx]) {
        const media = currentMedia[currentIndex];
        const albumList = media.albums || [];
        if (!albumList.includes(albums[idx].id)) {
            albumList.push(albums[idx].id);
            await updateMedia(media.id, { albums: albumList });
            alert(`Added to ${albums[idx].name}`);
        }
    }
};

// Init
requestStorage();
