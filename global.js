import gsap from 'gsap'

let mmNav = gsap.matchMedia()


export class Nav{
    constructor(container){
        this.container = container
        this.navBlocks = this.container.querySelectorAll('.nav-block-wrapper')
        this.stillMain = this.container.querySelector('.stills-main-wrapper')
        this.stillDropdownItems = this.container.querySelectorAll('.still-dropdown-item-text')
        this.mobIcon = this.container.querySelector('.mob-icon')
        this.navLinksWrapper = this.container.querySelector('.nav-links-wrapper')
        this.navLinks = this.container.querySelectorAll('.nav-link')
        this.init()
    }
    init(){
        this.hoverAnimation()
        this.mobileReveal()
    }

    hoverAnimation(){
        this.navBlocks.forEach(block=>{
            const nonActiveBlocks = [...this.navBlocks].filter(b=> b !== block)

            block.addEventListener('mouseenter', ()=>{
                gsap.to(block.querySelector('.nav-block'), {clipPath: 'inset(0% 0% 0% 0%)', ease: "expo.out"})
                gsap.to(block, {opacity: 1, duration: 0.3}, "<")
                gsap.to(nonActiveBlocks, {opacity: 0.5, duration: 0.3}, "<")
            })
            block.addEventListener('mouseleave', ()=>{
                gsap.to(block.querySelector('.nav-block'), {clipPath: 'inset(50% 50% 50% 50%)', ease: "expo.out"})
                gsap.to(block, {opacity: 1, duration: 0.3}, "<")
                gsap.to(nonActiveBlocks, {opacity: 1, duration: 0.3}, "<")
            })
        })


        const tlStillMain = gsap.timeline({paused: true})
        tlStillMain.to('.icon-v', {scaleY: 0})
            .to('.stills-list-dropdown-wrapper', {clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5}, "<")
            .fromTo(this.stillDropdownItems, {yPercent: 110}, {yPercent: 0, duration: 0.5, stagger: 0.1}, "<")

        this.stillMain.addEventListener('mouseenter', ()=>{
            tlStillMain.play()
        })
        this.stillMain.addEventListener('mouseleave', ()=>{
            tlStillMain.reverse()
        })

    }

    mobileReveal(){
        mmNav.add("(max-width: 767px)", () => {
            this.navOpen = false;
            const tlMob = gsap.timeline({paused: true})
            tlMob.to(this.navLinksWrapper, {clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5})
                .to(this.mobIcon, {rotate: 180, duration: 0.5}, "<")
                .fromTo([this.stillDropdownItems, this.navLinks], {yPercent: 110}, {yPercent: 0, duration: 0.5, stagger: 0.1}, "<")

            this.mobIcon.addEventListener('click', ()=>{
                this.navOpen ? tlMob.reverse() : tlMob.play()
                this.navOpen = !this.navOpen
            })
        });
    }
}