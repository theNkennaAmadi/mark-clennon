import gsap from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import * as THREE from "three";
import Lenis from "@studio-freight/lenis";

gsap.registerPlugin(ScrollTrigger);

export class NotFound {
    constructor(container) {
        this.container = container;
        this.init();
    }

    init() {
        const circleContainer = document.querySelector('.img-block-wrapper');
        const images = this.container.querySelector('.circle-item');
        const totalImages = images.length;
        const radius = 150; // Adjust radius as needed

        function positionImages() {
            images.forEach((img, index) => {
                const angle = (index / totalImages) * Math.PI * 2;
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                img.style.transform = `translate(${x}px, ${y}px) rotate(${angle}rad)`;
                img.style.opacity = Math.abs(Math.cos(angle)) * 1.5;
            });
        }
        /*
        ScrollTrigger.clearScrollMemory();
        const lenis = new Lenis({
            smooth: true,
            infinite: true,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);
        this.container.appendChild(renderer.domElement);

        const imageUrls = [
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

        const imagePlanes = [];
        const radius = 15; // Radius of the circular path
        const totalImages = imageUrls.length;

        Promise.all(imageUrls.map(url => new Promise((resolve) => {
            new THREE.TextureLoader().load(url, (texture) => {
                const aspect = texture.image.width / texture.image.height;
                resolve({ texture, aspect });
            });
        }))).then(results => {
            results.forEach(({ texture, aspect }, index) => {
                const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true });
                const geometry = new THREE.PlaneGeometry(7, 7 / aspect);
                const mesh = new THREE.Mesh(geometry, material);
                mesh.aspect = aspect;

                scene.add(mesh);
                imagePlanes.push(mesh);
            });

            animate();
        });

        camera.position.set(0, 0, 30);

        function animate() {
            gsap.to(imagePlanes, {
                duration: 1,
                scrollTrigger: {
                    trigger: '.utility-page-wrap',
                    start: "top top",
                    end: "+=200%",
                    scrub: true,
                    pin: true,
                },
                onUpdate: () => {
                    const scrollY = window.scrollY / window.innerHeight * Math.PI * 2;
                    imagePlanes.forEach((plane, index) => {
                        const angle = (index / totalImages) * Math.PI * 2 + scrollY;
                        plane.position.x = radius * Math.cos(angle);
                        plane.position.y = radius * Math.sin(angle);
                        plane.position.z = -10;

                        plane.rotation.z = angle;

                        // Fade in/out effect
                        const normalizedY = (plane.position.y + radius) / (2 * radius);
                        plane.material.opacity = Math.abs(Math.cos(normalizedY * Math.PI));
                    });
                    renderer.render(scene, camera);
                }
            });

            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        }

        window.addEventListener('resize', onWindowResize, false);

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

         */
    }
}