import * as THREE from 'three';
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Diary {
    constructor(container) {
        this.container = container;
        this.items = Array.from(container.querySelectorAll('.stills-item'));
        this.imageUrls = this.items.map(item => item.querySelector('img').src);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.controls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.images = [];
        this.hoveredImage = null;
        this.currentlyFocused = null;
        this.originalFOV = 75;
        this.zoomedFOV = 40;
        this.panBounds = {
            xMin: -100,
            xMax: 100,
            yMin: -100,
            yMax: 100
        };
        this.init();
    }

    init() {
        this.initScene();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);
        this.camera.position.set(0, 0, 50); // Adjusted camera position
    }

    initScene() {
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
        //this.controls.screenSpacePanning = true; // Allow panning in screen space
        this.controls.minDistance = -100;
        this.controls.maxDistance = 100;
        //this.controls.enableRotate = false; // Disable rotation for 2D navigation
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambientLight);
    }

    loadImages() {
        const loader = new THREE.TextureLoader();
        const numImages = this.imageUrls.length;

        // Define ranges for random positions
        const positionRange = 50; // Adjust as needed for spread
        const zRange = 30; // Range for z positions

        this.imageUrls.forEach((url, index) => {
            loader.load(url, (texture) => {
                const aspect = texture.image.width / texture.image.height;
                const geometry = new THREE.PlaneGeometry(aspect * 2, 2);
                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.8,
                });
                const mesh = new THREE.Mesh(geometry, material);

                texture.colorSpace = THREE.SRGBColorSpace;
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.format = THREE.RGBAFormat;

                // Random positions within the range
                const xPosition = (Math.random() - 0.5) * positionRange * 2;
                const yPosition = (Math.random() - 0.5) * positionRange * 2;
                const zPosition = (Math.random() - 0.5) * zRange * 2;

                mesh.position.set(xPosition, yPosition, zPosition);

                // Slightly randomize the rotation
                mesh.rotation.z = (Math.random() - 0.5) * 0.2; // Small rotation

                this.scene.add(mesh);
                this.images.push(mesh);

                gsap.from(mesh.scale, {
                    x: 0,
                    y: 0,
                    z: 0,
                    duration: 1,
                    ease: 'back.out(1.7)',
                    delay: index * 0.05,
                });
            });
        });
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize(), false);
        this.renderer.domElement.addEventListener(
            'mousemove',
            (event) => this.onMouseMove(event),
            false
        );
        this.renderer.domElement.addEventListener(
            'click',
            (event) => this.onClick(event),
            false
        );
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

    onClick() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.images);

        if (intersects.length > 0) {
            const clickedImage = intersects[0].object;
            this.focusOnImage(clickedImage);
        } else {
            this.resetCamera();
        }
    }

    focusOnImage(image) {
        if (this.currentlyFocused === image) {
            return;
        }

        this.currentlyFocused = image;

        const imagePosition = image.position.clone();

        gsap.to(this.camera.position, {
            x: imagePosition.x,
            y: imagePosition.y,
            z: imagePosition.z + 10, // Move camera closer to the image
            duration: 1.5,
            ease: 'power2.out',
        });

        gsap.to(this.camera, {
            fov: this.zoomedFOV,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: () => this.camera.updateProjectionMatrix(),
        });

        gsap.to(this.controls.target, {
            x: imagePosition.x,
            y: imagePosition.y,
            z: imagePosition.z,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: () => this.controls.update(),
        });

        gsap.to(image.scale, {
            x: image.scale.x * 1.2,
            y: image.scale.y * 1.2,
            duration: 0.5,
        });

        this.images.forEach((otherImage) => {
            if (otherImage !== image) {
                gsap.to(otherImage.material, { opacity: 0.1, duration: 0.5 });
            } else {
                gsap.to(otherImage.material, { opacity: 1, duration: 0.5 });
            }
        });

        this.controls.enabled = false;
        setTimeout(() => {
            this.controls.enabled = true;
        }, 1500);
    }

    resetCamera() {
        if (!this.currentlyFocused) return;

        gsap.to(this.camera.position, {
            x: this.camera.position.x,
            y: this.camera.position.y,
            z: 50, // Reset to original z position
            duration: 1.5,
            ease: 'power2.out',
        });

        gsap.to(this.camera, {
            fov: this.originalFOV,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: () => this.camera.updateProjectionMatrix(),
        });

        gsap.to(this.controls.target, {
            x: this.camera.position.x,
            y: this.camera.position.y,
            z: 0,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: () => this.controls.update(),
        });

        gsap.to(this.currentlyFocused.scale, {
            x: this.currentlyFocused.scale.x / 1.2,
            y: this.currentlyFocused.scale.y / 1.2,
            duration: 0.5,
        });

        this.images.forEach((image) => {
            gsap.to(image.material, { opacity: 0.8, duration: 0.5 });
        });

        this.currentlyFocused = null;

        this.controls.enabled = false;
        setTimeout(() => {
            this.controls.enabled = true;
        }, 1500);
    }

    hoverEffect(image) {
        if (image !== this.currentlyFocused) {
            gsap.to(image.scale, {
                x: image.scale.x * 1.1,
                y: image.scale.y * 1.1,
                duration: 0.3,
            });
            gsap.to(image.material, { opacity: 1, duration: 0.3 });
        }
    }

    resetImageScale(image) {
        if (image !== this.currentlyFocused) {
            gsap.to(image.scale, {
                x: image.scale.x / 1.1,
                y: image.scale.y / 1.1,
                duration: 0.3,
            });
            gsap.to(image.material, { opacity: 0.8, duration: 0.3 });
        }
    }

    enforcePanBounds() {
        const minPan = new THREE.Vector3(
            this.controls.target.x,
            this.controls.target.y,
            this.controls.target.z
        );
        const maxPan = new THREE.Vector3(
            this.controls.target.x,
            this.controls.target.y,
            this.controls.target.z
        );

        const panOffset = new THREE.Vector3().copy(this.controls.target);

        this.controls.target.clamp(minPan, maxPan);

        panOffset.sub(this.controls.target);
        this.camera.position.sub(panOffset);
    }


    animate() {
        requestAnimationFrame(() => this.animate());

        // Enforce pan bounds
        this.enforcePanBounds();

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
