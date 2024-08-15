import * as THREE from 'three';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class Diary {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.imagePlanes = [];
        this.items = Array.from(container.querySelectorAll('.stills-item'));
        this.imageUrls = this.items.map(item => item.querySelector('img').src);
        this.totalItems = this.items.length;
        this.totalHeight = 20;
        this.spacing = this.totalHeight / this.totalItems * 2;
        this.radius = 5;

        //this.init();
    }

    init() {
        this.setupThreeJS();
        this.loadImages();
        this.setupAnimation();
        this.addEventListeners();
        console.log(`Total items: ${this.totalItems}`);
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
        const loader = new THREE.TextureLoader();
        this.imageUrls.forEach((url, index) => {
            loader.load(url, texture => {
                const aspect = texture.image.width / texture.image.height;
                const scale = 80 / this.totalItems;
                const geometry = new THREE.PlaneGeometry(scale * aspect, scale);
                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                    transparent: true,
                });

                texture.colorSpace = THREE.SRGBColorSpace;
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.format = THREE.RGBAFormat;

                const angle = ((index - this.imageUrls.length / 2) / this.imageUrls.length) * Math.PI * 2;
                const mesh = new THREE.Mesh(geometry, material);
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
                start: 'top top',
                end: `+=${this.totalItems * 40}%`,
                scrub: true,
                pin: true,
            },
            onUpdate: this.updateImagePositions.bind(this),
        });

        const animate = () => {
            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame(animate);
        };
        animate();
    }

    updateImagePositions() {
        const scrollY = (window.scrollY / window.innerHeight) * this.totalHeight;
        this.imagePlanes.forEach((plane, index) => {
            const yPos = (scrollY + index * this.spacing) % this.totalHeight - this.totalHeight / 2;
            plane.position.y = yPos;
            const angle = ((yPos + this.totalHeight / 2) / this.totalHeight) * Math.PI * 2;
            plane.position.z = this.radius * Math.cos(angle);

            const normalizedY = (yPos + this.totalHeight / 2) / this.totalHeight;
            plane.material.opacity = Math.sin(normalizedY * Math.PI);
        });
    }

    addEventListeners() {
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
