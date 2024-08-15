import * as THREE from 'three';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

gsap.registerPlugin(ScrollTrigger);

export class Diary {
    constructor(container) {
        this.container = container
        this.items = Array.from(container.querySelectorAll('.stills-item'));
        console.log(this.items)
        this.imageUrls = this.items.map(item => item.querySelector('img').src);
        this.images = [];
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.images = [];
        this.hoveredImage = null;

        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.set(0, 0, 10);

        this.setupControls();
        this.setupLights();
        this.loadImages();
        this.addEventListeners();
        this.animate();
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 5;
        //this.controls.maxDistance = 50;
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(10, 10, 10);
        this.scene.add(pointLight);
    }

    loadImages() {
        const loader = new THREE.TextureLoader();
        const radius = 15; // Radius of the sphere on which images are placed

        this.imageUrls.forEach((url, index) => {
            loader.load(url, (texture) => {
                const aspect = texture.image.width / texture.image.height;
                const geometry = new THREE.PlaneGeometry(aspect, 1);
                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                    transparent: false,
                    opacity: 1
                });
                const mesh = new THREE.Mesh(geometry, material);

                // Position images on a sphere
                const phi = Math.acos(-1 + (2 * index) / this.imageUrls.length);
                const theta = Math.sqrt(this.imageUrls.length * Math.PI) * phi;

                mesh.position.setFromSphericalCoords(radius, phi, theta);
                mesh.lookAt(0, 0, 0);

                // Random scale (but keep aspect ratio)
                const scale = 0.5 + Math.random() * 1;
                mesh.scale.set(scale * aspect, scale, 1);

                this.scene.add(mesh);
                this.images.push(mesh);
            });
        });
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize(), false);
        this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event), false);
        this.renderer.domElement.addEventListener('click', (event) => this.onClick(event), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.images);

        if (intersects.length > 0) {
            if (this.hoveredImage !== intersects[0].object) {
                if (this.hoveredImage) this.resetImageScale(this.hoveredImage);
                this.hoveredImage = intersects[0].object;
                this.hoverEffect(this.hoveredImage);
            }
        } else if (this.hoveredImage) {
            this.resetImageScale(this.hoveredImage);
            this.hoveredImage = null;
        }
    }

    onClick(event) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.images);

        if (intersects.length > 0) {
            const clickedImage = intersects[0].object;
            this.zoomToImage(clickedImage);
        }
    }

    hoverEffect(image) {
        gsap.to(image.scale, {
            x: image.scale.x * 1.1,
            y: image.scale.y * 1.1,
            duration: 0.3
        });
        gsap.to(image.material, { opacity: 1, duration: 0.3 });
    }

    resetImageScale(image) {
        gsap.to(image.scale, {
            x: image.scale.x / 1.1,
            y: image.scale.y / 1.1,
            duration: 0.3
        });
        gsap.to(image.material, { opacity: 0.8, duration: 0.3 });
    }

    zoomToImage(image) {
        const targetPosition = new THREE.Vector3().copy(image.position).multiplyScalar(0.8);

        gsap.to(this.camera.position, {
            x: targetPosition.x,
            y: targetPosition.y,
            z: targetPosition.z-2,
            duration: 1,
            ease: "power2.out"
        });

        gsap.to(this.controls.target, {
            x: image.position.x,
            y: image.position.y,
            z: image.position.z-2,
            duration: 1,
            ease: "power2.out"
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Usage:
// const gallery = new Gallery3D('gallery-container', ['image1.jpg', 'image2.jpg', ...]);