import gsap from "gsap";
import Lenis from "@studio-freight/lenis";
import {ScrollTrigger} from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);



export class Still{
    constructor(container) {
        this.container = container
        this.images = container.querySelectorAll('.image-container')
        this.nextLinksContainer = document.querySelectorAll('.next-link');
        this.links = Array.from(this.nextLinksContainer).map(link => link.getAttribute('href'));
        this.nextLink = this.container.querySelector('.still-next')
        this.prevLink = this.container.querySelector('.still-prev')
        this.stillNextImgs = this.container.querySelectorAll('.still-img')
        this.init()
    }
    init(){
        this.revealImages()
        this.setUpNextPrev()
    }

    revealImages(){
       this.images.forEach(image=>{
              gsap.fromTo(image,
                  {clipPath: 'inset(25% 25% 25% 25%)'},
                  {clipPath: 'inset(0% 0% 0% 0%)',
                            scrollTrigger: {
                                 trigger: image,
                                 start: "top 80%",
                            },
                            duration: 1.5,
                            ease: "expo.out"
                          })
       })

        gsap.fromTo(['.still-prev img', '.still-next img'],
            {clipPath: 'inset(100% 0% 0% 0%)'},
            {clipPath: 'inset(0% 0% 0% 0%)',
                scrollTrigger: {
                    trigger: '.still-prev',
                    start: "top 80%",
                },
                duration: 1.5,
                ease: "expo.out"
            })

        this.stillNextImgs.forEach(img=>{
            const tl = gsap.timeline({paused: true});
            tl.to(img, {scale: 1, duration: 0.75, ease: "expo.out"})
            img.addEventListener('mouseenter', () => {
                tl.play();
            });
            img.addEventListener('mouseleave', () => {
                tl.reverse();
            });
        })
    }


    findAdjacentLinks(url, links) {
        const index = links.indexOf(url);

        if (index === -1) {
            return { previous: null, next: null };
        }

        const previous = index === 0 ? links[links.length - 1] : links[index - 1];
        const next = index === links.length - 1 ? links[0] : links[index + 1];

        return { previous, next };
    }

    setUpNextPrev(){
        const result = this.findAdjacentLinks(window.location.pathname, this.links);
        if (result.next) {
            this.nextLink.href = result.next;
            const nextLinkElement = this.nextLinksContainer[this.links.indexOf(result.next)];
            const nextImgLinkElement = nextLinkElement.querySelector('img');
            const nextHeading = nextLinkElement.querySelector('.next-heading')
            if (nextImgLinkElement && nextHeading) {
                this.nextLink.querySelector('img').src = nextImgLinkElement.src;
                this.nextLink.querySelector('h2').textContent = nextHeading.textContent
            }
        }

        if (result.previous) {
            this.prevLink.href = result.previous;
            const prevLinkElement = this.nextLinksContainer[this.links.indexOf(result.previous)];
            const prevImgLinkElement = prevLinkElement.querySelector('img');
            const prevHeading = prevLinkElement.querySelector('.next-heading')
            if (prevImgLinkElement && prevHeading) {
                this.prevLink.querySelector('img').src = prevImgLinkElement.src;
                this.prevLink.querySelector('h2').textContent = prevHeading.textContent
            }
        }
    }
}