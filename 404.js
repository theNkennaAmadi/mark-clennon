import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import Lenis from "@studio-freight/lenis";

gsap.registerPlugin(ScrollTrigger);

export class NotFound {
    constructor() {
        this.lenis = new Lenis({
            smooth: true,
            infinite: true,
        });

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.imagePlanes = [];
        this.imageUrls = [
            'https://cdn.shopify.com/s/files/1/0650/2826/0015/files/v2-yg-inked-3103.jpg?v=1719564054',
            'https://cdn.shopify.com/s/files/1/0650/2826/0015/files/MARK2999.jpg?v=1719564053',
            'https://cdn.shopify.com/s/files/1/0650/2826/0015/files/tiana-theatre-355.jpg?v=1719564053',
            'https://cdn.shopify.com/s/files/1/0650/2826/0015/files/MARK4505.jpg?v=1719564053',
            'https://cdn.shopify.com/s/files/1/0650/2826/0015/files/ter-crwn-4165_V1-v2.jpg?v=1719564053',
            'https://cdn.shopify.com/s/files/1/0650/2826/0015/files/lyric-nas-396.jpg?v=1719564053',
            'https://cdn.shopify.com/s/files/1/0650/2826/0015/files/farhia-library-0876.jpg?v=1719564053',
            'https://cdn.shopify.com/s/files/1/0650/2826/0015/files/22049-05-053_p_V1-v2.jpg?v=1719564054',
            'https://cdn.shopify.com/s/files/1/0650/2826/0015/files/0424_OTE_BIGSEAN_FINAL_COVERSL.png?v=1719564054',
        ];

        this.init();
    }

    init() {
        this.setupRenderer();
        this.setupCamera();
        this.loadImages();
        this.setupEventListeners();
        this.animate();
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        document.querySelector('.canvas-wrapper').appendChild(this.renderer.domElement);
    }

    setupCamera() {
        this.camera.position.set(0, 0, 30);
    }

    loadImages() {
        Promise.all(this.imageUrls.map(url => new Promise((resolve) => {
            new THREE.TextureLoader().load(url, (texture) => {
                const aspect = texture.image.width / texture.image.height;
                resolve({ texture, aspect });
            });
        }))).then(results => {
            results.forEach(({ texture, aspect }, index) => {
                const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true });
                const scale = window.innerWidth / 200;
                const geometry = new THREE.PlaneGeometry(scale, scale / aspect);
                const mesh = new THREE.Mesh(geometry, material);
                mesh.aspect = aspect;

                texture.colorSpace = THREE.SRGBColorSpace;
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.format = THREE.RGBAFormat;

                this.scene.add(mesh);
                this.imagePlanes.push(mesh);
            });

            this.setupScrollAnimation();
        });
    }

    setupScrollAnimation() {
        gsap.to(this.imagePlanes, {
            duration: 1,
            scrollTrigger: {
                trigger: 'body',
                start: "top top",
                end: "+=200%",
                scrub: true,
                pin: true,
            },
            onUpdate: () => this.updateImagePositions(),
        });
    }

    updateImagePositions() {
        const scrollY = window.scrollY / window.innerHeight * Math.PI * 2;
        this.radius = window.innerWidth / 100; // Recalculate radius
        this.imagePlanes.forEach((plane, index) => {
            const angle = (index / this.imagePlanes.length) * Math.PI * 2 + scrollY;
            plane.position.x = this.radius * Math.cos(angle);
            plane.position.y = this.radius * Math.sin(angle);
            plane.position.z = -10;

            plane.rotation.z = angle;

            // Fade in/out effect
            const normalizedY = (plane.position.y + this.radius) / (2 * this.radius);
            plane.material.opacity = Math.abs(Math.cos(normalizedY * Math.PI));
        });
        this.renderer.render(this.scene, this.camera);
    }

    animate() {
        this.lenis.raf(performance.now());
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.animate());
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.updateImageScales();
        this.updateImagePositions();
    }

    updateImageScales() {
        this.imagePlanes.forEach(plane => {
            const scale = window.innerWidth / 200;
            plane.geometry = new THREE.PlaneGeometry(scale, scale / plane.aspect);
        });
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }
}
