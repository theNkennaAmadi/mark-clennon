import * as THREE from 'three';
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Splitting from "splitting";

export class Diary {
    constructor(container) {
        this.container = container;
        this.items = Array.from(container.querySelectorAll('.stills-item'));
        this.imageUrls = this.items.map(item => item.querySelector('img').src);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.controls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.images = [];
        this.hoveredImage = null;
        this.currentlyFocused = null;
        this.originalFOV = 75;
        this.zoomedFOV = 40;

        this.gridSize = { width: 12, height: 8 }; // Increased grid size for more spread
        this.depthRange = 10; // Reduced depth range to minimize z-index clashing
        this.cameraBounds = {
            minX: 0, maxX: 0,
            minY: 0, maxY: 0,
            minZ: 0, maxZ: 0
        };

        this.viewMode = '3D'; // New property to track the current view mode

        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };

        this.floatingAnimations = [];

        this.init();
    }

    init() {
        this.initSplitting()
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);
        this.camera.position.set(0, 0, 20);
    }


    initSplitting() {
        //Initialize Splitting, split the text into characters and get the results
        this.targets = [...document.querySelectorAll(".diary-text")];

        const results = Splitting({target: this.targets, by: "chars"});

        //Get all the words and wrap each word in a span
        this.chars = results.map((result) => result.chars).flat();

        this.chars.forEach((word) => {
            let wrapper = document.createElement("span");
            wrapper.classList.add("char-wrap");
            word.parentNode.insertBefore(wrapper, word);
            wrapper.appendChild(word);
        });
        gsap.set('.diary-text-wrapper', {opacity:1})

        //Get all the characters and move them off the screen
        //gsap.set([this.chars], {yPercent: 120});
        this.initScene()
        this.addViewSwitchButton()
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
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 50;
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
        const radius = 20;

        const batchSize = 5;
        const loadBatch = (startIndex) => {
            const endIndex = Math.min(startIndex + batchSize, this.imageUrls.length);
            for (let index = startIndex; index < endIndex; index++) {
                this.loadSingleImage(loader, radius, index);
            }
            if (endIndex < this.imageUrls.length) {
                setTimeout(() => loadBatch(endIndex), 100);
            }
        };

        loadBatch(0);
    }

    loadSingleImage(loader, radius, index) {
        loader.load(this.imageUrls[index], (texture) => {
            const imageWidth = texture.image.width;
            const imageHeight = texture.image.height;

            const scaleFactor = 0.0008; // Adjust this value to scale images appropriately

            const geometry = new THREE.PlaneGeometry(imageWidth * scaleFactor, imageHeight * scaleFactor);

            const material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 1
            });
            const mesh = new THREE.Mesh(geometry, material);

            texture.colorSpace = THREE.SRGBColorSpace;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.format = THREE.RGBAFormat;

            if (this.viewMode === '3D') {
                const phi = Math.acos(-1 + (2 * index) / this.imageUrls.length);
                const theta = Math.sqrt(this.imageUrls.length * Math.PI) * phi;
                mesh.position.setFromSphericalCoords(radius, phi, theta);
                mesh.lookAt(0, 0, 0);
            } else {
                this.positionImageIn2DGrid(mesh, index);
            }

            //const scale = 1 + Math.random() * 0.5;
           // mesh.scale.set(scale * aspect, scale, 1);

            this.scene.add(mesh);
            this.images.push(mesh);

            gsap.from(mesh.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: 1,
                ease: "back.out(1.7)",
                delay: index * 0.1
            });
        });
    }

    positionImageIn2DGrid(mesh, index) {
        const { width, height } = this.gridSize;
        const totalCells = width * height;
        const repeats = Math.ceil(this.imageUrls.length / totalCells);

        const cellIndex = index % totalCells;
        const repeatIndex = Math.floor(index / totalCells);

        const xCell = cellIndex % width;
        const yCell = Math.floor(cellIndex / width);

        // Calculate offsets considering the actual image dimensions
        const meshWidth = mesh.geometry.parameters.width;
        const meshHeight = mesh.geometry.parameters.height;

        const xOffset = (xCell - (width - 1) / 2) * (meshWidth + 1);
        const yOffset = ((height - 1) / 2 - yCell) * (meshHeight + 1);

        const zOffset = repeatIndex * (this.depthRange / repeats);

        mesh.position.set(
            xOffset,
            yOffset,
            zOffset
        );

        mesh.rotation.set(0, 0, 0);

        if (this.viewMode === '2D') {
            // No need to scale the mesh
        }

        mesh.material.opacity = this.viewMode === '2D' ? 1 : 0.8;

        this.updateCameraBounds(mesh);

        if (this.viewMode === '2D') {
            this.initFloatingAnimation(mesh);
        }
    }


    initFloatingAnimation(mesh) {
        const duration = 3 + Math.random() * 2; // Random duration between 3-5 seconds
        const yMovement = 0.15 + Math.random() * 0.15; // Random y movement between 0.1-0.2
        const rotationMovement = 0.02 + Math.random() * 0.02; // Random rotation between 0.02-0.04 radians

        const tl = gsap.timeline({ repeat: -1, yoyo: true });
        tl.to(mesh.position, {
            y: mesh.position.y + yMovement,
            duration: duration,
            ease: "sine.inOut"
        });
        tl.to(mesh.rotation, {
            x: rotationMovement,
            y: rotationMovement,
            duration: duration,
            ease: "sine.inOut"
        }, 0);

        this.floatingAnimations.push(tl);
    }

    updateCameraBounds(mesh) {
        this.cameraBounds.minX = Math.min(this.cameraBounds.minX, mesh.position.x);
        this.cameraBounds.maxX = Math.max(this.cameraBounds.maxX, mesh.position.x);
        this.cameraBounds.minY = Math.min(this.cameraBounds.minY, mesh.position.y);
        this.cameraBounds.maxY = Math.max(this.cameraBounds.maxY, mesh.position.y);
        this.cameraBounds.minZ = Math.min(this.cameraBounds.minZ, mesh.position.z);
        this.cameraBounds.maxZ = Math.max(this.cameraBounds.maxZ, mesh.position.z);
    }


    switchViewMode() {
        const previousViewMode = this.viewMode;
        this.viewMode = this.viewMode === '3D' ? '2D' : '3D';
        const radius = 20;

        // Reset camera bounds
        this.cameraBounds = {
            minX: Infinity, maxX: -Infinity,
            minY: Infinity, maxY: -Infinity,
            minZ: Infinity, maxZ: -Infinity
        };

        // Clear existing floating animations
        this.floatingAnimations.forEach(animation => animation.kill());
        this.floatingAnimations = [];

        this.images.forEach((mesh, index) => {
            if (this.viewMode === '3D') {
                const phi = Math.acos(-1 + (2 * index) / this.imageUrls.length);
                const theta = Math.sqrt(this.imageUrls.length * Math.PI) * phi;
                gsap.to(mesh.position, {
                    x: radius * Math.sin(phi) * Math.cos(theta),
                    y: radius * Math.sin(phi) * Math.sin(theta),
                    z: radius * Math.cos(phi),
                    duration: 1.5,
                    ease: "power2.out",
                    onUpdate: () => mesh.lookAt(0, 0, 0)
                });
                gsap.to(mesh.rotation, {
                    x: 0, y: 0, z: 0,
                    duration: 1.5,
                    ease: "power2.out"
                });
                gsap.to(mesh.scale, {
                    x: mesh.scale.x / 2,
                    y: mesh.scale.y / 2,
                    z: mesh.scale.z / 2,
                    duration: 1.5,
                    ease: "power2.out"
                });
                gsap.to(mesh.material, { opacity: 0.8, duration: 1.5 });
            } else {
                this.positionImageIn2DGrid(mesh, index);
                gsap.to(mesh.position, {
                    x: mesh.position.x,
                    y: mesh.position.y,
                    z: mesh.position.z,
                    duration: 1.5,
                    ease: "power2.out"
                });
                gsap.to(mesh.rotation, {
                    x: 0, y: 0, z: 0,
                    duration: 1.5,
                    ease: "power2.out"
                });
                gsap.to(mesh.scale, {
                    x: mesh.scale.x * 2,
                    y: mesh.scale.y * 2,
                    z: mesh.scale.z * 2,
                    duration: 1.5,
                    ease: "power2.out"
                });
                gsap.to(mesh.material, { opacity: 1, duration: 1.5 });
            }
        });

        if (this.viewMode === '3D') {
            gsap.to(this.camera.position, { x: 0, y: 0, z: 20, duration: 1.5, ease: "power2.out" });
            this.controls.enabled = true;
        } else {
            const cameraZ = this.cameraBounds.maxZ + 5;
            gsap.to(this.camera.position, { x: 0, y: 0, z: cameraZ, duration: 1.5, ease: "power2.out" });
            this.controls.enabled = false;
            this.setupCustomPanControls();
        }

        gsap.to(this.controls.target, { x: 0, y: 0, z: 0, duration: 1.5, ease: "power2.out" });
        this.camera.updateProjectionMatrix();

        // Initialize floating animations after transition if switching to 2D
        if (this.viewMode === '2D' && previousViewMode === '3D') {
            setTimeout(() => {
                this.images.forEach(mesh => this.initFloatingAnimation(mesh));
            }, 1500); // Wait for the transition to complete
        }
    }


    setupCustomPanControls() {
        this.container.style.cursor = 'grab';

        this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.container.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.container.addEventListener('mouseleave', this.onMouseUp.bind(this));
        this.container.addEventListener('wheel', this.onWheel.bind(this));

        // Remove OrbitControls events
        this.controls.dispose();
    }

    setupConstrainedControls() {
        this.controls.enabled = true;
        this.controls.minDistance = 0;
        this.controls.maxDistance = this.cameraBounds.maxZ - this.cameraBounds.minZ;

        const padding = 2; // Add some padding to avoid cutting off images at the edges
        this.controls.minAzimuthAngle = -Math.PI / 4;
        this.controls.maxAzimuthAngle = Math.PI / 4;
        this.controls.minPolarAngle = Math.PI / 4;
        this.controls.maxPolarAngle = Math.PI * 3 / 4;

        this.controls.addEventListener('change', () => {
            const pos = this.camera.position;
            pos.x = Math.max(this.cameraBounds.minX - padding, Math.min(this.cameraBounds.maxX + padding, pos.x));
            pos.y = Math.max(this.cameraBounds.minY - padding, Math.min(this.cameraBounds.maxY + padding, pos.y));
            pos.z = Math.max(this.cameraBounds.minZ - 1, Math.min(this.cameraBounds.maxZ, pos.z));
        });
    }

    addViewSwitchButton() {
        const button = document.createElement('button');
        button.textContent = 'Switch View';
        button.style.position = 'absolute';
        button.style.top = '50px';
        button.style.right = '50px';
        button.style.zIndex = '1000';
        button.addEventListener('click', () => this.switchViewMode());
        this.container.appendChild(button);
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

    onMouseDown(event) {
        this.isDragging = true;
        this.container.style.cursor = 'grabbing';
        this.previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    onMouseMove(event) {
        if (!this.isDragging) return;

        const deltaMove = {
            x: event.clientX - this.previousMousePosition.x,
            y: event.clientY - this.previousMousePosition.y
        };

        const cameraMoveSpeed = 0.01;
        this.camera.position.x -= deltaMove.x * cameraMoveSpeed;
        this.camera.position.y += deltaMove.y * cameraMoveSpeed;

        this.clampCameraPosition();

        this.previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    onMouseUp() {
        this.isDragging = false;
        this.container.style.cursor = 'grab';
    }

    onWheel(event) {
        event.preventDefault();
        const zoomSpeed = 0.1;
        this.camera.position.z += event.deltaY * zoomSpeed;
        this.clampCameraPosition();
    }


    clampCameraPosition() {
        const padding = 5;
        this.camera.position.x = Math.max(this.cameraBounds.minX - padding, Math.min(this.cameraBounds.maxX + padding, this.camera.position.x));
        this.camera.position.y = Math.max(this.cameraBounds.minY - padding, Math.min(this.cameraBounds.maxY + padding, this.camera.position.y));
        this.camera.position.z = Math.max(this.cameraBounds.minZ - 1, Math.min(this.cameraBounds.maxZ, this.camera.position.z));
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
        const direction = imagePosition.clone().sub(this.camera.position).normalize();
        const distance = image.scale.x * 1.25;
        const cameraPosition = imagePosition.clone().sub(direction.multiplyScalar(distance));

        gsap.to(this.camera.position, {
            x: cameraPosition.x,
            y: cameraPosition.y,
            z: cameraPosition.z,
            duration: 1.5,
            ease: "power2.out"
        });

        gsap.to(this.camera, {
            fov: this.zoomedFOV,
            duration: 1.5,
            ease: "power2.out",
            onUpdate: () => this.camera.updateProjectionMatrix()
        });

        gsap.to(this.controls.target, {
            x: imagePosition.x,
            y: imagePosition.y,
            z: imagePosition.z,
            duration: 1.5,
            ease: "power2.out",
            onUpdate: () => this.controls.update()
        });

        gsap.to(image.scale, {
            x: image.scale.x * 1.2,
            y: image.scale.y * 1.2,
            duration: 0.5
        });

        this.images.forEach(otherImage => {
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
            x: 0,
            y: 0,
            z: 20,
            duration: 1.5,
            ease: "power2.out"
        });

        gsap.to(this.camera, {
            fov: this.originalFOV,
            duration: 1.5,
            ease: "power2.out",
            onUpdate: () => this.camera.updateProjectionMatrix()
        });

        gsap.to(this.controls.target, {
            x: 0,
            y: 0,
            z: 0,
            duration: 1.5,
            ease: "power2.out",
            onUpdate: () => this.controls.update()
        });

        gsap.to(this.currentlyFocused.scale, {
            x: this.currentlyFocused.scale.x / 1.2,
            y: this.currentlyFocused.scale.y / 1.2,
            duration: 0.5
        });

        this.images.forEach(image => {
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
                duration: 0.3
            });
            gsap.to(image.material, { opacity: 1, duration: 0.3 });
        }
    }

    resetImageScale(image) {
        if (image !== this.currentlyFocused) {
            gsap.to(image.scale, {
                x: image.scale.x / 1.1,
                y: image.scale.y / 1.1,
                duration: 0.3
            });
            gsap.to(image.material, { opacity: 0.8, duration: 0.3 });
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.viewMode === '3D') {
            this.controls.update();
        }
        this.renderer.render(this.scene, this.camera);
    }
}