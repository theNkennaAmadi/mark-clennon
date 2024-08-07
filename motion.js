import gsap from "gsap";
import { generateVideoThumbnails } from "@rajesh896/video-thumbnails-generator";

export class Motion{
    constructor(container) {
        this.container = container
        this.showCreditsBtn = this.container.querySelector('#showCreditsBtn')
        this.creditsWrapper = this.container.querySelector('.motion-credits-wrapper')
        this.hideCreditsBtn = this.container.querySelector('#hideCreditsBtn')
        this.video = this.container.querySelector('#mainVideo')
        this.playBtn = this.container.querySelector('#playBtn')
        this.soundBtn = this.container.querySelector('#soundBtn')
        this.soundLines = [...this.container.querySelectorAll('.sound-line')];
        this.nextLinksContainer = document.querySelectorAll('.next-link');
        this.links = Array.from(this.nextLinksContainer).map(link => link.getAttribute('href'));
        this.nextLink = this.container.querySelector('.motion-next-wrapper')
        this.nextVideo = this.container.querySelector('#nextVideo')
        this.prevLink = this.container.querySelector('.motion-prev-wrapper')
        this.prevVideo = this.container.querySelector('#prevVideo')
        this.iconNext = this.container.querySelector('.controls-icon.next')
        this.iconPrev = this.container.querySelector('.controls-icon.prev')
        this.fullscreenBtn = this.container.querySelector('.fullscreen')
        this.workDurationWrapper = this.container.querySelector('.work-duration-wrapper')
        this.videoThumbnails = []
        this.timelineInterval = 4 // seconds between major lines
        this.init()
    }

    loadVideo() {
        return new Promise((resolve) => {
            if (this.video.readyState >= 2) {
                resolve();
            } else {
                this.video.addEventListener('loadeddata', function onLoadedData() {
                    this.video.removeEventListener('loadeddata', onLoadedData);
                    resolve();
                }.bind(this));
                this.video.src = this.video.src; // Trigger loading if not already loaded
            }
        });
    }


    async init(){
        await this.loadVideo();
        this.toggleCredits()
        this.animateSoundIcons()
        this.toggleControls()
        this.setUpNextPrev()
        this.nextUpTimelines()


        this.generateTimeline();
        this.setupTimelineNavigation()
        await this.generateThumbnails();
        this.addTimelineHoverEffects();
        // Show the video after everything is ready
        this.showVideo();
    }

    toggleCredits(){
        this.creditsTl = gsap.timeline({paused: true})
        this.creditsTl.to(this.creditsWrapper, {clipPath: 'inset(0% 0% 0% 0%)', ease: 'expo.out', duration: 1})

        this.showCreditsBtn.addEventListener('click', () => {
            this.creditsTl.play()
        })

        this.hideCreditsBtn.addEventListener('click', () => {
            this.creditsTl.reverse()
        })
    }

    muteVideo(){
        this.video.muted = true
        gsap.to('.mute', {clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75})
    }

    unmuteVideo(){
        this.video.muted = false
        gsap.to('.mute', {clipPath: 'inset(100% 0% 0% 0%)', duration: 0.75})
    }

    playVideo(){
        this.video.play()
        gsap.to('.pause', {fillOpacity: 1, duration: 0.75})
        gsap.to('.play', {fillOpacity: 0, duration: 0.75})
    }

    pauseVideo(){
        this.video.pause()
        gsap.to('.pause', {fillOpacity: 0, duration: 0.75})
        gsap.to('.play', {fillOpacity: 1, duration: 0.75})
    }

    animateSoundIcons(){
        // Set the transform origin to the bottom center for all sound lines
        gsap.set(this.soundLines, {transformOrigin: "bottom center"});

        // Create a timeline
        this.tlSoundLines = gsap.timeline({repeat: -1, yoyo: true, paused: true});

        // Animate each sound line
        this.soundLines.forEach((line, index) => {
            this.tlSoundLines.to(line, {
                scaleY: gsap.utils.random(0.3, 0.7), // Random scale between 0.3 and 1
                duration: 0.4,
                ease: "power1.inOut"
            }, index * 0.2); // Stagger the animations
        });
    }

    checkSoundLinesAnimation() {
        if (!this.video.muted && !this.video.paused) {
            this.tlSoundLines.play();
        } else {
            this.tlSoundLines.pause();
            gsap.to(this.soundLines, { scaleY: 1, duration: 0.1 });
        }
    }

    nextUpTimelines(){
        this.tlNext = gsap.timeline({paused: true});
        this.tlNext.to(this.nextLink, {clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5})
            //.to('.motion-visual', {width: '50%', justifySelf: 'start', duration: 0.5,}, "<")
            .fromTo('.mask',{opacity: 0},  {opacity: 1, duration: 0.5,}, "<")

        this.tlPrev = gsap.timeline({paused: true});
        this.tlPrev.to(this.prevLink, {clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5})
            .fromTo('.mask',{opacity: 0}, {opacity: 1, duration: 0.5,}, "<")
            //.to('.motion-visual', {width: '50%', justifySelf: 'end', duration: 0.5}, "<")
    }

    toggleControls() {
        this.soundBtn.addEventListener('click', () => {
            this.video.muted ? this.unmuteVideo() : this.muteVideo();
            this.checkSoundLinesAnimation();
        });

        this.playBtn.addEventListener('click', () => {
            this.video.paused ? this.playVideo() : this.pauseVideo();
            this.checkSoundLinesAnimation();
        });

        this.video.addEventListener('play', () => {
            this.checkSoundLinesAnimation();
        });

        this.video.addEventListener('pause', () => {
            this.checkSoundLinesAnimation();
        });

        this.fullscreenBtn.addEventListener('click',()=> {
            if (this.video.requestFullscreen) {
                this.video.requestFullscreen();
            } else if (this.video.mozRequestFullScreen) { // Firefox
                this.video.mozRequestFullScreen();
            } else if (this.video.webkitRequestFullscreen) { // Chrome, Safari and Opera
                this.video.webkitRequestFullscreen();
            } else if (this.video.msRequestFullscreen) { // IE/Edge
                this.video.msRequestFullscreen();
            }
        });
    }

    findAdjacentLinks(url, links) {
        const index = links.indexOf(url);

        if (index === -1) {
            return { previous: null, next: null };
        }

        const previous = index === 0 ? links[links.length - 1] : links[index - 1];
        const next = index === links.length - 1 ? links[0] : links[index + 1];

        return { previous, next };
    }

    setUpNextPrev(){
        const result = this.findAdjacentLinks(window.location.pathname, this.links);
        if (result.next) {
            this.nextLink.href = result.next;
            this.iconNext.href = result.next;
            const nextLinkElement = this.nextLinksContainer[this.links.indexOf(result.next)];
            const nextVideoLinkElement = nextLinkElement.querySelector('.video-link');
            if (nextVideoLinkElement && this.nextVideo) {
                this.nextVideo.src = nextVideoLinkElement.textContent.trim();
            }
        }

        if (result.previous) {
            this.prevLink.href = result.previous;
            this.iconPrev.href = result.previous;
            const prevLinkElement = this.nextLinksContainer[this.links.indexOf(result.previous)];
            const prevVideoLinkElement = prevLinkElement.querySelector('.video-link');
            if (prevVideoLinkElement && this.prevVideo) {
                this.prevVideo.src = prevVideoLinkElement.textContent.trim();
            }
        }

        this.iconNext.addEventListener('mouseenter', () => {
            this.tlNext.play();
        });
        this.iconNext.addEventListener('mouseleave', () => {
            this.tlNext.reverse();
        });

        this.iconPrev.addEventListener('mouseenter', () => {
            this.tlPrev.play();
        });

        this.iconPrev.addEventListener('mouseleave', () => {
            this.tlPrev.reverse();
        });
    }

    generateTimeline() {
        const duration = this.video.duration;
        console.log(duration);

        // Determine the ideal interval for major lines
        let majorInterval;
        if (duration <= 30) {
            majorInterval = 2; // For short videos, major lines every 5 seconds
        } else if (duration <= 60) {
            majorInterval = 5; // For medium videos, major lines every 10 seconds
        } else if (duration <= 300) {
            majorInterval = 20; // For longer videos, major lines every 30 seconds
        } else {
            majorInterval = 60; // For very long videos, major lines every 60 seconds
        }

        // Calculate the number of segments between major lines (at most 5)
        const minorCount = Math.min(5, majorInterval);
        const minorInterval = majorInterval / minorCount;

        // Clear existing content
        this.workDurationWrapper.innerHTML = '';

        // Create container for lines
        const linesContainer = document.createElement('div');
        linesContainer.className = 'timeline-lines';
        this.workDurationWrapper.appendChild(linesContainer);

        // Create container for thumbnails
        const thumbnailsContainer = document.createElement('div');
        thumbnailsContainer.className = 'timeline-thumbnails';
        this.workDurationWrapper.appendChild(thumbnailsContainer);

        for (let time = 0; time <= duration; time += minorInterval) {
            // Create minor line
            const minorLine = document.createElement('div');
            minorLine.className = 'timeline-minor-line';
            minorLine.style.left = `${(time / duration) * 100}%`;
            linesContainer.appendChild(minorLine);

            // Create thumbnail container
            const thumbnail = document.createElement('div');
            thumbnail.className = 'video-thumbnail';
            thumbnail.style.left = `${(time / duration) * 100}%`;
            thumbnailsContainer.appendChild(thumbnail);
            this.videoThumbnails.push(thumbnail);

            // Add major line and time label for major intervals
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
    }

    setupTimelineNavigation() {
        this.workDurationWrapper.addEventListener('click', (event) => {
            const rect = this.workDurationWrapper.getBoundingClientRect();
            const clickPosition = event.clientX - rect.left;
            const percentageClicked = clickPosition / rect.width;
            const newTime = this.video.duration * percentageClicked;

            this.video.currentTime = newTime;

            // If the video is paused, you might want to start playing it
            if (this.video.paused) {
                this.playVideo();
            }
        });
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    showVideo() {
        gsap.to(this.video, { opacity: 1, duration: 0.5 });
    }

    async generateThumbnails() {
        const duration = this.video.duration;
        const thumbnailCount = this.videoThumbnails.length;
        const thumbnailInterval = duration / thumbnailCount;

        // Check if thumbnails already exist in session storage
        const existingThumbnails = this.getThumbnailsFromSessionStorage();
        if (existingThumbnails) {
            this.applyThumbnails(existingThumbnails);
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 160;
        canvas.height = 90;

        const thumbnails = [];

        for (let i = 0; i < thumbnailCount; i++) {
            const time = i * thumbnailInterval;
            const thumbnail = await this.captureVideoFrame(time, canvas, ctx);

            thumbnails.push({
                dataUrl: thumbnail,
                startTime: time,
                endTime: Math.min(time + thumbnailInterval, duration)
            });
        }

        // Store thumbnails in session storage
        this.storeThumbnailsInSessionStorage(thumbnails);

        // Apply thumbnails to the DOM
        this.applyThumbnails(thumbnails);
    }

    getThumbnailsFromSessionStorage() {
        const videoSrc = this.video.src;
        const storedThumbnails = sessionStorage.getItem(`thumbnails_${videoSrc}`);
        return storedThumbnails ? JSON.parse(storedThumbnails) : null;
    }

    storeThumbnailsInSessionStorage(thumbnails) {
        const videoSrc = this.video.src;
        sessionStorage.setItem(`thumbnails_${videoSrc}`, JSON.stringify(thumbnails));
    }

    applyThumbnails(thumbnails) {
        thumbnails.forEach((thumbnail, index) => {
            const thumbnailElement = this.videoThumbnails[index];
            thumbnailElement.style.backgroundImage = `url(${thumbnail.dataUrl})`;
            thumbnailElement.dataset.startTime = thumbnail.startTime;
            thumbnailElement.dataset.endTime = thumbnail.endTime;
        });
    }

    captureVideoFrame(time, canvas, ctx) {
        return new Promise((resolve) => {
            this.video.currentTime = time;
            this.video.onseeked = () => {
                ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg'));
            };
        });
    }


    addTimelineHoverEffects() {
        this.workDurationWrapper.addEventListener('mouseenter', () => {
            gsap.to('.timeline-major-line', {height: '20px', duration: 0.3});
            gsap.to('.timeline-minor-line', {height: '15px', duration: 0.3});
            gsap.to('.video-thumbnail', {opacity: 1, duration: 0.3, delay: 0.1});
            gsap.from('.video-thumbnail', {clipPath: 'inset(100% 0% 0% 0%)', duration: 0.75, delay: 0.1});
        });

        this.workDurationWrapper.addEventListener('mouseleave', () => {
            gsap.to('.timeline-major-line', {height: '15px', duration: 0.3, delay: 0.35});
            gsap.to('.timeline-minor-line', {height: '10px', duration: 0.3, delay: 0.35});
            gsap.to('.video-thumbnail', {opacity: 0, duration: 0.3});
            gsap.to('.video-thumbnail', {clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75});
        });
    }

}