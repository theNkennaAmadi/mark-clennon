import * as THREE from 'three';
import { gsap } from "gsap";
import VirtualScroll from 'virtual-scroll';
import lottie from 'lottie-web';

export class Home {
    constructor(container) {
        this.container = container;
        this.player = null;
        this.core = null;
        this.windowWidth = window.innerWidth;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.currentName = null;

        const nullElements = [...document.querySelectorAll(".w-condition-invisible")];
        nullElements.forEach((nullElement) => {
            nullElement.remove();
        });
        this.init();
    }

    init() {
        this.setupImages();
        this.setupVideos();
        this.setupEventListeners();
        this.setupMouseHover();
        lottie.loadAnimation({
            container: document.querySelector('.home-indicator-lottie-wrapper'), // the dom element that will contain the animation
            renderer: 'svg',
            loop: false,
            autoplay: false,
            path: 'https://uploads-ssl.webflow.com/66a50e6f73ed41b0d65cda81/66be088ed8cdf3532efe6a88_Ka8gov3JNr.json'
        });
        lottie.loadAnimation({
            container: document.querySelector('.home-indicator-lottie-wrapper'), // the dom element that will contain the animation
            renderer: 'svg',
            loop: false,
            autoplay: false,
            path: 'https://uploads-ssl.webflow.com/66a50e6f73ed41b0d65cda81/66be28d1a741a57883a6587d_PBRH4Lxx8M.json'
        });
        this.animations = lottie.getRegisteredAnimations();
        this.animations[0].renderer.svgElement.classList.add('l-image');
        this.animations[1].renderer.svgElement.classList.add('l-video');
        gsap.set('.l-video', { opacity: 0 });
        gsap.to('.home-lottie-wrapper', { opacity: 1, duration: 1, delay: 0.5 });
    }

    setupImages() {
        const images = [...document.querySelectorAll("img")];
        images.forEach((img) => {
            let source = img.getAttribute("src");
            img.setAttribute("data-src", source);
            img.setAttribute("crossorigin", "anonymous");
        });
    }

    setupVideos() {
        const videos = [...document.querySelectorAll("video")];
        videos.forEach((video) => {
            let source = video.getAttribute("src");
            video.setAttribute("data-src", source);
        });
    }

    setupMouseHover() {
        this.container.addEventListener('mousemove', this.onMouseHover.bind(this));
        this.container.addEventListener('touchmove', this.onTouchHover.bind(this), { passive: true });
    }

    onMouseHover(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.handleHover();
    }

    onTouchHover(event) {
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
            this.handleHover();
        }
    }

    handleHover() {
        this.raycaster.setFromCamera(this.mouse, this.core.camera);
        const intersects = this.raycaster.intersectObjects(this.core.scene.children, true);

        if (intersects.length > 0) {
            const hoveredPlane = intersects[0].object.parent;
            if (hoveredPlane instanceof Plane) {
                if (this.currentName === hoveredPlane.userData.name) return;
                if (hoveredPlane.el.tagName === "VIDEO") {
                    gsap.set('.home-indicator-lottie-wrapper svg:nth-child(2)', { opacity: 1, overwrite: true });
                    gsap.set('.home-indicator-lottie-wrapper svg:nth-child(1)', { opacity: 0, overwrite: true });
                } else {
                    gsap.set('.home-indicator-lottie-wrapper svg:nth-child(2)', { opacity: 0, overwrite: true });
                    gsap.set('.home-indicator-lottie-wrapper svg:nth-child(1)', { opacity: 1, overwrite: true });
                }
                this.animations.forEach((animation) => {
                    animation.setSpeed(3);
                    animation.playSegments([0,100])
                });
                gsap.to('.home-indicator-name', { opacity: 0, duration: 0.1, onComplete: () => {
                        document.querySelector('.home-indicator-name').textContent = hoveredPlane.userData.name;
                    }});
                gsap.to('.home-indicator-name', { opacity: 1, duration: 0.1, delay: 0.1 });
                this.currentName = hoveredPlane.userData.name;
            }
        }
    }

    setupEventListeners() {
        this.onWindowLoad();
        window.addEventListener("resize", () => this.onWindowResize());
    }

    onWindowLoad() {
        this.createCanvas();
    }

    onWindowResize() {
        this.core.resize(); // Trigger the resize method in the Core class to adjust the canvas and camera.
    }

    createCanvas() {
        const isFirefox = navigator.userAgent.indexOf("Firefox") > -1;
        const isWindows = navigator.appVersion.indexOf("Win") !== -1;

        const mouseMultiplier = 0.6;
        const firefoxMultiplier = 20;

        const multipliers = {
            mouse: isWindows ? mouseMultiplier * 2 : mouseMultiplier,
            firefox: isWindows ? firefoxMultiplier * 2 : firefoxMultiplier
        };

        this.core = new Core(multipliers, this.container);
    }
}

class Core {
    constructor(multipliers, container) {
        this.multipliers = multipliers;
        this.container = container;
        this.items = [...this.container.querySelectorAll('.home-cc-item')];
        this.itemLinks = this.items.map(item => item.querySelector('a'));
        this.itemUrls = this.items.map(item => item.querySelector('a').href);
        this.itemNames = this.items.map(item => item.querySelector('.h-name').textContent);
        this.tx = 0;
        this.ty = 0;
        this.cx = 0;
        this.cy = 0;

        this.ww = window.innerWidth;
        this.wh = window.innerHeight;

        this.isFirefox = navigator.userAgent.indexOf('Firefox') > -1;
        this.isWindows = navigator.appVersion.indexOf("Win") !== -1;

        this.diff = 0;

        this.wheel = { x: 0, y: 0 };
        this.on = { x: 0, y: 0 };
        this.max = { x: 0, y: 0 };

        this.isDragging = false;

        this.tl = gsap.timeline({ paused: true });

        this.el = document.querySelector('.grid');

        /** GL specifics **/
        this.scene = new THREE.Scene();

        this.camera = new THREE.OrthographicCamera(
            this.ww / -2, this.ww / 2, this.wh / 2, this.wh / -2, 1, 1000
        );
        this.camera.lookAt(this.scene.position);
        this.camera.position.z = 1;

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.ww, this.wh);
        this.renderer.setPixelRatio(
            gsap.utils.clamp(1, 1.5, window.devicePixelRatio)
        );

        this.container.appendChild(this.renderer.domElement);

        this.homeIndicator = this.container.querySelector('.home-indicator');

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        /** GL specifics end **/

        this.addPlanes();
        this.addEvents();
        this.resize();
    }

    addEvents() {
        gsap.ticker.add(this.tick);

        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mousemove', this.moveHomeIndicator);
        window.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('wheel', this.onWheel);

        // Touch events for mobile
        window.addEventListener('touchstart', this.onTouchStart);
        window.addEventListener('touchmove', this.onTouchMove);
        window.addEventListener('touchend', this.onTouchEnd);
        this.renderer.domElement.addEventListener('click', this.onClick);
    }

    addPlanes() {
        const planes = [...this.container.querySelectorAll('.js-plane')];

        this.planes = planes.map((el, i) => {
            const plane = new Plane();
            plane.userData.name = this.itemNames[i];
            plane.userData.index = i;
            plane.init(el, i);
            this.scene.add(plane);

            if (el.tagName.toLowerCase() === 'video') {
                el.play().catch(e => console.error("Error playing video:", e));
            }
            return plane;
        });
    }

    tick = () => {
        const xDiff = this.tx - this.cx;
        const yDiff = this.ty - this.cy;

        this.cx += xDiff * 0.085;
        this.cx = Math.round(this.cx * 100) / 100;

        this.cy += yDiff * 0.085;
        this.cy = Math.round(this.cy * 100) / 100;

        this.diff = Math.max(
            Math.abs(yDiff * 0.0001),
            Math.abs(xDiff * 0.0001)
        );

        this.planes.length && this.planes.forEach(plane =>
            plane.update(this.cx, this.cy, this.max, this.diff)
        );

        this.renderer.render(this.scene, this.camera);
    }

    onMouseMove = ({ clientX, clientY }) => {
        if (!this.isDragging) return;

        this.tx = this.on.x + clientX * 2.5;
        this.ty = this.on.y - clientY * 2.5;
    }

    onMouseDown = ({ clientX, clientY }) => {
        if (this.isDragging) return;

        this.isDragging = true;

        this.on.x = this.tx - clientX * 2.5;
        this.on.y = this.ty + clientY * 2.5;
    }

    onMouseUp = () => {
        if (!this.isDragging) return;

        this.isDragging = false;
    }

    onTouchStart = ({ touches }) => {
        if (this.isDragging) return;

        const touch = touches[0];
        this.isDragging = true;

        this.on.x = this.tx - touch.clientX * 2.5;
        this.on.y = this.ty + touch.clientY * 2.5;
    }

    onTouchMove = ({ touches }) => {
        if (!this.isDragging) return;

        const touch = touches[0];
        this.tx = this.on.x + touch.clientX * 2.5;
        this.ty = this.on.y - touch.clientY * 2.5;
    }

    onTouchEnd = () => {
        if (!this.isDragging) return;

        this.isDragging = false;
    }

    onWheel = (e) => {
        const { mouse, firefox } = this.multipliers;

        this.wheel.x = e.wheelDeltaX || e.deltaX * -1;
        this.wheel.y = e.wheelDeltaY || e.deltaY * -1;

        if (this.isFirefox && e.deltaMode === 1) {
            this.wheel.x *= firefox;
            this.wheel.y *= firefox;
        }

        this.wheel.y *= mouse;
        this.wheel.x *= mouse;

        this.tx += this.wheel.x;
        this.ty -= this.wheel.y;
    }

    onClick = (event) => {
        this.mouse.x = (event.clientX / this.ww) * 2 - 1;
        this.mouse.y = -(event.clientY / this.wh) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            let planeObject = intersects[0].object;
            while (planeObject && !(planeObject instanceof Plane)) {
                planeObject = planeObject.parent;
            }

            if (planeObject && planeObject instanceof Plane) {
                const index = planeObject.userData.index;
                if (this.itemLinks[index]) {
                    this.itemLinks[index].click();
                }
            }
        }
    }

    moveHomeIndicator = (event) => {
        const { clientX, clientY } = event;
        const { innerWidth, innerHeight } = window;

        const x = (clientX / innerWidth) * 100;
        const y = (clientY / innerHeight) * 100;

        if (!this.quickSetter) {
            this.quickSetter = gsap.quickSetter(this.homeIndicator, "css");
        }

        this.quickSetter({
            x: `${x - 47}vw`,
            y: `${y - 47}vh`,
        });
    };

    resize = () => {
        this.ww = window.innerWidth;
        this.wh = window.innerHeight;

        this.camera.left = this.ww / -2;
        this.camera.right = this.ww / 2;
        this.camera.top = this.wh / 2;
        this.camera.bottom = this.wh / -2;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.ww, this.wh);

        const { bottom, right } = this.el.getBoundingClientRect();
        this.max.x = right;
        this.max.y = bottom;

        this.planes.forEach(plane => plane.resize());
    }
}

class Plane extends THREE.Object3D {
    constructor() {
        super();
        this.loader = new THREE.TextureLoader();
        this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
        this.material = this.createMaterial();
    }

    init(el, i) {
        this.el = el;
        this.x = 0;
        this.y = 0;
        this.my = 1 - (i % window.innerWidth > 787 ? 5 : 5) * 0.1;
        this.setupTexture();
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.add(this.mesh);
        this.resize();
    }

    createMaterial() {
        return new THREE.ShaderMaterial({
            vertexShader: `
                precision mediump float;
                uniform float u_diff;
                varying vec2 vUv;
                void main() {
                    vec3 pos = position;
                    pos.y *= 1. - u_diff;
                    pos.x *= 1. - u_diff;
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
                }
            `,
            fragmentShader: `
                precision mediump float;
                uniform vec2 u_res;
                uniform vec2 u_size;
                uniform sampler2D u_texture;
                vec2 cover(vec2 screenSize, vec2 imageSize, vec2 uv) {
                    float screenRatio = screenSize.x / screenSize.y;
                    float imageRatio = imageSize.x / imageSize.y;
                    vec2 newSize = screenRatio < imageRatio
                        ? vec2(imageSize.x * (screenSize.y / imageSize.y), screenSize.y)
                        : vec2(screenSize.x, imageSize.y * (screenSize.x / imageSize.x));
                    vec2 newOffset = (screenRatio < imageRatio
                        ? vec2((newSize.x - screenSize.x) / 2.0, 0.0)
                        : vec2(0.0, (newSize.y - screenSize.y) / 2.0)) / newSize;
                    return uv * screenSize / newSize + newOffset;
                }
                varying vec2 vUv;
                void main() {
                    vec2 uv = vUv;
                    vec2 uvCover = cover(u_res, u_size, uv);
                    vec4 texture = texture2D(u_texture, uvCover);
                    gl_FragColor = texture;
                }
            `,
            uniforms: {
                u_texture: { value: 0 },
                u_res: { value: new THREE.Vector2(1, 1) },
                u_size: { value: new THREE.Vector2(1, 1) },
                u_diff: { value: 0 }
            }
        });
    }

    setupTexture() {
        if (this.el.dataset.src) {
            if (this.el.tagName === "VIDEO") {
                this.setupVideoTexture();
            } else {
                this.setupImageTexture();
            }
        }
    }

    setupVideoTexture() {
        this.video = this.el;
        this.video.crossOrigin = 'anonymous';
        this.video.load();
        this.video.muted = true;
        this.video.loop = true;

        this.texture = new THREE.VideoTexture(this.video);
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.LinearFilter;
        this.texture.format = THREE.RGBAFormat;
        this.texture.encoding = THREE.sRGBEncoding;

        const { u_texture, u_size } = this.material.uniforms;
        u_texture.value = this.texture;

        this.video.addEventListener('loadedmetadata', () => {
            u_size.value.set(this.video.videoWidth, this.video.videoHeight);
            this.video.play();
        });
    }

    setupImageTexture() {
        this.texture = this.loader.load(this.el.dataset.src, (texture) => {
            texture.minFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;
            const { naturalWidth, naturalHeight } = texture.image;
            const { u_size, u_texture } = this.material.uniforms;
            u_texture.value = texture;
            u_size.value.x = naturalWidth;
            u_size.value.y = naturalHeight;
        });
    }

    update(x, y, max, diff) {
        const { right, bottom } = this.rect;
        const { u_diff } = this.material.uniforms;

        this.y = gsap.utils.wrap(-(max.y - bottom), bottom, y * this.my) - this.yOffset;
        this.x = gsap.utils.wrap(-(max.x - right), right, x) - this.xOffset;

        u_diff.value = diff;

        this.position.x = this.x;
        this.position.y = this.y;

        if (this.texture && this.texture.isVideoTexture) {
            if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
                this.texture.needsUpdate = true;
            }
        }
    }

    resize() {
        this.rect = this.el.getBoundingClientRect();
        const { left, top, width, height } = this.rect;
        const { u_res } = this.material.uniforms;

        this.xOffset = left + width / 2 - window.innerWidth / 2;
        this.yOffset = top + height / 2 - window.innerHeight / 2;

        this.position.x = this.xOffset;
        this.position.y = this.yOffset;

        u_res.value.x = width;
        u_res.value.y = height;

        this.mesh.scale.set(width, height, 1);
    }
}
