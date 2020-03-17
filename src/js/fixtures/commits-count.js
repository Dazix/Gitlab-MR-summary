(function (d) {
    let currentCommitCount = parseInt(d.querySelector('.commits-tab a span').textContent);
    if (currentCommitCount > 1) {
        let checkExist = setInterval(() => {
            let mergeButton = d.querySelector('.accept-merge-request') || d.querySelector('.js-disabled-merge-button');
            if (mergeButton) {
                mergeButton.innerHTML = 'Merge (<blink>' + currentCommitCount + ' commits</blink>)';

                let blinkElm = mergeButton.querySelector('blink');
                blinkElm.style.transition = 'opacity 200ms';
                blinkElm.style.animation = 'unset';
                setInterval(() => {
                    blinkElm.style.opacity = parseInt(blinkElm.style.opacity) ? '0' : '1';
                }, 400);

                clearInterval(checkExist);
            }
        }, 100);
    }
})(document);
