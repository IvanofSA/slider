import Slider from './modules/slider';



$(function() {

    let priseSlider = new Slider({

        'parent': '.slider-landing',
        'box': '.slider__list-landing',
        'elemSelector': '.slider__item-landing',
        'prevButton': '.sliders__controls-buttons-prev',
        'nextButton': '.sliders__controls-buttons-next',
        'dotBox': '.slider__dots',
        'dotClass': '.slider__dots-item',
        'autoswitch': false,
        'time': '3000'

    });

});
