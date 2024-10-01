// Motion.js
import {gsap} from "gsap";
import Lenis from "@studio-freight/lenis";

export class Motion {
    constructor(container) {
        this.container = container;
        this.elements = {
            showCreditsBtn: this.container.querySelector('#showCreditsBtn'),
            creditsWrapper: this.container.querySelector('.motion-credits-wrapper'),
            hideCreditsBtn: this.container.querySelector('#hideCreditsBtn'),
            video: this.container.querySelector('#mainVideo'),
            playBtn: this.container.querySelector('#playBtn'),
            soundBtn: this.container.querySelector('#soundBtn'),
            soundLines: [...this.container.querySelectorAll('.sound-line')],
            nextLinksContainer: document.querySelectorAll('.next-link'),
            nextLink: this.container.querySelector('.motion-next-wrapper'),
            nextVideo: this.container.querySelector('#nextVideo'),
            prevLink: this.container.querySelector('.motion-prev-wrapper'),
            prevVideo: this.container.querySelector('#prevVideo'),
            iconNext: this.container.querySelector('.controls-icon.next'),
            iconPrev: this.container.querySelector('.controls-icon.prev'),
            fullscreenBtn: this.container.querySelector('.fullscreen'),
            workDurationWrapper: this.container.querySelector('.work-duration-wrapper'),
            lottieWrapper: this.container.querySelector('.lottie-wrapper'),
            mask: this.container.querySelector('.mask-alt')
        };
        this.videoThumbnails = [];
        this.progressMarker = null;
        this.progressTrail = null;
        this.links = Array.from(this.elements.nextLinksContainer).map(link => link.getAttribute('href'));
        this.init();
    }

    async init() {
        await this.loadVideo();
        this.setupCredits();
        this.setupSoundAnimation();
        this.setupControls();
        this.setupNextPrev();
        this.setupTimeline();
        this.showVideo();
        this.addEventListeners();
    }

    loadVideo() {
        return new Promise((resolve) => {
            if (this.elements.video.readyState >= 2) {
                resolve();
            } else {
                const onLoadedData = () => {
                    this.elements.video.removeEventListener('loadeddata', onLoadedData);
                    resolve();
                };
                this.elements.video.addEventListener('loadeddata', onLoadedData);
                this.elements.video.src = this.elements.video.src;
            }
        });
    }

    setupCredits() {
        this.creditsTl = gsap.timeline({paused: true});
        this.creditsTl.to(this.elements.creditsWrapper, {
            clipPath: 'inset(0% 0% 0% 0%)',
            ease: 'expo.out',
            duration: 1
        });
    }

    setupSoundAnimation() {
        gsap.set(this.elements.soundLines, {transformOrigin: "bottom center"});
        this.tlSoundLines = gsap.timeline({repeat: -1, yoyo: true, paused: true});
        this.elements.soundLines.forEach((line, index) => {
            this.tlSoundLines.to(line, {
                scaleY: gsap.utils.random(0.3, 0.7),
                duration: 0.4,
                ease: "power1.inOut"
            }, index * 0.2);
        });
    }

    setupControls() {
        // Implemented in handleContainerClick
    }

    setupNextPrev() {
        const {previous, next} = this.findAdjacentLinks(window.location.pathname, this.links);
        this.setupLink(next, this.elements.nextLink, this.elements.iconNext, this.elements.nextVideo);
        this.setupLink(previous, this.elements.prevLink, this.elements.iconPrev, this.elements.prevVideo);

        this.tlNext = gsap.timeline({paused: true});
        this.tlNext.to(this.elements.nextLink, {clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5})
            .fromTo('.mask', {opacity: 0}, {opacity: 1, duration: 0.5}, "<");

        this.tlPrev = gsap.timeline({paused: true});
        this.tlPrev.to(this.elements.prevLink, {clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5})
            .fromTo('.mask', {opacity: 0}, {opacity: 1, duration: 0.5}, "<");
    }

    setupLink(link, linkElement, iconElement, videoElement) {
        if (link) {
            linkElement.href = link;
            iconElement.href = link;
            const linkContainer = this.elements.nextLinksContainer[this.links.indexOf(link)];
            const videoLinkElement = linkContainer.querySelector('.video-link');
            if (videoLinkElement && videoElement) {
                videoElement.src = videoLinkElement.textContent.trim();
            }
        }
    }

    findAdjacentLinks(url, links) {
        const index = links.indexOf(url);
        if (index === -1) return {previous: null, next: null};
        const previous = index === 0 ? links[links.length - 1] : links[index - 1];
        const next = index === links.length - 1 ? links[0] : links[index + 1];
        return {previous, next};
    }

    setupTimeline() {
        this.generateTimeline();
        this.setupTimelineNavigation();
        this.generateThumbnails();
        this.addTimelineHoverEffects();
        this.createProgressMarker();
        this.setupProgressUpdate();
    }

    generateTimeline() {
        const duration = this.elements.video.duration;
        const majorInterval = duration <= 30 ? 2 : duration <= 60 ? 5 : duration <= 300 ? 20 : 60;
        const minorCount = Math.min(5, majorInterval);
        const minorInterval = majorInterval / minorCount;

        const fragment = document.createDocumentFragment();
        const linesContainer = document.createElement('div');
        linesContainer.className = 'timeline-lines';
        const thumbnailsContainer = document.createElement('div');
        thumbnailsContainer.className = 'timeline-thumbnails';

        for (let time = 0; time <= duration; time += minorInterval) {
            const minorLine = document.createElement('div');
            minorLine.className = 'timeline-minor-line';
            minorLine.style.left = `${(time / duration) * 100}%`;
            linesContainer.appendChild(minorLine);

            const thumbnail = document.createElement('div');
            thumbnail.className = 'video-thumbnail';
            thumbnail.style.left = `${(time / duration) * 100}%`;
            thumbnailsContainer.appendChild(thumbnail);
            this.videoThumbnails.push(thumbnail);

            if (time % majorInterval < 0.001 || time === duration) {
                const majorLine = document.createElement('div');
                majorLine.className = 'timeline-major-line';
                majorLine.style.left = `${(time / duration) * 100}%`;
                linesContainer.appendChild(majorLine);

                const timeLabel = document.createElement('span');
                timeLabel.className = 'time-label';
                timeLabel.textContent = this.formatTime(time);
                timeLabel.style.left = `${(time / duration) * 100}%`;
                linesContainer.appendChild(timeLabel);
            }
        }

        fragment.appendChild(linesContainer);
        fragment.appendChild(thumbnailsContainer);
        this.elements.workDurationWrapper.appendChild(fragment);
    }

    setupTimelineNavigation() {
        this.elements.workDurationWrapper.addEventListener('click', (event) => {
            const rect = this.elements.workDurationWrapper.getBoundingClientRect();
            const clickPosition = event.clientX - rect.left;
            const percentageClicked = clickPosition / rect.width;
            const newTime = this.elements.video.duration * percentageClicked;
            this.elements.video.currentTime = newTime;
            if (this.elements.video.paused) {
                this.playVideo();
            }
        });
    }

    generateThumbnails() {
        if (window.Worker) {
            const worker = new Worker('/thumbnailWorker.js');
            worker.postMessage({
                videoSrc: this.elements.video.src,
                duration: this.elements.video.duration,
                thumbnailCount: this.videoThumbnails.length
            });
            worker.onmessage = (e) => {
                this.applyThumbnails(e.data);
            };
        } else {
            // Fallback to synchronous thumbnail generation
            this.generateThumbnailsSynchronously();
        }
    }

    generateThumbnailsSynchronously() {
        const duration = this.elements.video.duration;
        const thumbnailCount = this.videoThumbnails.length;
        const thumbnailInterval = duration / thumbnailCount;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 160;
        canvas.height = 90;

        const thumbnails = [];

        for (let i = 0; i < thumbnailCount; i++) {
            const time = i * thumbnailInterval;
            const thumbnail = this.captureVideoFrame(time, canvas, ctx);
            thumbnails.push({
                dataUrl: thumbnail,
                startTime: time,
                endTime: Math.min(time + thumbnailInterval, duration)
            });
        }

        this.applyThumbnails(thumbnails);
    }

    captureVideoFrame(time, canvas, ctx) {
        this.elements.video.currentTime = time;
        ctx.drawImage(this.elements.video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg');
    }

    applyThumbnails(thumbnails) {
        thumbnails.forEach((thumbnail, index) => {
            const thumbnailElement = this.videoThumbnails[index];
            thumbnailElement.style.backgroundImage = `url(${thumbnail.dataUrl})`;
            thumbnailElement.dataset.startTime = thumbnail.startTime;
            thumbnailElement.dataset.endTime = thumbnail.endTime;
        });
    }

    addTimelineHoverEffects() {
        this.elements.workDurationWrapper.addEventListener('mouseenter', () => {
            gsap.to('.timeline-major-line', {height: '20px', duration: 0.3});
            gsap.to('.timeline-minor-line', {height: '15px', duration: 0.3});
            gsap.to('.video-thumbnail', {opacity: 1, duration: 0.3, delay: 0.1});
            gsap.from('.video-thumbnail', {clipPath: 'inset(100% 0% 0% 0%)', duration: 0.75, delay: 0.1});
        });

        this.elements.workDurationWrapper.addEventListener('mouseleave', () => {
            gsap.to('.timeline-major-line', {height: '15px', duration: 0.3, delay: 0.35});
            gsap.to('.timeline-minor-line', {height: '10px', duration: 0.3, delay: 0.35});
            gsap.to('.video-thumbnail', {opacity: 0, duration: 0.3});
            gsap.to('.video-thumbnail', {clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75});
        });
    }

    createProgressMarker() {
        this.progressTrail = document.createElement('div');
        this.progressTrail.className = 'progress-trail';
        this.elements.workDurationWrapper.appendChild(this.progressTrail);

        this.progressMarker = document.createElement('div');
        this.progressMarker.className = 'progress-marker';
        this.elements.workDurationWrapper.appendChild(this.progressMarker);

        const style = document.createElement('style');
        style.textContent = `
            .progress-trail {
                position: absolute;
                height: 4px;
                background: linear-gradient(to right, #3498db, #D9D9D9);
                bottom: 0;
                left: 0;
                transform-origin: left;
                transform: scaleX(0);
            }
            .progress-marker {
                position: absolute;
                width: 0.5rem;
                height: 0.5rem;
                border-radius: 50%;
                background-color: #D9D9D9;
                box-shadow: 0 0 10px #D9D9D9, 0 0 20px #D9D9D9;
                bottom: -4px;
                transform: translateX(-50%);
                z-index: 10;
            }
        `;
        document.head.appendChild(style);
    }

    setupProgressUpdate() {
        this.elements.video.addEventListener('timeupdate', () => {
            const progress = this.elements.video.currentTime / this.elements.video.duration;
            this.updateProgressMarker(progress);
        });
    }

    updateProgressMarker(progress) {
        const markerPosition = this.elements.workDurationWrapper.offsetWidth * progress;
        gsap.to(this.progressMarker, {
            left: markerPosition,
            duration: 0.5,
            ease: 'ease.out'
        });
        gsap.to(this.progressTrail, {
            scaleX: progress,
            duration: 0.5,
            ease: 'ease.out'
        });
    }

    showVideo() {
        this.elements.video.currentTime = 0;
        gsap.to(this.elements.video, {opacity: 1, duration: 0.65});
        gsap.to([this.elements.lottieWrapper, this.elements.mask], {opacity: 0, display: 'none', duration: 0.6});
        if (!this.elements.video.paused) {
            gsap.to('.pause', {fillOpacity: 1, duration: 0.75});
            gsap.to('.play', {fillOpacity: 0, duration: 0.75});
        }
    }

    addEventListeners() {
        this.container.addEventListener('click', this.handleContainerClick.bind(this));
        window.addEventListener('resize', this.debounce(this.updatePaths.bind(this), 250));

        const observer = new IntersectionObserver(this.handleIntersection.bind(this), {threshold: 0.1});
        this.videoThumbnails.forEach(thumbnail => observer.observe(thumbnail));

        this.elements.iconNext.addEventListener('mouseenter', () => this.tlNext.play());
        this.elements.iconNext.addEventListener('mouseleave', () => this.tlNext.reverse());
        this.elements.iconPrev.addEventListener('mouseenter', () => this.tlPrev.play());
        this.elements.iconPrev.addEventListener('mouseleave', () => this.tlPrev.reverse());
    }

    handleContainerClick(event) {
        const target = event.target;
        if (target.id === 'showCreditsBtn') {
            this.creditsTl.play();
        } else if (target.id === 'hideCreditsBtn') {
            this.creditsTl.reverse();
        } else if (target.id === 'soundBtn') {
            this.toggleSound();
        } else if (target.id === 'playBtn') {
            this.togglePlay();
        } else if (target.classList.contains('fullscreen')) {
            this.toggleFullscreen();
        }
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                gsap.to(entry.target, {opacity: 1, duration: 0.3});
            } else {
                gsap.to(entry.target, {opacity: 0, duration: 0.3});
            }
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    toggleSound() {
        if (this.elements.video.muted) {
            this.unmuteVideo();
        } else {
            this.muteVideo();
        }
        this.checkSoundLinesAnimation();
    }

    togglePlay() {
        if (this.elements.video.paused) {
            this.playVideo();
        } else {
            this.pauseVideo();
        }
        this.checkSoundLinesAnimation();
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            if (this.elements.video.requestFullscreen) {
                this.elements.video.requestFullscreen();
            } else if (this.elements.video.mozRequestFullScreen) {
                this.elements.video.mozRequestFullScreen();
            } else if (this.elements.video.webkitRequestFullscreen) {
                this.elements.video.webkitRequestFullscreen();
            } else if (this.elements.video.msRequestFullscreen) {
                this.elements.video.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    muteVideo() {
        this.elements.video.muted = true;
        gsap.to('.mute', {clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75});
    }

    unmuteVideo() {
        this.elements.video.muted = false;
        gsap.to('.mute', {clipPath: 'inset(100% 0% 0% 0%)', duration: 0.75});
    }

    playVideo() {
        this.elements.video.play();
        gsap.to('.pause', {fillOpacity: 1, duration: 0.75});
        gsap.to('.play', {fillOpacity: 0, duration: 0.75});
    }

    pauseVideo() {
        this.elements.video.pause();
        gsap.to('.pause', {fillOpacity: 0, duration: 0.75});
        gsap.to('.play', {fillOpacity: 1, duration: 0.75});
    }

    checkSoundLinesAnimation() {
        if (!this.elements.video.muted && !this.elements.video.paused) {
            this.tlSoundLines.play();
        } else {
            this.tlSoundLines.pause();
            gsap.to(this.elements.soundLines, {scaleY: 1, duration: 0.1});
        }
    }

    updatePaths() {
        const rects = document.querySelectorAll('.embed.credits rect');
        rects.forEach(rect => {
            rect.style.strokeDasharray = `${remToPx(1.25)}px ${remToPx(0.625)}px ${remToPx(1.25)}px ${remToPx(5)}px`;
            rect.style.strokeDashoffset = `${remToPx(2.5)}px`;
            rect.style.strokeWidth = `${remToPx(0.0625)}px`;
        });

        const rects2 = document.querySelectorAll('.embed.hide-c rect');
        rects2.forEach(rect => {
            rect.style.strokeDasharray = `${remToPx(1)}px ${remToPx(0.5)}px ${remToPx(1)}px ${remToPx(4)}px`;
            rect.style.strokeDashoffset = `${remToPx(2)}px`;
            rect.style.strokeWidth = `${remToPx(0.0625)}px`;
        });
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

function remToPx(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

