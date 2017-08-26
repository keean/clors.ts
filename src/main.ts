import 'setimmediate';
import {parse, show} from './parser';

function with_offset(offset : number) {
    function textarea_resize(event : Event) {
        const t = event.target as HTMLElement;
        console.log(t.offsetHeight, t.clientHeight, t.scrollHeight, t.scrollTop);
        t.style.overflowY = 'hidden';
        t.style.height = (t.scrollHeight + offset) + 'px';
    }

    function textarea_resize_delayed(event : Event) {
        const t = event.target as HTMLElement;
        setImmediate(textarea_resize, event);
    }

    return {
        textarea_resize: textarea_resize,
        textarea_resize_delayed: textarea_resize_delayed
    };
}

function textarea_autoresize(t : HTMLTextAreaElement) {
    const height = parseInt(getComputedStyle(t).getPropertyValue('height'));
    const using_offset = with_offset(height - t.scrollHeight);

    t.onchange = using_offset.textarea_resize;
    t.oncut = using_offset.textarea_resize_delayed;
    t.onpaste = using_offset.textarea_resize_delayed;
    t.ondrop = using_offset.textarea_resize_delayed;
    t.onkeydown = using_offset.textarea_resize_delayed;

    using_offset.textarea_resize_delayed({...new Event('resize'), target : t});
}

const code = document.getElementById('code') as HTMLTextAreaElement;
const run = document.getElementById('run') as HTMLButtonElement;
const result = document.getElementById('result') as HTMLDivElement;

textarea_autoresize(code);

run.addEventListener('click', () => {
    while (result.hasChildNodes()) {
        result.removeChild(result.lastChild);
    }
    const r = parse(code.value)
    if (r.status) {
        result.appendChild(document.createTextNode(show(r.value)));
    }
});
