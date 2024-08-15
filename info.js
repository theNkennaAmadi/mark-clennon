import {gsap} from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import Splitting from "splitting";
import Plyr from 'plyr';

gsap.registerPlugin(ScrollTrigger, Flip);

export class Info{
    constructor(container) {
        window.scrollTo(0, 0);
        this.container = container
        this.heroWrapper = container.querySelector('.about-hero-wrapper')
        this.heroImg = container.querySelector('.about-hero-img')
        this.introImg = container.querySelector('.about-intro-img')
        this.introGrid = container.querySelector('.about-intro-grid')
        this.selectBoxWrappers = container.querySelectorAll('.select-box-wrapper')
        this.lines = container.querySelectorAll('.line')
        this.pressVisuals = container.querySelectorAll('.press-media-item')
        this.speakingItems = container.querySelectorAll('.speaking-item')
        this.init()
    }
    init(){
        gsap.registerPlugin(ScrollTrigger, Flip);
        this.aboutReveal()
        this.initSplitting()
        this.rotateBoxes()
        this.revealPress()
    }



    aboutReveal(){
        let tlRevealIntro = gsap.timeline({})
        tlRevealIntro.set('.main', {opacity: 1})
        tlRevealIntro.set('.page-wrapper', {backgroundColor: 'black'})
        let value = window.innerWidth > 767 ? '-40vw' : '18vw'
        tlRevealIntro.set(this.introImg, {x: value,width: '30vh'})
            .fromTo(this.introImg, {clipPath: 'inset(100% 0 0 0)'}, {clipPath: 'inset(0% 0 0 0)', yPercent: -110, duration: 1, ease: 'expo.out'})
            .to(this.introImg, {x: 0, yPercent: 0, width: '17rem', duration: 2, ease: 'expo.out'})
            .to('.page-wrapper', {backgroundColor: '#d9d9d9', onComplete: ()=>{
                    this.showText()
                }}, "<")
            //.set(this.heroWrapper, {clipPath: 'inset(100% 0 0 0)'})
        //tlRevealIntro.from(this.heroImg, {clipPath: 'inset(100% 0 0 0)', yPercent: 40, duration: 1, ease: 'expo.out'})
        //tlRevealIntro.from(this.heroImg.querySelector('img'), {scale: 1.5, duration: 1, ease: 'expo.out'}, "<")
    }

    initSplitting() {
        //Initialize Splitting, split the text into characters and get the results
        this.targets = [...document.querySelectorAll("[split-text]")];

        const results = Splitting({target: this.targets, by: "chars"});

        //Get all the words and wrap each word in a span
        this.chars = results.map((result) => result.chars).flat();

        this.chars.forEach((word) => {
            let wrapper = document.createElement("span");
            wrapper.classList.add("char-wrap");
            word.parentNode.insertBefore(wrapper, word);
            wrapper.appendChild(word);
        });

        //Get all the characters and move them off the screen
        gsap.set([this.chars], {yPercent: 120});
    }

    showText(){
        if (this.targets.length !== 0) {
            this.targets.forEach((title) => {
                if (!title.hasAttribute("no-instance")) {
                    const chars = title.querySelectorAll(".char");
                    gsap.fromTo(
                        chars,
                        {
                            "will-change": "transform",
                            transformOrigin: "0% 50%",
                            yPercent: 120,
                        },
                        {
                            duration: 2,
                            ease: "expo.out",
                            yPercent: 0,
                            scrollTrigger: {
                                trigger: title,
                                invalidateOnRefresh: true,
                                start: "top 95%",
                                end: "bottom bottom",
                                //scrub: true,
                                //markers: true
                            },
                        }
                    );
                }
            });
        }

        this.selectBoxWrappers.forEach((wrapper, index)=>{
            gsap.from(wrapper.querySelector('.select-box'), {
                yPercent: 120,
                duration: 1,
                ease: 'expo.out',
                scrollTrigger: {
                    trigger: wrapper,
                    start: "top 90%",
                }
            })
        })

        this.lines.forEach(line=>{
            gsap.from(line, {width: '0%', duration: 1, ease: 'expo.out', scrollTrigger:
                    {
                    trigger: line,
                    start: "top 90%",
                }})
        })

        this.pressVisuals.forEach(visual=>{
            const tlShow = gsap.timeline({paused: true})
            tlShow.to(visual.querySelector('.play-wrapper'), {opacity: 1, duration: 1, ease: 'expo.out'})
                .fromTo(visual.querySelector('.circle'), {strokeDasharray: 50, strokeDashoffset: 50},{ strokeDashoffset: 0, duration: 1, ease: 'expo.out'}, "<")

            visual.addEventListener('mouseenter', ()=>{
                tlShow.play()
            })
            visual.addEventListener('mouseleave', ()=>{
                tlShow.reverse()
            })

            const player = new Plyr(visual.querySelector('.plyr__video-embed'));
            visual.addEventListener('click', (e)=>{
                e.preventDefault()

                gsap.to(visual.querySelector('.m-video'),{opacity: 1})

                gsap.to([visual.querySelector('.press-media-thumbnail'), visual.querySelector('.press-mask'), visual.querySelector('.play-wrapper')], { display: 'none', duration: 1, ease: 'expo.out', onComplete:()=>{
                    player.play()
                }})
            }, {once: true})

        })

        this.speakingItems.forEach(item=>{
            let tlLine = gsap.timeline({paused: true})
            tlLine.to(item.querySelector('.line'), {height: '2px'})
            item.addEventListener('mouseenter', ()=>{
                tlLine.play()
            })
            item.addEventListener('mouseleave', ()=>{
                tlLine.reverse()
            })
        })
    }

    rotateBoxes(){
        gsap.to(this.selectBoxWrappers, {rotate:720, scrollTrigger:{
            trigger: this.selectBoxWrappers.parentElement,
                scrub: 1,
                start: "top top",
                end: "bottom bottom"
        }})
    }

    revealPress(){
        this.pressVisuals.forEach(visual=>{
            gsap.from(visual.querySelector('.press-media-grid'), {clipPath: 'inset(50% 50% 50% 50%)', rotateX:'10deg', rotateZ:'10deg' , duration: 3, ease: 'expo.out', scrollTrigger: {
                trigger: visual,
                start: "top 80%",
            }})
        })
    }
}