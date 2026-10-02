

(function ($) {
    'use strict';
    
AOS.init({
    once: true
});

    // ----------------------- 
        // Progress Bar--------------------
        // 
        // 

    $(window).on ('load', function (){ 
          
        $('.progress-bar').each(function(){
                var width = $(this).data('percent');
                $(this).css({'transition': 'width 3s'});
                $(this).appear(function() {
                    console.log('hello');
                    $(this).css('width', width + '%');
                    $(this).find('.count').countTo({
                        from: 0,
                        to: width,
                        speed: 3000,
                        refreshInterval: 50
                    });
                });
            });
        }); 

    $('.owl-carousel').owlCarousel({
        items:1,
        loop:true,
        autoplay:true,
        dots:false,
        autoplayTimeout:8000
    });

    // Masonry-style portfolio filtering
    function filterPortfolio(input) {
        $('.portfolio-gallery .shuffle-item').each(function () {
            var groups = this.getAttribute('data-groups');
            var isVisible = input.value === 'all' || groups.indexOf('"' + input.value + '"') !== -1;
            this.classList.toggle('is-filtered-out', !isVisible);
        });
    }

    $('input[name="shuffle-filter"]').on('change', function (evt) {
        var input = evt.currentTarget;
        if (input.checked) {
            filterPortfolio(input);
        }
    });

    function createPortfolioItem(project) {
        var item = document.createElement('div');
        var innerBox = document.createElement('div');
        var imageContainer = document.createElement('div');
        var overlay = document.createElement('div');
        var overlayInner = document.createElement('div');
        var overlayContent = document.createElement('div');
        var title = document.createElement('h5');
        var category = document.createElement('p');

        item.className = 'shuffle-item';
        item.setAttribute('data-groups', JSON.stringify([project.category]));
        innerBox.className = 'position-relative inner-box';
        imageContainer.className = 'image position-relative';

        if (project.images.length > 1) {
            imageContainer.classList.add('portfolio-image-pair');
        }

        project.images.forEach(function (source, index) {
            var image = document.createElement('img');
            image.src = source;
            image.alt = project.title + (project.images.length > 1 ? ' image ' + (index + 1) : '');
            image.className = 'img-fluid w-100 d-block';
            image.loading = 'lazy';
            imageContainer.appendChild(image);
        });

        overlay.className = 'overlay-box';
        overlayInner.className = 'overlay-inner';
        overlayContent.className = 'overlay-content';
        title.className = 'mb-0';
        title.textContent = project.title;
        category.textContent = project.category === 'photo' ? 'photography' : project.category;
        overlayContent.appendChild(title);
        overlayContent.appendChild(category);
        overlayInner.appendChild(overlayContent);
        overlay.appendChild(overlayInner);
        imageContainer.appendChild(overlay);
        innerBox.appendChild(imageContainer);
        item.appendChild(innerBox);

        return item;
    }

    function renderPortfolio(projects) {
        var gallery = document.querySelector('[data-portfolio-gallery]');

        if (!gallery) {
            return;
        }

        projects.forEach(function (project) {
            gallery.appendChild(createPortfolioItem(project));
        });

        filterPortfolio(document.querySelector('input[name="shuffle-filter"]:checked'));
    }

    var gallery = document.querySelector('[data-portfolio-gallery]');

    if (gallery) {
        window.fetch('portfolio.json')
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Portfolio data could not be loaded.');
                }

                return response.json();
            })
            .then(function (data) {
                renderPortfolio(data.projects);
            })
            .catch(function (error) {
                gallery.textContent = 'Portfolio images could not be loaded.';
                console.error(error);
            });
    }


})(jQuery);