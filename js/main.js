$(document).ready(function() {
    var observer = new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting === true) {
            let target_id = entries[0].target.id;
            $('.nav-link').removeClass('active');
            $("a.nav-link[href='#" + target_id + "']").addClass('active');
            history.pushState(null, null, '#' + target_id);
        }
    }, { threshold: [0.4] });

    $('main > div').each(function() {
        observer.observe(this);
    });

    $("a.nav-link[href='" + window.location.hash + "']").addClass('active');
});