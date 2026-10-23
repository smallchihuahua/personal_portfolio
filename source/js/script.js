/* global AOS */


(function ($) {
    "use strict";

AOS.init({
    once: true
});

    // -----------------------
        // Progress Bar--------------------
        //
        //

    $(window).on ("load", function (){

        $(".progress-bar").each(function(){
                var width = $(this).data("percent");
                $(this).css({"transition": "width 3s"});
                $(this).appear(function() {
                    console.log("hello");
                    $(this).css("width", width + "%");
                    $(this).find(".count").countTo({
                        from: 0,
                        to: width,
                        speed: 3000,
                        refreshInterval: 50
                    });
                });
            });
        });

    $(".owl-carousel").owlCarousel({
        items:1,
        loop:true,
        autoplay:true,
        dots:false,
        autoplayTimeout:8000
    });

    function createPortfolioItem(project, view, index) {
        var item = document.createElement("div");
        var innerBox = document.createElement("div");
        var imageContainer = document.createElement("div");
        var overlay = document.createElement("div");
        var overlayInner = document.createElement("div");
        var overlayContent = document.createElement("div");
        var title = document.createElement("h5");

        var imageLink = document.createElement("a");
        var image = document.createElement("img");
        var picture = document.createElement("picture");

        item.className = "shuffle-item";
        innerBox.className = "position-relative inner-box";
        imageContainer.className = "image position-relative";
        image.className = "img-fluid w-100 d-block";
        image.loading = index < (window.innerWidth < 576 ? 1 : 3) ? "eager" : "lazy";
        if (index === 0) { image.setAttribute("fetchpriority", "high"); }
        image.decoding = "async";
        if (project.width && project.height) {
            image.width = project.width;
            image.height = project.height;
        }
        if (project.srcset) {
            var source = document.createElement("source");
            source.type = "image/webp";
            source.srcset = project.srcset;
            source.sizes = view === "photography" ? "(max-width: 575px) calc(100vw - 40px), (max-width: 1199px) 45vw, 30vw" : "(max-width: 575px) calc(100vw - 40px), 360px";
            image.sizes = source.sizes;
            image.srcset = project.fallbackSrcset;
            picture.appendChild(source);
        }

        if (view === "photography") {
            imageLink.className = "popup-gallery";
            imageLink.href = project.original || project.image;
            imageLink.setAttribute("data-title", project.title || "");
            image.alt = project.alt || project.title || "";
        } else {
            imageLink.className = "portfolio-project-link";
            imageLink.href = project.url;
            imageLink.setAttribute("aria-label", "View " + project.title);
            image.alt = project.coverAlt || project.title;
        }

        image.src = project.thumbnail || (view === "photography" ? project.image : project.cover);
        picture.appendChild(image);
        imageLink.appendChild(picture);
        imageContainer.appendChild(imageLink);

        overlay.className = "overlay-box";
        overlayInner.className = "overlay-inner";
        overlayContent.className = "overlay-content";
        title.className = "mb-0";
        title.textContent = project.title;
        overlayContent.appendChild(title);
        overlayInner.appendChild(overlayContent);
        overlay.appendChild(overlayInner);
        imageContainer.appendChild(overlay);
        innerBox.appendChild(imageContainer);
        item.appendChild(innerBox);

        return item;
    }

    function renderPortfolio(projects, view) {
        var gallery = document.querySelector("[data-portfolio-gallery]");

        if (!gallery) {
            return;
        }

        projects[view].forEach(function (project, index) {
            gallery.appendChild(createPortfolioItem(project, view, index));
        });
    }

    var gallery = document.querySelector("[data-portfolio-gallery]");
    var portfolio = document.querySelector("[data-portfolio-view]");

    if (gallery && portfolio) {
        var view = portfolio.getAttribute("data-portfolio-view");

        if (view === "photography") {
            document.title = "Photography — Streusel Studio";
        }

        $(gallery).magnificPopup({
            delegate: ".popup-gallery",
            type: "image",
            gallery: {
                enabled: true,
                tCounter: "%curr% / %total%"
            },
            image: {
                titleSrc: function (item) {
                    return item.el.attr("data-title") || "";
                }
            }
        });

        window.fetch("/portfolio.json")
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("Portfolio data could not be loaded.");
                }

                return response.json();
            })
            .then(function (data) {
                renderPortfolio(data, view);
            })
            .catch(function (error) {
                gallery.textContent = "Portfolio images could not be loaded.";
                console.error(error);
            });
    }

    document.querySelectorAll("[data-current-year]").forEach(function (element) {
        element.textContent = new Date().getFullYear();
    });

})(jQuery);
