import * as THREE from 'three';
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

gsap.registerPlugin(ScrollTrigger);

export class MotionListing {
    constructor(container) {
        this.container = container;
        this.DEGREE_2_RADIAN = 0.017453292519943295;
        this.items = [...this.container.querySelectorAll('.motion-visual-item')];
        this.totalItems = this.items.length;
        this.minItems = 10;
        this.mainContainer = this.container.querySelector('.motion-canvas');
        this.repetitions = this.calculateRepetitions(this.totalItems, this.minItems);
        this.objects = [];
        this.videoTextures = [];
        this.o = { currentPlaneIndex: 0.0 };
        this.prevProgress = 0;
        this.totalRotations = 0;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredMesh = null;

        this.addClickListener();
        this.loadFont();
        this.updateDimensions();

        // Add resize event listener
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    loadFont() {
        const loader = new FontLoader();
        loader.load('https://cdn.shopify.com/s/files/1/0831/6996/8410/files/Kaneda_Gothic_Black_Regular.json?v=1713957257', (font) => {
            this.font = font;
            this.initScene();
            this.createObjects();
            this.setupScrollTrigger();
            this.render();
            window.scrollTo(0,1)
            gsap.to('.motion-visual-name-wrapper', {opacity: 1, delay:1});
        });

    }

    updateDimensions() {
        this.RADIUS = window.innerWidth > 767 ? window.innerWidth > 1000 ? 450 : window.innerWidth/2.5 : 275;
        this.planeWidth = window.innerWidth > 767 ? window.innerWidth * 0.35 : window.innerWidth * 0.8;
        this.planeHeight = this.planeWidth * (318/512); // Maintain aspect ratio
        this.textSize = window.innerWidth * 0.025;
    }

    onWindowResize() {
        this.updateDimensions();
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.updateObjectsSize();
    }

    updateObjectsSize() {
        this.objects.forEach(mesh => {
            // Update plane geometry
            mesh.geometry.dispose();
            mesh.geometry = new THREE.PlaneGeometry(this.planeWidth, this.planeHeight);

            // Update text geometry
            const textMesh = mesh.children.find(child => child.userData.isTextMesh);
            if (textMesh) {
                textMesh.geometry.dispose();
                textMesh.geometry = new TextGeometry('PLAY', {
                    font: this.font,
                    size: this.textSize,
                    height: 0,
                    curveSegments: 70,
                    depth: 5,
                });
                textMesh.geometry.center();
            }
        });
        this.redraw();
    }

    calculateRepetitions(totalItems, minItems) {
        return Math.ceil(minItems / totalItems);
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 3000);
        this.camera.position.z = 1500;

        this.renderer = new THREE.WebGLRenderer({ antialiasing: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        this.mainContainer.appendChild(this.renderer.domElement);
    }

    createObjects() {
        const uniqueObjects = [];
        for (let i = 0; i < this.totalItems; i++) {
            const geometry = new THREE.PlaneGeometry(this.planeWidth, this.planeHeight);
            const videoElement = this.items[i].querySelector('video');
            const texture = this.createVideoTexture(videoElement);
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide,
                transparent: false
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.userData = { slug: this.items[i].dataset.url };

            const textGeo = new TextGeometry('PLAY', {
                font: this.font,
                size: this.textSize,
                height: 0,
                curveSegments: 70,
                depth: 5,
            });
            textGeo.center();
            const textMaterial = new THREE.MeshBasicMaterial({ color: "#D9D9D9", transparent: false });
            const textMesh = new THREE.Mesh(textGeo, textMaterial);
            textMesh.position.set(0, 0, 1);
            textMesh.visible = false;
            textMesh.renderOrder = 1;
            textMesh.userData.isTextMesh = true;
            mesh.add(textMesh);

            uniqueObjects.push(mesh);
            this.videoTextures.push(texture);
        }

        for (let rep = 0; rep < this.repetitions; rep++) {
            for (let i = 0; i < this.totalItems; i++) {
                const clonedMesh = uniqueObjects[i].clone();
                this.objects.push(clonedMesh);
                this.scene.add(clonedMesh);
            }
        }

        this.mainContainer.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.mainContainer.addEventListener('mouseout', this.onMouseOut.bind(this));
    }

    createVideoTexture(videoElement) {
        const texture = new THREE.VideoTexture(videoElement);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBFormat;
        texture.colorSpace = THREE.SRGBColorSpace;

        videoElement.loop = true;
        videoElement.muted = true;
        videoElement.play();

        return texture;
    }

    shiftToItem(pIndex) {
        gsap.to(this.o, {
            duration: 0.8,
            overwrite: true,
            currentPlaneIndex: pIndex,
            ease: "power3.out",
            onUpdate: () => this.redraw()
        });
    }

    redraw() {
        const { length } = this.objects;
        let selectedIcon = this.o.currentPlaneIndex % length;
        if (selectedIcon < 0) selectedIcon += length;

        for (let i = 0; i < length; i++) {
            const mesh = this.objects[i];
            const refObj = this.coverFlowStyleVectical(i, selectedIcon, length);
            mesh.position.x = refObj.x;
            mesh.position.y = refObj.y;
            mesh.position.z = refObj.z;
            mesh.rotation.x = refObj.rotationX;
            mesh.visible = refObj.visible;
            mesh.material.opacity = refObj.alpha;
            mesh.index = i;
        }
    }

    coverFlowStyleVectical(i, selected, tot) {
        const obj = { x: 0, y: 0, z: 0, rotationX: 0 };
        const distance = this.getDistance(i, selected, tot);
        const absDistance = Math.abs(distance);
        const f = this.getFraction(i, selected, tot);
        const angleUtil = (Math.PI * 2) / tot;
        const f2 = distance * angleUtil + -270 * this.DEGREE_2_RADIAN;
        const y = Math.cos(f2) * this.RADIUS;
        const z = Math.sin(f2) * this.RADIUS;

        obj.rotationX = f2;
        obj.x = 0;
        obj.y = y;
        obj.z = z;
        obj.alpha = 1 - Math.abs(f);

        obj.visible = absDistance < 3;

        if (absDistance < 1) {
            obj.rotationX += (1 - absDistance) * -90 * this.DEGREE_2_RADIAN;
            obj.z += (1 - absDistance) * -20;
        }
        return obj;
    }

    getFraction(i, selected, tot) {
        let f = i - selected;
        f /= tot / 2;
        while (f < -1) f += 2;
        while (f > 1) f -= 2;
        return f;
    }

    getDistance(i, selected, tot) {
        let distance = i - selected;
        if (distance > tot / 2) distance -= tot;
        if (distance < -tot / 2) distance += tot;
        return distance;
    }

    setupScrollTrigger() {
        const totalObjects = this.objects.length;

        ScrollTrigger.create({
            trigger: ".scroll-dist",
            start: "top top",
            end: "bottom bottom",
            onUpdate: (self) => {
                const currentProgress = self.progress;

                if (this.prevProgress > 0.8 && currentProgress < 0.2) {
                    this.totalRotations++;
                } else if (this.prevProgress < 0.2 && currentProgress > 0.8) {
                    this.totalRotations--;
                }

                this.prevProgress = currentProgress;

                const actualIndex = (this.totalRotations + currentProgress) * totalObjects;
                this.shiftToItem(actualIndex);

                const nameWrappingProgress = (actualIndex % this.totalItems) / this.totalItems;
                this.updateNamePositions(nameWrappingProgress, this.totalItems);
            }
        });
    }

    updateNamePositions(progress, totalItems) {
        const itemHeight = 100; // Adjust this value based on your item height
        const visibleItems = 3; // Number of items visible at once (adjust as needed)
        const halfVisibleItems = Math.floor(visibleItems / 2);

        gsap.to(".motion-visual-name-item", {
            y: (index) => {
                let adjustedProgress = progress * totalItems;
                let relativeIndex = (index - adjustedProgress + totalItems) % totalItems;
                if (relativeIndex > totalItems / 2) relativeIndex -= totalItems;
                return -relativeIndex * itemHeight;
            },
            opacity: (index) => {
                let adjustedProgress = progress * totalItems;
                let relativeIndex = (index - adjustedProgress + totalItems) % totalItems;
                if (relativeIndex > totalItems / 2) relativeIndex -= totalItems;
                let distance = Math.abs(relativeIndex);
                return 1 - Math.min(distance / halfVisibleItems, 1);
            },
            ease: 'none',
            duration: 0.1,
        });
    }


    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.objects, true)
            .filter(intersect => !intersect.object.userData.isTextMesh);

        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            document.body.style.cursor = "pointer";
            if (this.hoveredMesh !== intersectedObject) {
                if (this.hoveredMesh) {
                    this.hideTextMesh(this.hoveredMesh);
                }
                this.hoveredMesh = intersectedObject;
                this.showTextMesh(this.hoveredMesh);
            }
        } else if (this.hoveredMesh) {
            this.hideTextMesh(this.hoveredMesh);
            this.hoveredMesh = null;
            document.body.style.cursor = "default";
        }
    }

    onMouseOut() {
        if (this.hoveredMesh) {
            this.hideTextMesh(this.hoveredMesh);
            this.hoveredMesh = null;
            document.body.style.cursor = "default";
        }
    }

    showTextMesh(mesh) {
        const textMesh = mesh.children.find(child => child.userData.isTextMesh);
        if (textMesh) {
            textMesh.visible = true;
        }
    }

    hideTextMesh(mesh) {
        const textMesh = mesh.children.find(child => child.userData.isTextMesh);
        if (textMesh) {
            textMesh.visible = false;
        }
    }

    addClickListener() {
        this.mainContainer.addEventListener('click', this.onCanvasClick.bind(this));
    }

    onCanvasClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.objects, true)
            .filter(intersect => !intersect.object.userData.isTextMesh);

        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            this.triggerLinkClick(clickedMesh);
        }
    }

    triggerLinkClick(mesh) {
        const originalIndex = mesh.index % this.totalItems;
        const correspondingItem = this.items[originalIndex];
        const link = correspondingItem.querySelector('a');

        if (link) {
            // Calculate the scale needed to fill the viewport
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const meshWidth = mesh.geometry.parameters.width;
            const meshHeight = mesh.geometry.parameters.height;
            const scaleX = viewportWidth / meshWidth;
            const scaleY = viewportHeight / meshHeight;
            const scale = Math.max(scaleX, scaleY);

            // Store the original position and scale
            const originalPosition = mesh.position.clone();
            const originalScale = mesh.scale.clone();

            gsap.to('.motion-listing-wrapper', {opacity: 0, duration: 0.1});
            this.hideTextMesh(mesh)

            // Hide all other meshes
            this.objects.forEach((otherMesh) => {
                if (otherMesh !== mesh) {
                    gsap.to(otherMesh, {
                        opacity: 0,
                        duration: 0.1,
                        ease: "power2.inOut",
                        onComplete: () => {
                            otherMesh.visible = false;
                        }
                    });
                    gsap.to(otherMesh.scale, {
                        x: 0,
                        y: 0,
                        z: 0,
                        duration: 0.1,
                        ease: "power2.inOut",
                    });
                }
            });

            // Animate the mesh to fill the viewport
            gsap.to(mesh.position, {
                x: 0,
                y: 0,
                z: this.camera.position.z - 900, // Bring it closer to the camera
                duration: 1,
                ease: "power2.inOut"
            });

            gsap.to(mesh.scale, {
                x: scale,
                y: scale,
                z: scale,
                rotate: 0,
                duration: 1,
                ease: "power2.inOut",
            });
            gsap.to(mesh.rotation, {
                x:-3.14*2,
                duration: 1.2,
                ease: "power2.inOut",
                onComplete: () => {
                    // Trigger the link click after the animation
                   link.click();
                }
            })


        } else {
            console.warn(`No link found for item at index ${originalIndex}`);
        }
    }

    render() {
        requestAnimationFrame(() => this.render());

        // Update video textures
        this.videoTextures.forEach(texture => {
            if (texture.image.readyState === texture.image.HAVE_ENOUGH_DATA) {
                texture.needsUpdate = true;
            }
        });

        this.renderer.render(this.scene, this.camera);
    }
}