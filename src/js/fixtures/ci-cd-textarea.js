(function (d) {
    let contElm = d.querySelector('.content-wrapper div.container-fluid');
    if (contElm) {
        contElm.classList.remove('container-limited', 'limit-container-width');
    }
})(document);
