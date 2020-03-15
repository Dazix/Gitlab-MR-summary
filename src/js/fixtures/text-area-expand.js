(function (d) {
    d.querySelectorAll('textarea.js-ci-variable-input-value').forEach(elm => {
        if (elm.value) {
            elm.style.height = "450px";
            elm.style.width = "550px";
            elm.style.resize = "both";
            elm.style.marginTop = "40px";
        }
    });
    let contElm = d.querySelector('.content-wrapper div.container-fluid');
    if (contElm) {
        contElm.classList.remove('container-limited', 'limit-container-width');
    }
})(document);
