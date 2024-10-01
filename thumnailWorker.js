// thumbnailWorker.js
self.onmessage = function(e) {
    const { videoSrc, duration, thumbnailCount } = e.data;
    const thumbnailInterval = duration / thumbnailCount;

    const video = document.createElement('video');
    video.src = videoSrc;
    video.crossOrigin = 'anonymous';

    const canvas = new OffscreenCanvas(160, 90);
    const ctx = canvas.getContext('2d');

    video.addEventListener('loadedmetadata', () => {
        generateThumbnails(video, canvas, ctx, thumbnailCount, thumbnailInterval, duration);
    });

    video.load();
};

function generateThumbnails(video, canvas, ctx, thumbnailCount, thumbnailInterval, duration) {
    const thumbnails = [];

    function captureThumbnail(index) {
        if (index >= thumbnailCount) {
            self.postMessage(thumbnails);
            return;
        }

        const time = index * thumbnailInterval;
        video.currentTime = time;

        video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.convertToBlob().then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    thumbnails.push({
                        dataUrl: reader.result,
                        startTime: time,
                        endTime: Math.min(time + thumbnailInterval, duration)
                    });
                    captureThumbnail(index + 1);
                };
                reader.readAsDataURL(blob);
            });
        };
    }

    captureThumbnail(0);
}