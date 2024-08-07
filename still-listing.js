import Lenis from '@studio-freight/lenis';
import * as THREE from 'three';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class StillListing {
    constructor(container) {
        this.container = container;
        this.lenis = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.imagePlanes = [];
        this.items = [...container.querySelectorAll('.stills-item')]
        this.imageUrls = this.items.map(item => item.querySelector('img').src);
        this.totalItems = this.items.length;
        this.totalHeight = 14; // Fixed total height
        this.spacing = this.totalHeight / this.totalItems;
        this.radius = 15; // Fixed radius

        this.init();
    }

    init() {
        this.setupLenis();
        this.setupThreeJS();
        this.loadImages();
        this.setupAnimation();
        this.addEventListeners();
    }

    setupLenis() {
        this.lenis = new Lenis({
            smooth: true,
            infinite: true,
        });

        const raf = (time) => {
            this.lenis.raf(time);
            requestAnimationFrame(raf);
        };
        requestAnimationFrame(raf);
    }

    setupThreeJS() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0xffffff, 0);
        this.container.appendChild(this.renderer.domElement);
        this.camera.position.set(0, 0, 1);
    }

    loadImages() {
        this.imageUrls.forEach((url, index) => {
            const texture = new THREE.TextureLoader().load(url, () => {
                let width = texture.image.width;
                let height = texture.image.height;
                let aspect = width / height;
                const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: false });
                const scale = 80 / this.totalItems;
                const geometry = new THREE.PlaneGeometry(scale * aspect, scale);
                const mesh = new THREE.Mesh(geometry, material);

                texture.colorSpace = THREE.SRGBColorSpace;
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.format = THREE.RGBAFormat;

                const angle = ((index - this.imageUrls.length / 2) / this.imageUrls.length) * Math.PI * 2;
                mesh.position.set(
                    this.radius * Math.sin(angle),
                    index * this.spacing - this.totalHeight / 2,
                    this.radius * Math.cos(angle)
                );

                this.scene.add(mesh);
                this.imagePlanes.push(mesh);
            });
        });
    }

    setupAnimation() {
        gsap.to(this.imagePlanes, {
            duration: 1,
            scrollTrigger: {
                trigger: this.container,
                start: "top top",
                end: `+=${this.totalItems * 40}%`,
                scrub: true,
                pin: true,
            },
            onUpdate: () => this.updateImagePositions(),
        });

        const animate = () => {
            requestAnimationFrame(animate);
            this.renderer.render(this.scene, this.camera);
        };
        animate();
    }

    updateImagePositions() {
        const scrollY = window.scrollY / window.innerHeight * this.totalHeight;
        this.imagePlanes.forEach((plane, index) => {
            const yPos = (scrollY + index * this.spacing) % this.totalHeight - this.totalHeight / 2;
            plane.position.y = yPos;
            const angle = (yPos / this.totalHeight + 0.5) * Math.PI * 2;
            plane.position.x = this.radius * Math.sin(angle);
            plane.position.z = this.radius * Math.cos(angle);

            const normalizedY = (yPos + this.totalHeight / 2) / this.totalHeight;
            plane.material.opacity = Math.sin(normalizedY * Math.PI);
        });
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}