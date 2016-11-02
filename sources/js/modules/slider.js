class Slider {

    constructor(data) {
        this.window = $(window);
        this.body = $('body');
        this.parentSelector = data.parent;

        this.container = $(data.parent);

        this.box = this.container.find(data.box);
        this.slides = $(data.elemSelector);
        this.slidesWidth = this.slides.width();
        this.dotBox = this.container.find(data.dotBox) || '';
        this.dotClass = data.dotClass || '';

        this.firstSlide = this.slides.first();
        this.lastSlide = this.slides.last();
        this.dotElem = $(data.dotClass);

        this.prevButton = this.container.find(data.prevButton);
        this.nextButton = this.container.find(data.nextButton);
        this.duration = 500;
        this.reqCssPosition = 0;
        this.reqSlideStrafe = 0;

        this.autoSwitchWork = data.autoswitch;

        this.flag = true;
        this.numb = 1;
        this.timer = 0;
        this.timerDuration = data.time;

        this.startSliderCoord = 0;
        this.currentSliderCoord = 0;

        this.startPointX = 0;
        this.startPointY = 0;
        this.touchDirection = false;



        this.addListeners();
        this.creatDots();
        if(this.autoSwitchWork) {
            this.autoSwitch();
        }

    }

    addListeners() {

        this.prevButton.on('click', e => {
            e.preventDefault();

            this.activeSlide = this.slides.filter('.active');
            let prevSlide = this.activeSlide.prev();
            this.clearTimer();

            if (prevSlide.length) {
                this.moveSlide(prevSlide, 'backward');
            } else {
                this.moveSlide(this.lastSlide, 'backward');
            }
        });


        this.nextButton.on('click', e => {
            e.preventDefault();
            this.activeSlide = this.slides.filter('.active');
            let nextSlide = this.activeSlide.next();
            this.clearTimer();

            if (nextSlide.length) {
                this.moveSlide(nextSlide, 'forward');
            } else {
                this.moveSlide(this.firstSlide, 'forward');
            }
        });

        this.box.on('touchstart', e => {
            this.touchStart(e);
        });
        this.box.on('touchmove', e => {
            this.touchMove(e);
        });
        this.box.on('touchend', e => {
            this.touchEnd(e);
        });

        if (this.dotClass) {
            this.body.on('click', `${this.parentSelector} ${this.dotClass}`, e => {
                e.preventDefault();
                let that = $(e.target),
                    dots = this.dotBox.find(this.dotClass),
                    activeDot = dots.filter('.active'),
                    curDotNum = that.index(),
                    direction = (activeDot.index() < curDotNum) ? 'forward' : 'backward',
                    reqSlide = this.slides.eq(curDotNum);

                this.clearTimer();
                this.moveSlide(reqSlide, direction);

            });
        }

    }


    moveSlide(slide, direction) {
        var that = this;
        let slides = this.slides;
        this.activeSlide = this.slides.filter('.active');

        if (this.flag) {
            this.flag = false;

            if (direction === 'forward') {
                this.reqCssPosition = this.slidesWidth;
                this.reqSlideStrafe = -this.slidesWidth;
            } else if (direction === 'backward') {
                this.reqCssPosition = -this.slidesWidth;
                this.reqSlideStrafe = this.slidesWidth;
            }

            slide.css('left', this.reqCssPosition).addClass('inslide');
            let movableSlide = this.slides.filter('.inslide');

            this.activeSlide.animate({
                left: this.reqSlideStrafe
            }, this.duration);


            movableSlide.animate({
                left: 0
            }, this.duration, function () {
                var $this = $(this);
                slides.css('left', '0').removeClass('active');
                $this.toggleClass('inslide active')

                that.setActiveDot();

                that.flag = true;
            });
        }

    }

    creatDots() {

        this.dotBox.html('');
        let dotMarkup = "<li class='slider__dots-item'></li>";
        let count = this.slides.length - this.numb + 1;

        for (let i = 0; i < count; i++) {
            this.dotBox.append(dotMarkup);
        }

        this.setActiveDot();

    }


    setActiveDot() {

        let activeIndex = this.slides.filter('.active').index();
        this.dotBox.find(`${this.dotClass}`).eq(activeIndex).addClass('active').siblings().removeClass('active');

    }

    autoSwitch() {
        let that = this;

        this.timer = setInterval(function () {

            that.activeSlide = that.slides.filter('.active');
            let nextSlide = that.activeSlide.next();

            if (nextSlide.length) {
                that.moveSlide(nextSlide, 'forward');
            } else {
                that.moveSlide(that.firstSlide, 'forward');
            }

        }, that.timerDuration);
    }

    clearTimer()  {
        if (this.timer) {
            clearInterval(this.timer);
            this.autoSwitch();
        }
    }

    touchStart(e) {
        this.startPointX = e.originalEvent.touches[0].pageX;
        this.startPointY = e.originalEvent.touches[0].pageY;

        this.box.addClass('touch');
    }

    touchMove(e) {
        let currentPointX = e.originalEvent.touches[0].pageX;
        let currentPointY = e.originalEvent.touches[0].pageY;
        let movementX = currentPointX - this.startPointX;
        let movementY = currentPointY - this.startPointY;
        this.activeSlide = this.slides.filter('.active');
        let nextSlide = this.activeSlide.next();

        if (!this.touchDirection) {

            if (Math.abs(movementX) > Math.abs(movementY)) {

                e.preventDefault();
                //this.startSliderCoord = currentPointX;

                this.touchDirection = 'horizontal';

                this.currentSliderCoord = this.startSliderCoord + movementX;

                nextSlide.css('left', this.currentSliderCoord+'px').addClass('inslide');


            } else {
                this.touchDirection = 'vertical';
                return;
            }

        } else if (this.touchDirection == 'vertical') {
            return;

        } else if (this.touchDirection == 'horizontal') {
            e.preventDefault();
            this.currentSliderCoord = this.startSliderCoord + movementX;
            nextSlide.css('left', this.currentSliderCoord+'px').addClass('inslide');
        }
    }

    touchEnd(e) {
        this.activeSlide = this.slides.filter('.active');
        let nextSlide = this.activeSlide.next();
        let prevSlide = this.activeSlide.prev();
        this.box.removeClass('touch');

        // console.log(this.touchDirection);

        if (this.touchDirection == 'horizontal') {

            let slideWidth = this.slides.outerWidth() + parseFloat(this.slides.css('left'));
            // console.log(slideWidth);

            let newCurrentSliderCoord = this.currentSliderCoord;

            let coordDiff = this.currentSliderCoord - this.startSliderCoord;


            if (0 < Math.abs(coordDiff) && Math.abs(coordDiff) < 20) {
                return;
            } else if (coordDiff < 0) {
                newCurrentSliderCoord = newCurrentSliderCoord - slideWidth / 2;

            } else if (coordDiff > 0) {
                newCurrentSliderCoord = newCurrentSliderCoord + slideWidth / 2;
            }

            let sliderNumber = Math.round(newCurrentSliderCoord / slideWidth);



            if (sliderNumber > 0) {
                // console.log('prev');
                // console.log(prevSlide);
                this.moveSlide(prevSlide, 'backward');

            } else {
                // console.log('next');
                // console.log(nextSlide);
                this.moveSlide(nextSlide, 'forward');

            }

            let sliderNumberModule = Math.abs(sliderNumber);

            //
            // if (sliderNumberModule > this.slides.length - this.numb) {
            //     sliderNumberModule = this.slides.length - this.numb;
            //     // console.log(sliderNumberModule);
            //
            // } else if (sliderNumber > 0) {
            //     sliderNumberModule = 0;
            //     // console.log(sliderNumberModule);
            // }

            // this.moveSlide(nextSlide, 'forward');
        }

        this.touchDirection = false;
    }
}


export default Slider;







